import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import {
    extractDiagramFromMacro,
    processDiagram,
    generateMermaidCodeBlock,
    generateDiagramWithSvgPreview,
    type TargetFormat,
} from './diagram-processor';
import type { DiagramInfo } from './sanitizer';

// Re-export sanitizer functions for backward compatibility
export { sanitizeHtml, extractDiagramInfoFromHtml, type DiagramInfo, type SanitizeOptions } from './sanitizer';

let turndownInstance: TurndownService | null = null;
let obsidianTurndownInstance: TurndownService | null = null;
let diagramConvertInstance: TurndownService | null = null;

export interface ConvertOptions {
    useObsidianCallouts?: boolean;
    /** Enable diagram conversion */
    convertDiagrams?: boolean;
    /** Target format for diagrams */
    diagramTargetFormat?: TargetFormat;
    /** Embed diagrams as code blocks (vs file references) */
    embedDiagramsAsCode?: boolean;
    /** Diagram export mode */
    diagramExportMode?: 'copy-as-is' | 'convert' | 'svg-preview';
    /** Pre-extracted diagram info (extracted before sanitization) */
    diagramInfo?: DiagramInfo[];
}

/** Get configured Turndown instance */
function getTurndown(options?: ConvertOptions): TurndownService {
    const useObsidian = options?.useObsidianCallouts ?? false;
    const convertDiagrams = options?.convertDiagrams ?? false;
    const diagramTarget = options?.diagramTargetFormat ?? 'mermaid';
    const embedAsCode = options?.embedDiagramsAsCode ?? true;
    const exportMode = options?.diagramExportMode ?? 'copy-as-is';

    console.log('[Converter] getTurndown called with options:', {
        useObsidian,
        convertDiagrams,
        diagramTarget,
        embedAsCode,
        exportMode,
        rawExportMode: options?.diagramExportMode,
    });

    // Return cached instance if available (simplified caching)
    if (useObsidian && !convertDiagrams && obsidianTurndownInstance) return obsidianTurndownInstance;
    if (!useObsidian && !convertDiagrams && turndownInstance) return turndownInstance;
    if (convertDiagrams && diagramConvertInstance) return diagramConvertInstance;

    const instance = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        bulletListMarker: '-',
        emDelimiter: '*',
    });

    // Add GFM support (tables, strikethrough, task lists)
    instance.use(gfm);

    // Rule: Confluence info/note/warning/tip macros
    if (useObsidian) {
        // Obsidian callout format: > [!type] Title
        instance.addRule('confluenceMacrosObsidian', {
            filter: (node) => {
                if (!(node instanceof HTMLElement)) return false;
                return (
                    node.classList.contains('confluence-information-macro') ||
                    (node.tagName === 'DIV' && node.dataset.macroName === 'panel')
                );
            },
            replacement: (_content, node) => {
                const el = node as HTMLElement;
                let type = 'info';

                const macroName = el.dataset.macroName || '';
                if (macroName.includes('note') || el.classList.contains('confluence-information-macro-note')) {
                    type = 'note';
                } else if (macroName.includes('tip') || el.classList.contains('confluence-information-macro-tip')) {
                    type = 'tip';
                } else if (macroName.includes('warning') || el.classList.contains('confluence-information-macro-warning')) {
                    type = 'warning';
                }

                const titleEl = el.querySelector('.confluence-information-macro-title, .panelHeader');
                const title = titleEl?.textContent?.trim() || '';

                const bodyEl = el.querySelector('.confluence-information-macro-body, .panelContent');
                const body = bodyEl?.textContent?.trim() || el.textContent?.trim() || '';

                const header = title ? `> [!${type}] ${title}` : `> [!${type}]`;
                const lines = body.split('\n').map((line) => `> ${line}`).join('\n');

                return `\n${header}\n${lines}\n\n`;
            },
        });
    } else {
        // Standard blockquote format
        instance.addRule('confluenceMacros', {
            filter: (node) => {
                if (!(node instanceof HTMLElement)) return false;
                return (
                    node.classList.contains('confluence-information-macro') ||
                    (node.tagName === 'DIV' && node.dataset.macroName === 'panel')
                );
            },
            replacement: (_content, node) => {
                const el = node as HTMLElement;
                let type = 'Info';

                const macroName = el.dataset.macroName || '';
                if (macroName.includes('note') || el.classList.contains('confluence-information-macro-note')) {
                    type = 'Note';
                } else if (macroName.includes('tip') || el.classList.contains('confluence-information-macro-tip')) {
                    type = 'Tip';
                } else if (macroName.includes('warning') || el.classList.contains('confluence-information-macro-warning')) {
                    type = 'Warning';
                }

                const titleEl = el.querySelector('.confluence-information-macro-title, .panelHeader');
                const title = titleEl?.textContent?.trim() || '';

                const bodyEl = el.querySelector('.confluence-information-macro-body, .panelContent');
                const body = bodyEl?.textContent?.trim() || el.textContent?.trim() || '';

                const header = title ? `**${type}: ${title}**` : `**${type}**`;
                const lines = body.split('\n').map((line) => `> ${line}`).join('\n');

                return `\n${header}\n${lines}\n\n`;
            },
        });
    }

    // Rule: Expand/collapse sections -> HTML details
    instance.addRule('expandCollapse', {
        filter: (node) => {
            if (!(node instanceof HTMLElement)) return false;
            return (
                node.classList.contains('expand-container') ||
                node.classList.contains('aui-expander-container')
            );
        },
        replacement: (_content, node) => {
            const el = node as HTMLElement;
            const titleEl = el.querySelector('.expand-control-text, .aui-expander-trigger');
            const title = titleEl?.textContent?.trim() || 'Details';

            const contentEl = el.querySelector('.expand-content, .aui-expander-content');
            const content = contentEl?.textContent?.trim() || '';

            return `\n<details>\n<summary>${title}</summary>\n\n${content}\n\n</details>\n\n`;
        },
    });

    // Rule: Draw.io diagrams - with conversion support
    instance.addRule('drawioMacro', {
        filter: (node) => {
            if (!(node instanceof HTMLElement)) return false;

            const macroName = node.getAttribute('data-macro-name') || '';

            // Direct matches by class or data attribute
            if (
                node.classList.contains('drawio-macro') ||
                node.classList.contains('drawio-diagram') ||
                macroName === 'drawio' ||
                macroName === 'drawio-sketch'
            ) {
                return true;
            }

            // Confluence Cloud/Server format
            if (
                node.classList.contains('conf-macro') &&
                (macroName === 'drawio' || macroName === 'drawio-sketch')
            ) {
                return true;
            }

            // Match by extracted diagram data (set during sanitization)
            if (node.getAttribute('data-extracted-diagram-name')) {
                return true;
            }

            // Only match elements that directly contain geDiagramContainer (not ancestors)
            if (node.classList.contains('geDiagramContainer')) {
                return true;
            }

            return false;
        },
        replacement: (_content, node) => {
            const el = node as HTMLElement;

            console.log('[Draw.io] replacement called with content:', _content);

            // Get diagram name - prefer extracted name (set before script removal)
            let diagramName = el.getAttribute('data-extracted-diagram-name') ||
                el.dataset.diagramName ||
                el.getAttribute('data-diagram-name') ||
                '';

            // Fallback to generic name with index if available
            if (!diagramName) {
                const index = el.getAttribute('data-diagram-index');
                diagramName = index ? `diagram-${parseInt(index) + 1}` : 'diagram';
            }

            console.log('[Draw.io] Processing diagram:', {
                name: diagramName,
                exportMode,
                hasElement: !!el,
                classList: Array.from(el.classList),
            });

            // Mode 1: Copy as-is (default) - always return wikilink with _attachments path
            if (exportMode === 'copy-as-is') {
                console.log('[Draw.io] Mode: copy-as-is, returning wikilink');
                const result = `\n![[_attachments/${diagramName}.png]]\n\n%% Editable source: ${diagramName}.drawio %%\n\n`;
                console.log('[Draw.io] Returning:', result);
                return result;
            }

            // Mode 2: SVG preview + source
            if (exportMode === 'svg-preview') {
                console.log('[Draw.io] Mode: svg-preview');
                const diagramInfo = extractDiagramFromMacro(el);
                console.log('[Draw.io] Extracted info:', {
                    hasInfo: !!diagramInfo,
                    hasSvg: !!diagramInfo?.renderedSvg,
                    svgLength: diagramInfo?.renderedSvg?.length,
                });

                if (diagramInfo) {
                    const processed = processDiagram(diagramInfo, {
                        targetFormat: diagramTarget,
                        embedAsCodeBlocks: embedAsCode,
                        keepOriginalOnError: true,
                        includePngFallback: true,
                        exportMode: 'svg-preview',
                    });

                    if (processed.svgPreview) {
                        console.log('[Draw.io] Returning SVG preview');
                        return `\n${generateDiagramWithSvgPreview(processed, {
                            inlineSvg: true,
                            includeSourceLink: true,
                        })}\n\n`;
                    }
                }

                // Fallback: wikilink with _attachments path
                console.log('[Draw.io] SVG preview failed, returning wikilink');
                return `\n![[_attachments/${diagramName}.png]]\n\n%% Editable source: ${diagramName}.drawio %%\n\n`;
            }

            // Mode 3: Convert to target format
            if (exportMode === 'convert') {
                console.log('[Draw.io] Mode: convert to', diagramTarget);
                const diagramInfo = extractDiagramFromMacro(el);
                console.log('[Draw.io] Extracted info:', {
                    hasInfo: !!diagramInfo,
                    hasContent: !!diagramInfo?.content,
                    contentLength: diagramInfo?.content?.length,
                });

                if (diagramInfo && diagramInfo.content) {
                    const processed = processDiagram(diagramInfo, {
                        targetFormat: diagramTarget,
                        embedAsCodeBlocks: embedAsCode,
                        keepOriginalOnError: true,
                        includePngFallback: true,
                        exportMode: 'convert',
                    });

                    console.log('[Draw.io] Processed:', {
                        hasCode: !!processed.code,
                        codeLength: processed.code?.length,
                        error: processed.error,
                    });

                    if (processed.code && embedAsCode) {
                        console.log('[Draw.io] Returning mermaid code block');
                        return `\n${generateMermaidCodeBlock(processed.code, diagramName)}\n\n`;
                    }
                }

                // Fallback: wikilink with _attachments path (conversion requires downloading .drawio file from server)
                console.log('[Draw.io] Convert failed, returning wikilink');
                return `\n![[_attachments/${diagramName}.png]]\n\n%% Editable source: ${diagramName}.drawio %%\n%% Note: Conversion requires Download (Obsidian vault) mode to fetch diagram source %%\n\n`;
            }

            // Default fallback with _attachments path
            console.log('[Draw.io] No mode matched, returning wikilink');
            return `\n![[_attachments/${diagramName}.png]]\n\n%% Editable source: ${diagramName}.drawio %%\n\n`;
        },
    });

    // Rule: Gliffy diagrams - with conversion support
    instance.addRule('gliffyMacro', {
        filter: (node) => {
            if (!(node instanceof HTMLElement)) return false;
            return (
                node.classList.contains('gliffy-macro') ||
                node.classList.contains('gliffy-diagram') ||
                node.dataset.macroName === 'gliffy'
            );
        },
        replacement: (_content, node) => {
            const el = node as HTMLElement;
            const diagramName = el.dataset.diagramName ||
                el.getAttribute('data-diagram-name') ||
                'diagram';

            // Gliffy conversion not yet supported, use PNG fallback with _attachments path
            return `\n![[_attachments/${diagramName}.png]]\n\n`;
        },
    });

    // Rule: PlantUML macros - preserve as code block
    instance.addRule('plantumlMacro', {
        filter: (node) => {
            if (!(node instanceof HTMLElement)) return false;
            return (
                node.classList.contains('plantuml-macro') ||
                node.dataset.macroName === 'plantuml'
            );
        },
        replacement: (_content, node) => {
            const el = node as HTMLElement;
            const code = el.textContent?.trim() || '';

            // Mode 1: Copy as-is
            if (exportMode === 'copy-as-is') {
                return `\n\`\`\`plantuml\n${code}\n\`\`\`\n\n`;
            }

            // Mode 2: SVG preview + source
            if (exportMode === 'svg-preview') {
                const diagramInfo = extractDiagramFromMacro(el);
                if (diagramInfo && diagramInfo.renderedSvg) {
                    const processed = processDiagram(diagramInfo, {
                        targetFormat: 'original',
                        embedAsCodeBlocks: true,
                        keepOriginalOnError: true,
                        includePngFallback: false,
                        exportMode: 'svg-preview',
                    });

                    if (processed.svgPreview) {
                        return `\n${generateDiagramWithSvgPreview(processed, {
                            inlineSvg: true,
                            includeSourceLink: false,
                        })}\n\n\`\`\`plantuml\n${code}\n\`\`\`\n\n`;
                    }
                }

                // Fallback: code block only
                return `\n\`\`\`plantuml\n${code}\n\`\`\`\n\n`;
            }

            // Mode 3: Convert to target format
            if (exportMode === 'convert' && diagramTarget === 'mermaid' && code) {
                const diagramInfo = { format: 'plantuml' as const, name: 'plantuml', content: code };
                const processed = processDiagram(diagramInfo, {
                    targetFormat: 'mermaid',
                    embedAsCodeBlocks: true,
                    keepOriginalOnError: true,
                    includePngFallback: false,
                    exportMode: 'convert',
                });

                if (processed.code) {
                    return `\n${generateMermaidCodeBlock(processed.code)}\n\n`;
                }
            }

            // Default: Keep as PlantUML code block
            return `\n\`\`\`plantuml\n${code}\n\`\`\`\n\n`;
        },
    });

    // Rule: Mermaid macros - preserve as code block
    instance.addRule('mermaidMacro', {
        filter: (node) => {
            if (!(node instanceof HTMLElement)) return false;
            return (
                node.classList.contains('mermaid-macro') ||
                node.dataset.macroName === 'mermaid'
            );
        },
        replacement: (_content, node) => {
            const el = node as HTMLElement;
            const code = el.textContent?.trim() || '';
            return `\n\`\`\`mermaid\n${code}\n\`\`\`\n\n`;
        },
    });

    // Rule: AUI lozenges (status badges) -> inline text
    instance.addRule('auiLozenge', {
        filter: (node) => {
            if (!(node instanceof HTMLElement)) return false;
            return node.classList.contains('aui-lozenge');
        },
        replacement: (content) => {
            return content ? `[${content.trim()}]` : '';
        },
    });

    // Rule: Task lists
    instance.addRule('taskList', {
        filter: (node) => {
            if (!(node instanceof HTMLElement)) return false;
            return node.classList.contains('task-list-item');
        },
        replacement: (content, node) => {
            const el = node as HTMLElement;
            const isComplete = el.dataset.taskStatus === 'complete';
            const checkbox = isComplete ? '[x]' : '[ ]';
            return `- ${checkbox} ${content.trim()}\n`;
        },
    });

    // Rule: Code blocks with language
    instance.addRule('codeBlock', {
        filter: (node) => {
            if (!(node instanceof HTMLElement)) return false;
            return (
                node.tagName === 'PRE' ||
                node.classList.contains('code') ||
                node.classList.contains('codeContent')
            );
        },
        replacement: (content, node) => {
            const el = node as HTMLElement;
            const lang = el.dataset.language || el.className.match(/language-(\w+)/)?.[1] || '';
            const code = content.trim();
            return `\n\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
        },
    });

    // Remove empty links
    instance.addRule('emptyLinks', {
        filter: (node) => {
            if (!(node instanceof HTMLElement)) return false;
            return node.tagName === 'A' && !node.textContent?.trim();
        },
        replacement: () => '',
    });

    // Rule: Images - convert to Obsidian wikilinks with _attachments path
    if (useObsidian) {
        instance.addRule('obsidianImages', {
            filter: 'img',
            replacement: (_content, node) => {
                const img = node as HTMLImageElement;
                const src = img.getAttribute('src') || '';
                const alt = img.getAttribute('alt') || '';

                // Extract filename from URL
                let filename = '';
                try {
                    const url = new URL(src, 'https://example.com');
                    // Get filename from path
                    const pathParts = url.pathname.split('/');
                    filename = pathParts[pathParts.length - 1];
                    // Remove query params from filename
                    filename = filename.split('?')[0];
                    // Decode URI components
                    filename = decodeURIComponent(filename);
                } catch {
                    // Fallback: extract from src directly
                    filename = src.split('/').pop()?.split('?')[0] || 'image.png';
                    try {
                        filename = decodeURIComponent(filename);
                    } catch {
                        // Keep as is
                    }
                }

                // Use wikilink format with _attachments path
                if (alt && alt !== `[Image: ${filename}]`) {
                    return `\n![[_attachments/${filename}|${alt}]]\n`;
                }
                return `\n![[_attachments/${filename}]]\n`;
            },
        });
    }

    // Rule: Confluence tables
    instance.addRule('confluenceTable', {
        filter: (node) => {
            if (!(node instanceof HTMLElement)) return false;
            return node.tagName === 'TABLE' && node.classList.contains('confluenceTable');
        },
        replacement: (_content, node) => {
            const el = node as HTMLTableElement;
            const rows = Array.from(el.querySelectorAll('tr'));
            if (rows.length === 0) return '';

            const result: string[] = [];
            let hasHeader = false;

            rows.forEach((row, rowIndex) => {
                const cells = Array.from(row.querySelectorAll('th, td'));
                const isHeaderRow = cells.some((c) => c.tagName === 'TH');

                const cellContents = cells.map((cell) => {
                    return (cell.textContent || '').replace(/\n/g, ' ').replace(/\|/g, '\\|').trim();
                });

                result.push(`| ${cellContents.join(' | ')} |`);

                if (isHeaderRow && !hasHeader) {
                    hasHeader = true;
                    result.push(`| ${cells.map(() => '---').join(' | ')} |`);
                } else if (rowIndex === 0 && !hasHeader) {
                    hasHeader = true;
                    result.push(`| ${cells.map(() => '---').join(' | ')} |`);
                }
            });

            return `\n\n${result.join('\n')}\n\n`;
        },
    });

    // Cache the instance (simplified - diagram conversion creates new instance each time)
    if (convertDiagrams) {
        diagramConvertInstance = instance;
    } else if (useObsidian) {
        obsidianTurndownInstance = instance;
    } else {
        turndownInstance = instance;
    }

    return instance;
}



/** Convert sanitized HTML to Markdown */
export function convertToMarkdown(html: string, options?: ConvertOptions): string {
    if (!html) return '';
    const turndown = getTurndown(options);
    return turndown.turndown(html);
}
