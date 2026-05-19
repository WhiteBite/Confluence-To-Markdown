import TurndownService from 'turndown';
import { ctmLog } from '@/utils/logger';
import {
    extractDiagramFromMacro,
    processDiagram,
    generateMermaidCodeBlock,
    generateDiagramWithSvgPreview,
    type TargetFormat,
} from '../diagram-processor';
import type { ConvertOptions } from '../converter';

interface DiagramRuleContext {
    useWikilinks: boolean;
    exportMode: 'copy-as-is' | 'convert' | 'svg-preview';
    diagramTarget: TargetFormat;
    embedAsCode: boolean;
}

function getContext(options?: ConvertOptions): DiagramRuleContext {
    return {
        useWikilinks: options?.useWikilinks ?? true,
        exportMode: options?.diagramExportMode ?? options?.exportMode ?? 'copy-as-is',
        diagramTarget: options?.diagramTargetFormat ?? 'mermaid',
        embedAsCode: options?.embedDiagramsAsCode ?? true,
    };
}

export function applyDiagramRules(turndown: TurndownService, options?: ConvertOptions): void {
    const { useWikilinks, exportMode, diagramTarget, embedAsCode } = getContext(options);

    // Rule: Draw.io diagrams - with conversion support
    turndown.addRule('drawioMacro', {
        filter: node => {
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

            ctmLog('[Draw.io] replacement called with useWikilinks:', useWikilinks);

            // Get diagram name - prefer extracted name (set before script removal)
            let diagramName =
                el.getAttribute('data-extracted-diagram-name') ||
                el.dataset.diagramName ||
                el.getAttribute('data-diagram-name') ||
                '';

            // Fallback to generic name with index if available
            if (!diagramName) {
                const index = el.getAttribute('data-diagram-index');
                diagramName = index ? `diagram-${parseInt(index) + 1}` : 'diagram';
            }

            // Get original image URL from data attribute (set during sanitization)
            const originalImageUrl = el.getAttribute('data-original-image-url') || '';

            ctmLog('[Draw.io] Processing diagram:', {
                name: diagramName,
                exportMode,
                useWikilinks,
                originalImageUrl,
                hasElement: !!el,
                classList: Array.from(el.classList),
            });

            // Helper function to format diagram output based on useWikilinks setting
            const formatDiagramImage = (name: string, imageUrl?: string): string => {
                if (useWikilinks) {
                    return `\n![[_attachments/${name}.png]]\n\n%% Editable source: ${name}.drawio %%\n\n`;
                } else {
                    // Standard markdown - use original URL if available, otherwise just filename
                    const url = imageUrl || `${name}.png`;
                    return `\n![${name}](${url})\n\n`;
                }
            };

            // Mode 1: Copy as-is (default)
            if (exportMode === 'copy-as-is') {
                ctmLog('[Draw.io] Mode: copy-as-is');
                return formatDiagramImage(diagramName, originalImageUrl);
            }

            // Mode 2: SVG preview + source
            if (exportMode === 'svg-preview') {
                ctmLog('[Draw.io] Mode: svg-preview');
                const diagramInfo = extractDiagramFromMacro(el);
                ctmLog('[Draw.io] Extracted info:', {
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
                        ctmLog('[Draw.io] Returning SVG preview');
                        return `\n${generateDiagramWithSvgPreview(processed, {
                            inlineSvg: true,
                            includeSourceLink: true,
                        })}\n\n`;
                    }
                }

                // Fallback
                ctmLog('[Draw.io] SVG preview failed, returning fallback');
                return formatDiagramImage(diagramName, originalImageUrl);
            }

            // Mode 3: Convert to target format
            if (exportMode === 'convert') {
                ctmLog('[Draw.io] Mode: convert to', diagramTarget);
                const diagramInfo = extractDiagramFromMacro(el);
                ctmLog('[Draw.io] Extracted info:', {
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

                    ctmLog('[Draw.io] Processed:', {
                        hasCode: !!processed.code,
                        codeLength: processed.code?.length,
                        error: processed.error,
                    });

                    if (processed.code && embedAsCode) {
                        ctmLog('[Draw.io] Returning mermaid code block');
                        return `\n${generateMermaidCodeBlock(processed.code, diagramName)}\n\n`;
                    }
                }

                // Fallback (conversion requires downloading .drawio file from server)
                ctmLog('[Draw.io] Convert failed, returning fallback');
                if (useWikilinks) {
                    return `\n![[_attachments/${diagramName}.png]]\n\n%% Editable source: ${diagramName}.drawio %%\n%% Note: Conversion requires Download (Obsidian vault) mode to fetch diagram source %%\n\n`;
                } else {
                    const url = originalImageUrl || `${diagramName}.png`;
                    return `\n![${diagramName}](${url})\n\n`;
                }
            }

            // Default fallback
            ctmLog('[Draw.io] No mode matched, returning fallback');
            return formatDiagramImage(diagramName, originalImageUrl);
        },
    });

    // Rule: Gliffy diagrams - with conversion support
    turndown.addRule('gliffyMacro', {
        filter: node => {
            if (!(node instanceof HTMLElement)) return false;
            return (
                node.classList.contains('gliffy-macro') ||
                node.classList.contains('gliffy-diagram') ||
                node.dataset.macroName === 'gliffy'
            );
        },
        replacement: (_content, node) => {
            const el = node as HTMLElement;
            const diagramName =
                el.dataset.diagramName || el.getAttribute('data-diagram-name') || 'diagram';
            const originalImageUrl = el.getAttribute('data-original-image-url') || '';

            // Gliffy conversion not yet supported, use PNG fallback
            if (useWikilinks) {
                return `\n![[_attachments/${diagramName}.png]]\n\n`;
            } else {
                const url = originalImageUrl || `${diagramName}.png`;
                return `\n![${diagramName}](${url})\n\n`;
            }
        },
    });

    // Rule: PlantUML macros - preserve as code block
    turndown.addRule('plantumlMacro', {
        filter: node => {
            if (!(node instanceof HTMLElement)) return false;
            return (
                node.classList.contains('plantuml-macro') || node.dataset.macroName === 'plantuml'
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
                const diagramInfo = {
                    format: 'plantuml' as const,
                    name: 'plantuml',
                    content: code,
                };
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
    turndown.addRule('mermaidMacro', {
        filter: node => {
            if (!(node instanceof HTMLElement)) return false;
            return node.classList.contains('mermaid-macro') || node.dataset.macroName === 'mermaid';
        },
        replacement: (_content, node) => {
            const el = node as HTMLElement;
            const code = el.textContent?.trim() || '';
            return `\n\`\`\`mermaid\n${code}\n\`\`\`\n\n`;
        },
    });
}
