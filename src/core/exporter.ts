import { getBaseUrl } from '@/api/confluence';
import type { PageContentData, PageTreeNode, ExportResult } from '@/api/types';
import type { ExportSettings } from '@/storage/types';
import { convertToMarkdown } from './converter';
import { flattenTree } from './tree-processor';

/** Build final Markdown document from pages */
export function buildMarkdownDocument(
    pages: PageContentData[],
    rootNode: PageTreeNode,
    exportTitle: string,
    settings: ExportSettings
): ExportResult {
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
            const markdown = convertToMarkdown(page.htmlContent);
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
