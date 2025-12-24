import { getBaseUrl } from '@/api/confluence';
import type { PageContentData, PageTreeNode, ExportResult } from '@/api/types';
import type { ExportSettings } from '@/storage/types';
import { convertToMarkdown, sanitizeHtml } from './converter';
import { flattenTree } from './tree-processor';
import { fetchPageAttachments, downloadAttachment } from './attachment-handler';
import { convertDrawioToMermaid } from './diagrams';
import { convert } from '@whitebite/diagram-converter';

/**
 * Check if mermaid output is empty (just header, no content)
 * Empty diagrams look like: "flowchart TB" or "flowchart LR" with no nodes/edges
 */
function isEmptyMermaidOutput(mermaidCode: string): boolean {
    const trimmed = mermaidCode.trim();

    // Match empty flowchart patterns: "flowchart TB", "flowchart LR", etc.
    const emptyFlowchartPattern = /^flowchart\s+(TB|BT|LR|RL|TD)\s*$/;
    if (emptyFlowchartPattern.test(trimmed)) {
        return true;
    }

    // Check if there are any node definitions or edges after header
    const lines = trimmed.split('\n').slice(1); // Skip header line
    const hasContent = lines.some(line => {
        const l = line.trim();
        // Skip empty lines, comments, and subgraph/end keywords
        if (!l || l.startsWith('%%') || l === 'end') return false;
        // Has actual content (node definition or edge)
        return l.length > 0;
    });

    return !hasContent;
}

/**
 * Check if PlantUML code is valid (not a placeholder or garbage)
 * Valid PlantUML should have @startuml/@enduml or be a recognizable diagram type
 */
function isValidPlantUmlCode(code: string): boolean {
    const trimmed = code.trim();

    // Must have @startuml or be a known diagram type
    if (trimmed.includes('@startuml') || trimmed.includes('@startmindmap') ||
        trimmed.includes('@startwbs') || trimmed.includes('@startgantt') ||
        trimmed.includes('@startsalt') || trimmed.includes('@startjson') ||
        trimmed.includes('@startyaml')) {
        return true;
    }

    // Check for common PlantUML patterns without explicit start tag
    // e.g., "A -> B" or "class Foo"
    const hasArrow = /\w+\s*-+>|<-+\s*\w+/.test(trimmed);
    const hasClassDef = /^(class|interface|abstract|enum)\s+\w+/m.test(trimmed);
    const hasUseCaseDef = /^\s*\([^)]+\)\s*$/m.test(trimmed);

    if (hasArrow || hasClassDef || hasUseCaseDef) {
        return true;
    }

    // Reject if it looks like placeholder text from Confluence
    if (trimmed.includes('Welcome to PlantUML') ||
        trimmed.includes('You can start with') ||
        trimmed.includes('plantuml.com')) {
        return false;
    }

    // Reject if too short or no recognizable structure
    if (trimmed.length < 10) {
        return false;
    }

    return false;
}

/**
 * Post-process markdown to convert diagram wikilinks to code blocks
 */
async function convertDiagramsInMarkdown(
    markdown: string,
    pageId: string,
    format: 'mermaid' | 'drawio-xml' | 'wikilink'
): Promise<string> {
    if (format === 'wikilink') {
        return markdown; // Keep as wikilinks
    }

    let result = markdown;

    // 1. Convert Draw.io wikilinks: ![[name.png]] followed by %% Editable source: name.drawio %%
    // Pattern handles newlines between wikilink and comment
    const diagramPattern = /!\[\[([^\]]+)\.png\]\]\s*(?:\n\s*)*(?:%% Editable source: ([^\s]+)\.drawio %%)?(?:\s*%% Note:[^%]*%%)?/g;
    const conversions: Array<{ original: string; replacement: string }> = [];
    let match: RegExpExecArray | null;

    while ((match = diagramPattern.exec(markdown)) !== null) {
        const [fullMatch, diagramName] = match;

        console.log(`[Exporter] Found diagram: ${diagramName}, converting to ${format}`);

        if (format === 'mermaid') {
            // Try to convert Draw.io to Mermaid
            const mermaidCode = await convertDrawioToMermaid(pageId, diagramName);

            if (mermaidCode) {
                console.log(`[Exporter] Successfully converted ${diagramName} to Mermaid`);
                const replacement = `\`\`\`mermaid\n${mermaidCode}\n\`\`\``;
                conversions.push({ original: fullMatch, replacement });
            } else {
                console.log(`[Exporter] Failed to convert ${diagramName}, keeping wikilink`);
            }
        } else if (format === 'drawio-xml') {
            // Try to get Draw.io XML source
            try {
                const attachments = await fetchPageAttachments(pageId);
                const drawioAttachment = attachments.find(
                    att => att.filename === `${diagramName}.drawio` ||
                        att.filename === `${diagramName}.drawio.xml` ||
                        att.filename === diagramName
                );

                if (drawioAttachment?.downloadUrl) {
                    const xmlBlob = await downloadAttachment(drawioAttachment.downloadUrl);
                    const xmlText = await xmlBlob.text();
                    console.log(`[Exporter] Successfully downloaded ${diagramName} XML`);
                    const replacement = `\`\`\`xml\n${xmlText}\n\`\`\``;
                    conversions.push({ original: fullMatch, replacement });
                }
            } catch (error) {
                // Keep as wikilink if can't download
                console.warn(`Failed to download Draw.io XML for ${diagramName}:`, error);
            }
        }
    }

    // Apply Draw.io conversions
    for (const { original, replacement } of conversions) {
        result = result.replace(original, replacement);
    }

    // 2. Convert PlantUML code blocks if format is mermaid
    if (format === 'mermaid') {
        const plantumlPattern = /```plantuml\n([\s\S]*?)\n```/g;

        result = result.replace(plantumlPattern, (fullMatch, plantumlCode) => {
            const code = plantumlCode.trim();

            // Skip invalid/placeholder PlantUML code
            if (!isValidPlantUmlCode(code)) {
                console.warn('[Exporter] Invalid PlantUML code (placeholder or garbage), keeping original');
                return fullMatch;
            }

            try {
                // Try to convert PlantUML to Mermaid using wb-diagrams
                const converted = convert(code, {
                    from: 'plantuml',
                    to: 'mermaid',
                    layout: {
                        algorithm: 'dagre',
                        direction: 'TB',
                    },
                });

                // Check if conversion produced valid (non-empty) mermaid
                if (converted.output && !isEmptyMermaidOutput(converted.output)) {
                    console.log('[Exporter] Successfully converted PlantUML to Mermaid');
                    return `\`\`\`mermaid\n${converted.output}\n\`\`\``;
                } else {
                    console.warn('[Exporter] PlantUML conversion produced empty diagram, keeping original');
                }
            } catch (error) {
                console.warn('Failed to convert PlantUML to Mermaid:', error);
            }

            // Keep original if conversion failed or produced empty result
            return fullMatch;
        });
    }

    return result;
}

