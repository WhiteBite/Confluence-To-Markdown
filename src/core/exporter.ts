import { getBaseUrl } from '@/api/confluence';
import type { PageContentData, PageTreeNode, ExportResult } from '@/api/types';
import type { ExportSettings } from '@/storage/types';
import { convertToMarkdown, sanitizeHtml } from './converter';
import { flattenTree } from './tree-processor';
import { fetchPageAttachments, downloadAttachment } from './attachment-handler';
import { convertDrawioToMermaid } from './diagrams';
import { convert } from '@whitebite/diagram-converter';

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

    // 1. Convert Draw.io wikilinks: ![[name.png]]%% Editable source: name.drawio %%
    const diagramPattern = /!\[\[([^\]]+)\.png\]\](?:%% Editable source: ([^\s]+)\.drawio %%)?/g;
    const conversions: Array<{ original: string; replacement: string }> = [];
    let match: RegExpExecArray | null;

    while ((match = diagramPattern.exec(markdown)) !== null) {
        const [fullMatch, diagramName] = match;

        if (format === 'mermaid') {
            // Try to convert Draw.io to Mermaid
            const mermaidCode = await convertDrawioToMermaid(pageId, diagramName);

            if (mermaidCode) {
                const replacement = `\`\`\`mermaid\n${mermaidCode}\n\`\`\``;
                conversions.push({ original: fullMatch, replacement });
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
            try {
                // Try to convert PlantUML to Mermaid using wb-diagrams
                const converted = convert(plantumlCode.trim(), {
                    from: 'plantuml',
                    to: 'mermaid',
                    layout: {
                        algorithm: 'dagre',
                        direction: 'TB',
                    },
                });

                if (converted.output) {
                    return `\`\`\`mermaid\n${converted.output}\n\`\`\``;
                }
            } catch (error) {
                console.warn('Failed to convert PlantUML to Mermaid:', error);
            }

            // Keep original if conversion failed
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
    diagramFormat: 'mermaid' | 'drawio-xml' | 'wikilink' = 'wikilink'
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

            // Convert to markdown (diagrams will be as wikilinks)
            let markdown = convertToMarkdown(sanitizedHtml);

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
