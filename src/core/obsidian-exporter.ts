import { zipSync, strToU8 } from 'fflate';
import { getBaseUrl } from '@/api/confluence';
import type {
    PageContentData,
    PageTreeNode,
    ObsidianExportSettings,
    ObsidianExportResult,
} from '@/api/types';
import { convertToMarkdown, sanitizeHtml } from './converter';
import { flattenTree } from './tree-processor';
import {
    convertToWikilinks,
    sanitizeFilename,
    makeWikilink,
} from './link-resolver';
import {
    fetchPageAttachments,
    isImageAttachment,
    exportImageAttachment,
} from './attachment-handler';

export type ProgressCallback = (phase: string, current: number, total: number) => void;

interface PageFile {
    path: string;
    content: string;
    pageId: string;
}

interface AttachmentFile {
    path: string;
    blob: Blob;
}

/** Generate YAML frontmatter for a page */
function generateFrontmatter(
    page: PageContentData,
    node: PageTreeNode | undefined,
    pageMap: Map<string, string>,
    settings: ObsidianExportSettings
): string {
    const lines: string[] = ['---'];
    const baseUrl = getBaseUrl();

    lines.push(`title: "${page.title.replace(/"/g, '\\"')}"`);
    lines.push('aliases: []');

    if (settings.includeConfluenceMetadata) {
        lines.push('confluence:');
        lines.push(`  id: "${page.id}"`);
        lines.push(`  url: "${baseUrl}/pages/viewpage.action?pageId=${page.id}"`);
        if (page.version) {
            lines.push(`  version: ${page.version.number}`);
            lines.push(`  lastModified: "${page.version.when}"`);
        }
    }

    // Parent link
    if (node?.parentId) {
        const parentTitle = pageMap.get(node.parentId);
        if (parentTitle) {
            lines.push(`parent: "[[${parentTitle}]]"`);
        }
    }

    // Children links
    if (node && node.children.length > 0) {
        lines.push('children:');
        for (const child of node.children) {
            lines.push(`  - "[[${child.title}]]"`);
        }
    }

    // Tags
    lines.push('tags:');
    lines.push('  - confluence/imported');

    // Dates
    if (page.version?.when) {
        const date = page.version.when.split('T')[0];
        lines.push(`updated: ${date}`);
    }

    lines.push('---');
    lines.push('');

    return lines.join('\n');
}

/** Convert page content to Obsidian-compatible markdown */
function convertPageContent(
    page: PageContentData,
    pageMap: Map<string, string>,
    settings: ObsidianExportSettings
): string {
    // Sanitize HTML
    const sanitizedHtml = sanitizeHtml(page.htmlContent, {
        includeImages: settings.includeImages,
        includeComments: settings.includeComments,
    }, page.id);

    // Convert to markdown with Obsidian options and diagram conversion
    let markdown = convertToMarkdown(sanitizedHtml, {
        useObsidianCallouts: settings.useObsidianCallouts,
        diagramExportMode: settings.diagramExportMode,
        diagramTargetFormat: settings.diagramTargetFormat,
        embedDiagramsAsCode: settings.embedDiagramsAsCode,
    });

    // Convert links to wikilinks if enabled
    if (settings.linkStyle === 'wikilink' && settings.resolveInternalLinks) {
        const titleMap = {
            byId: pageMap,
            byTitle: new Map(Array.from(pageMap.entries()).map(([id, title]) => [title.toLowerCase(), id])),
        };
        const result = convertToWikilinks(markdown, titleMap, page.id);
        markdown = result.markdown;
    }

    return markdown;
}