/** Build final Markdown document from pages */
export async function buildMarkdownDocument(
    pages: PageContentData[],
    rootNode: PageTreeNode,
    exportTitle: string,
    settings: ExportSettings,
    diagramFormat: 'mermaid' | 'drawio-xml' | 'wikilink' = 'wikilink',
    diagramExportMode: 'copy-as-is' | 'convert' | 'svg-preview' = 'copy-as-is'
): Promise<ExportResult> {
    const flatTree = flattenTree(rootNode);
    const treeMap = new Map(flatTree.map((n) => [n.id, n]));
    const lines: string[] = [];
    const baseUrl = getBaseUrl();

    // Document header
    lines.push(`# ${exportTitle}`);
    lines.push('');

    // Metadata (optional)
    if (settings.includeMetadata) {
        lines.push('## Metadata');
        lines.push('');
        lines.push(`- **Root Page ID:** ${rootNode.id}`);
        lines.push(`- **Total Pages:** ${pages.length}`);
        lines.push(`- **Export Date:** ${new Date().toISOString()}`);
        lines.push('');
    }

    // Table of Contents
    lines.push('## Table of Contents');
    lines.push('');

    const baseLevel = rootNode.level;
    for (const page of pages) {
        if (page.error) continue;
        const node = treeMap.get(page.id);
        const relativeLevel = node ? node.level - baseLevel : 0;
        const indent = '  '.repeat(relativeLevel);
        const anchor = makeAnchor(page.title);
        lines.push(`${indent}- [${page.title}](#${anchor})`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');

    // Page contents
    for (const page of pages) {
        const node = treeMap.get(page.id);
        const relativeLevel = node ? node.level - baseLevel : 0;
        const headingLevel = Math.min(relativeLevel + 2, 6); // h2-h6
        const heading = '#'.repeat(headingLevel);

        lines.push(`${heading} ${page.title}`);
        lines.push('');

        // Source link (optional)
        if (settings.includeSourceLinks) {
            const pageUrl = `${baseUrl}/pages/viewpage.action?pageId=${page.id}`;
            lines.push(`> Source: ${pageUrl}`);
            lines.push('');
        }

        // Version metadata (optional)
        if (settings.includeMetadata && page.version) {
            const date = new Date(page.version.when).toLocaleDateString();
            lines.push(`*Last updated: ${date}*`);
            lines.push('');
        }

        if (page.error) {
            lines.push('*Error loading page content*');
        } else {
            // Sanitize HTML first to extract diagram names
            const sanitizedHtml = sanitizeHtml(page.htmlContent, {
                includeImages: settings.includeImages,
                includeComments: settings.includeComments,
            }, page.id);

            // Convert to markdown with diagram export mode
            let markdown = convertToMarkdown(sanitizedHtml, {
                diagramExportMode,
                diagramTargetFormat: diagramFormat,
                embedDiagramsAsCode: true,
            });

            // Convert diagrams based on format setting
            markdown = await convertDiagramsInMarkdown(markdown, page.id, diagramFormat);

            lines.push(markdown);
        }

        lines.push('');
        lines.push('---');
        lines.push('');
    }

    return {
        markdown: lines.join('\n'),
        pageCount: pages.length,
        title: exportTitle,
    };
}

/** Create URL-safe anchor from title */
function makeAnchor(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

/** Trigger file download */
export function downloadMarkdown(result: ExportResult): void {
    const blob = new Blob([result.markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const filename = `${sanitizeFilename(result.title)}.md`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/** Copy markdown to clipboard */
export async function copyToClipboard(result: ExportResult): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(result.markdown);
        return true;
    } catch (error) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = result.markdown;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
    }
}

/** Sanitize filename */
function sanitizeFilename(name: string): string {
    return name
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\s+/g, '_')
        .substring(0, 100);
}
