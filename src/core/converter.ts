import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { DEBUG } from '@/config';
import {
    extractDiagramFromMacro,
    processDiagram,
    generateMermaidCodeBlock,
    type TargetFormat,
} from './diagram-processor';

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
}

/** Get configured Turndown instance */
function getTurndown(options?: ConvertOptions): TurndownService {
    const useObsidian = options?.useObsidianCallouts ?? false;
    const convertDiagrams = options?.convertDiagrams ?? false;
    const diagramTarget = options?.diagramTargetFormat ?? 'mermaid';
    const embedAsCode = options?.embedDiagramsAsCode ?? true;

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
            return (
                node.classList.contains('drawio-macro') ||
                node.classList.contains('drawio-diagram') ||
                node.dataset.macroName === 'drawio'
            );
        },
        replacement: (_content, node) => {
            const el = node as HTMLElement;
            const diagramName = el.dataset.diagramName ||
                el.getAttribute('data-diagram-name') ||
                'diagram';

            // Try to extract and convert diagram
            if (convertDiagrams) {
                const diagramInfo = extractDiagramFromMacro(el);
                if (diagramInfo && diagramInfo.content) {
                    const processed = processDiagram(diagramInfo, {
                        targetFormat: diagramTarget,
                        embedAsCodeBlocks: embedAsCode,
                        keepOriginalOnError: true,
                        includePngFallback: true,
                    });

                    if (processed.code && embedAsCode) {
                        return `\n${generateMermaidCodeBlock(processed.code, diagramName)}\n\n`;
                    }
                }
            }

            // Fallback: file reference
            return `\n![[${diagramName}.png]]\n\n%% Editable source: ${diagramName}.drawio %%\n\n`;
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

            // Gliffy conversion not yet supported, use PNG fallback
            return `\n![[${diagramName}.png]]\n\n`;
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

            if (convertDiagrams && diagramTarget === 'mermaid' && code) {
                // Try to convert PlantUML to Mermaid
                const diagramInfo = { format: 'plantuml' as const, name: 'plantuml', content: code };
                const processed = processDiagram(diagramInfo, {
                    targetFormat: 'mermaid',
                    embedAsCodeBlocks: true,
                    keepOriginalOnError: true,
                    includePngFallback: false,
                });

                if (processed.code) {
                    return `\n${generateMermaidCodeBlock(processed.code)}\n\n`;
                }
            }

            // Keep as PlantUML code block
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

/** Base selectors to always remove */
const BASE_SELECTORS_TO_REMOVE = [
    '#likes-and-labels-container',
    '#likes-section',
    '#labels-section',
    '.page-metadata-modification-info',
    '#children-section',
    '.plugin_pagetree',
    '.content-action',
    '.page-header-actions',
    '.contributors',
    'script',
    'style',
    '.expand-control',
    '.aui-expander-trigger',
];

export interface SanitizeOptions {
    includeImages: boolean;
    includeComments: boolean;
}

/** Pre-process and sanitize HTML before Turndown conversion */
export function sanitizeHtml(html: string, options: SanitizeOptions, pageId?: string): string {
    if (!html) return '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    if (DEBUG) console.group(`Sanitize HTML for Page ID: ${pageId || 'N/A'}`);

    // Expand collapsed content
    doc.querySelectorAll('.aui-expander-content, .expand-content').forEach((el) => {
        (el as HTMLElement).style.display = 'block';
        el.removeAttribute('aria-hidden');
        const expander = el.closest('.aui-expander-container, .expand-container');
        if (expander) {
            expander.classList.remove('collapsed');
            expander.classList.add('expanded');
        }
    });

    // Remove base selectors
    BASE_SELECTORS_TO_REMOVE.forEach((selector) => {
        doc.querySelectorAll(selector).forEach((el) => el.remove());
    });

    // Conditionally remove comments
    if (!options.includeComments) {
        doc.querySelectorAll('#comments-section, .comment-thread, .inline-comment').forEach((el) => {
            el.remove();
        });
    }

    // Conditionally remove images
    if (!options.includeImages) {
        doc.querySelectorAll('img, .confluence-embedded-image, .image-wrap').forEach((el) => {
            el.remove();
        });
    } else {
        // Add alt text to images without it
        doc.querySelectorAll('img').forEach((img) => {
            if (!img.alt?.trim()) {
                const src = img.src || '';
                const filename = src.split('/').pop()?.split('?')[0] || 'image';
                img.alt = `[Image: ${filename}]`;
            }
        });
    }

    if (DEBUG) console.groupEnd();

    return doc.body.innerHTML;
}

/** Convert sanitized HTML to Markdown */
export function convertToMarkdown(html: string, options?: ConvertOptions): string {
    if (!html) return '';
    const turndown = getTurndown(options);
    return turndown.turndown(html);
}