/** Build folder path for a page based on hierarchy */
function buildPagePath(
    node: PageTreeNode,
    flatTree: PageTreeNode[],
    settings: ObsidianExportSettings
): string {
    if (settings.folderStructure === 'flat') {
        return sanitizeFilename(node.title) + '.md';
    }

    // Hierarchical: build path from ancestors
    const pathParts: string[] = [];
    let current: PageTreeNode | undefined = node;

    // Find ancestors
    const nodeMap = new Map(flatTree.map((n) => [n.id, n]));

    while (current) {
        if (current.children.length > 0 || current.parentId === null) {
            // This node has children or is root - it becomes a folder
            pathParts.unshift(sanitizeFilename(current.title));
        }

        if (current.parentId) {
            current = nodeMap.get(current.parentId);
        } else {
            break;
        }
    }

    // If node has children, put the file inside its own folder
    if (node.children.length > 0) {
        return [...pathParts, sanitizeFilename(node.title) + '.md'].join('/');
    }

    // Otherwise, file goes in parent's folder
    return [...pathParts.slice(0, -1), sanitizeFilename(node.title) + '.md'].join('/').replace(/^\//, '');
}

/** Generate index file (MOC) */
function generateIndexFile(
    rootNode: PageTreeNode,
    pages: PageContentData[],
    stats: { attachments: number; diagrams: number }
): string {
    const lines: string[] = [];

    // Frontmatter
    lines.push('---');
    lines.push('title: "Confluence Export Index"');
    lines.push(`created: ${new Date().toISOString().split('T')[0]}`);
    lines.push('tags:');
    lines.push('  - confluence/index');
    lines.push('  - MOC');
    lines.push('---');
    lines.push('');

    // Header
    lines.push('# 📚 Confluence Export');
    lines.push('');
    lines.push(`> Exported on ${new Date().toLocaleDateString()}`);
    lines.push(`> Total pages: ${pages.length} | Attachments: ${stats.attachments} | Diagrams: ${stats.diagrams}`);
    lines.push('');

    // Tree structure
    lines.push('## 🗂️ Structure');
    lines.push('');

    function renderTree(node: PageTreeNode, indent: string = ''): void {
        const link = makeWikilink(node.title);
        const childCount = node.children.length > 0 ? ` (${node.children.length})` : '';
        lines.push(`${indent}- ${link}${childCount}`);

        for (const child of node.children) {
            renderTree(child, indent + '  ');
        }
    }

    renderTree(rootNode);
    lines.push('');

    // Statistics
    lines.push('## 📊 Statistics');
    lines.push('');
    lines.push('| Metric | Value |');
    lines.push('|--------|-------|');
    lines.push(`| Total Pages | ${pages.length} |`);
    lines.push(`| Attachments | ${stats.attachments} |`);
    lines.push(`| Diagrams | ${stats.diagrams} |`);
    lines.push(`| Export Date | ${new Date().toISOString()} |`);
    lines.push('');

    return lines.join('\n');
}

/** Main export function */
export async function createObsidianVault(
    pages: PageContentData[],
    rootNode: PageTreeNode,
    rootTitle: string,
    settings: ObsidianExportSettings,
    onProgress?: ProgressCallback
): Promise<ObsidianExportResult> {
    // Using fflate instead of JSZip for better Tampermonkey compatibility
    const zipFiles: Record<string, Uint8Array> = {};
    const flatTree = flattenTree(rootNode);
    const nodeMap = new Map(flatTree.map((n) => [n.id, n]));
    const pageMap = new Map(pages.map((p) => [p.id, p.title]));

    const pageFiles: PageFile[] = [];
    const attachmentFiles: AttachmentFile[] = [];
    let diagramCount = 0;
    let attachmentCount = 0;

    // Phase 1: Convert pages to markdown
    onProgress?.('Converting pages...', 0, pages.length);

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const node = nodeMap.get(page.id);

        let content = '';

        // Add frontmatter if enabled
        if (settings.includeFrontmatter) {
            content += generateFrontmatter(page, node, pageMap, settings);
        }

        // Add title
        content += `# ${page.title}\n\n`;

        // Add source link if enabled
        if (settings.includeSourceLinks) {
            const baseUrl = getBaseUrl();
            content += `> Source: ${baseUrl}/pages/viewpage.action?pageId=${page.id}\n\n`;
        }

        // Convert content
        if (!page.error) {
            content += convertPageContent(page, pageMap, settings);
        } else {
            content += '*Error loading page content*\n';
        }

        // Build file path
        const filePath = node
            ? buildPagePath(node, flatTree, settings)
            : sanitizeFilename(page.title) + '.md';

        pageFiles.push({ path: filePath, content, pageId: page.id });
        onProgress?.('Converting pages...', i + 1, pages.length);
    }

    // Phase 2: Download attachments and diagrams
    if (settings.downloadAttachments || settings.exportDiagrams) {
        const totalPages = pages.length;
        let processedPages = 0;

        for (const page of pages) {
            onProgress?.('Downloading attachments...', processedPages, totalPages);

            // Fetch all attachments for this page
            console.log(`[Export] Fetching attachments for page ${page.id}`);
            const attachments = await fetchPageAttachments(page.id);
            console.log(`[Export] Found ${attachments.length} attachments`);

            // Build a set of diagram source filenames (without extension)
            // Draw.io diagrams have mediaType 'application/vnd.jgraph.mxfile'
            const diagramSourceNames = new Set<string>();
            for (const att of attachments) {
                if (att.mediaType === 'application/vnd.jgraph.mxfile') {
                    diagramSourceNames.add(att.filename);
                    console.log(`[Export] Found diagram source: ${att.filename}`);
                }
            }

            for (const att of attachments) {
                // Check size limit
                if (settings.maxAttachmentSizeMB > 0 && att.fileSize > settings.maxAttachmentSizeMB * 1024 * 1024) {
                    console.log(`[Export] Skipping ${att.filename} - too large`);
                    continue;
                }

                // Skip Draw.io source files (XML) - we only want PNG previews
                if (att.mediaType === 'application/vnd.jgraph.mxfile') {
                    continue;
                }

                // Check if this is a diagram PNG (has corresponding .mxfile source)
                const nameWithoutExt = att.filename.replace(/\.png$/i, '');
                const isDiagramPng = diagramSourceNames.has(nameWithoutExt);

                if (isDiagramPng) {
                    // This is a Draw.io diagram PNG preview
                    if (settings.exportDiagrams) {
                        console.log(`[Export] Downloading diagram PNG: ${att.filename}`);
                        const exported = await exportImageAttachment(att);
                        if (exported) {
                            attachmentFiles.push({
                                path: `_attachments/${exported.filename}`,
                                blob: exported.blob,
                            });
                            diagramCount++;
                            attachmentCount++;
                            console.log(`[Export] Downloaded diagram: ${att.filename}`);
                        }
                    }
                } else if (isImageAttachment(att)) {
                    // Regular image attachment
                    if (settings.downloadAttachments && settings.includeImages) {
                        console.log(`[Export] Downloading image: ${att.filename}`);
                        const exported = await exportImageAttachment(att);
                        if (exported) {
                            attachmentFiles.push({
                                path: `_attachments/${exported.filename}`,
                                blob: exported.blob,
                            });
                            attachmentCount++;
                            console.log(`[Export] Downloaded image: ${att.filename}`);
                        }
                    }
                }
            }

            processedPages++;
        }
    }

    // Phase 3: Build ZIP using fflate (synchronous, works in Tampermonkey)
    console.log(`[Export] Building ZIP with ${pageFiles.length} pages, ${attachmentFiles.length} attachments`);
    onProgress?.('Creating ZIP archive...', 0, 1);

    // Add page files (convert string to Uint8Array)
    for (const file of pageFiles) {
        console.log(`[Export] Adding page: ${file.path}`);
        zipFiles[file.path] = strToU8(file.content);
    }

    // Add attachment files - convert blob to Uint8Array
    for (const file of attachmentFiles) {
        console.log(`[Export] Adding attachment: ${file.path}, size: ${file.blob.size} bytes, type: ${file.blob.type}`);
        try {
            const arrayBuffer = await file.blob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            console.log(`[Export] Converted to Uint8Array: ${uint8Array.length} bytes`);
            zipFiles[file.path] = uint8Array;
        } catch (err) {
            console.error(`[Export] Failed to convert blob for ${file.path}:`, err);
            throw err;
        }
    }
    console.log(`[Export] All ${attachmentFiles.length} attachments added to ZIP object`);

    // Add index file
    const indexContent = generateIndexFile(rootNode, pages, {
        attachments: attachmentCount,
        diagrams: diagramCount,
    });
    zipFiles['_Index.md'] = strToU8(indexContent);

    // Generate ZIP blob using fflate (synchronous!)
    console.log('[Export] Starting ZIP generation with fflate...');
    console.log(`[Export] Total files in ZIP:`, Object.keys(zipFiles).length);

    let zipBlob: Blob;
    try {
        console.log('[Export] Calling zipSync...');
        const zipData = zipSync(zipFiles, { level: 0 }); // level 0 = no compression (STORE)
        console.log(`[Export] zipSync completed! Length: ${zipData.length}`);
        zipBlob = new Blob([zipData], { type: 'application/zip' });
    } catch (error) {
        console.error('[Export] ZIP generation failed:', error);
        throw error;
    }
    console.log(`[Export] ZIP generated, size: ${zipBlob.size} bytes`);

    onProgress?.('Done!', 1, 1);

    return {
        zipBlob,
        pageCount: pages.length,
        attachmentCount,
        diagramCount,
        totalSize: zipBlob.size,
        title: rootTitle,
    };
}

/** Download the vault ZIP */
export function downloadVaultZip(result: ObsidianExportResult): void {
    const url = URL.createObjectURL(result.zipBlob);
    const filename = `${sanitizeFilename(result.title)}_obsidian.zip`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
