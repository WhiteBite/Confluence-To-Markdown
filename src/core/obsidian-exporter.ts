import { zipSync, strToU8 } from 'fflate';
import { getBaseUrl } from '@/api/confluence';
import { ctmLog, ctmError } from '@/utils/logger';
import { runWithConcurrency } from '@/utils/queue';
import { MAX_CONCURRENCY } from '@/config';
import type {
    PageContentData,
    PageTreeNode,
    ObsidianExportSettings,
    ObsidianExportResult,
    AttachmentInfo,
} from '@/api/types';
import { convertToMarkdown, sanitizeHtml } from './converter';
import { flattenTree } from './tree-processor';
import {
    convertToWikilinks,
    sanitizeFilename,
    sanitizeAttachmentFilename,
    makeWikilink,
} from './link-resolver';
import {
    fetchPageAttachments,
    isImageAttachment,
    exportImageAttachment,
    exportAnyAttachment,
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

    // Map ObsidianExportSettings.diagramTargetFormat ('mermaid'|'drawio-xml'|'wikilink')
    // to converter's TargetFormat ('mermaid'|'drawio'|'excalidraw'|'original').
    // 'wikilink' = keep diagram as a wikilink reference (no embedded code) → 'original'
    // 'drawio-xml' = inline XML source → 'drawio'
    const converterTargetFormat: 'mermaid' | 'drawio' | 'excalidraw' | 'original' =
        settings.diagramTargetFormat === 'wikilink'
            ? 'original'
            : settings.diagramTargetFormat === 'drawio-xml'
              ? 'drawio'
              : 'mermaid';

    // Convert to markdown with Obsidian options and diagram conversion
    let markdown = convertToMarkdown(sanitizedHtml, {
        useObsidianCallouts: settings.useObsidianCallouts,
        diagramExportMode: settings.diagramExportMode,
        diagramTargetFormat: converterTargetFormat,
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

/** Convert Blob to Uint8Array using FileReader (more compatible than blob.arrayBuffer() in Tampermonkey) */
function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.readyState === FileReader.DONE && reader.result instanceof ArrayBuffer) {
                resolve(new Uint8Array(reader.result));
            } else {
                reject(new Error('FileReader failed to read blob as ArrayBuffer'));
            }
        };
        reader.onerror = () => reject(new Error('FileReader error: ' + reader.error?.message));
        reader.readAsArrayBuffer(blob);
    });
}

/** Main export function */
export async function createObsidianVault(
    pages: PageContentData[],
    rootNode: PageTreeNode,
    rootTitle: string,
    settings: ObsidianExportSettings,
    onProgress?: ProgressCallback
): Promise<ObsidianExportResult> {
    // fflate input format: each entry must be Uint8Array or [Uint8Array, opts] TUPLE.
    // Object form `{ data, mtime }` is interpreted as a nested Zippable folder, NOT a file
    // with metadata — that triggers infinite recursion (RangeError: Maximum call stack)
    // and produces invalid ZIP structure like `file.md/data`, `file.md/mtime/`.
    // Tuple form is the only correct way to attach mtime in zipSync.
    const zipFiles: Record<string, Uint8Array | [Uint8Array, { mtime: Date }]> = {};
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

    // Phase 2: Download attachments and diagrams (PARALLEL)
    if (settings.downloadAttachments || settings.exportDiagrams || settings.exportAllAttachments) {
        // Step 1: Fetch attachment lists for all pages in parallel (with concurrency limit)
        onProgress?.('Fetching attachment lists...', 0, pages.length);

        interface AttachmentList { pageId: string; attachments: AttachmentInfo[] }

        const attachmentLists = await runWithConcurrency<PageContentData, AttachmentList>(
            pages,
            async (page) => {
                ctmLog(`[Export] Fetching attachments for page ${page.id}`);
                const attachments = await fetchPageAttachments(page.id);
                ctmLog(`[Export] Found ${attachments.length} attachments for page ${page.id}`);
                return { pageId: page.id, attachments };
            },
            {
                concurrency: MAX_CONCURRENCY,
                onProgress: (completed, total) => onProgress?.('Fetching attachment lists...', completed, total),
            }
        );

        // Step 2: Build download queue
        interface DownloadTask {
            att: AttachmentInfo;
            pageId: string;
            type: 'diagram' | 'image' | 'file';
        }

        const downloadTasks: DownloadTask[] = [];

        for (const { pageId, attachments } of attachmentLists) {
            const diagramSourceNames = new Set<string>();
            for (const att of attachments) {
                if (att.mediaType === 'application/vnd.jgraph.mxfile') {
                    diagramSourceNames.add(att.filename);
                }
            }

            for (const att of attachments) {
                // Check size limit
                if (settings.maxAttachmentSizeMB > 0 && att.fileSize > settings.maxAttachmentSizeMB * 1024 * 1024) {
                    ctmLog(`[Export] Skipping ${att.filename} - too large`);
                    continue;
                }

                // Skip Draw.io source files (XML) - we only want PNG previews
                if (att.mediaType === 'application/vnd.jgraph.mxfile') {
                    continue;
                }

                // Check if this is a diagram PNG (has corresponding .mxfile source)
                const nameWithoutExt = att.filename.replace(/\.png$/i, '');
                const isDiagramPng = diagramSourceNames.has(nameWithoutExt);

                if (isDiagramPng && settings.exportDiagrams) {
                    downloadTasks.push({ att, pageId, type: 'diagram' });
                } else if (isImageAttachment(att) && settings.downloadAttachments && settings.includeImages) {
                    downloadTasks.push({ att, pageId, type: 'image' });
                } else if (settings.exportAllAttachments) {
                    downloadTasks.push({ att, pageId, type: 'file' });
                }
            }
        }

        // Step 3: Download all attachments in parallel (with concurrency limit)
        const totalDownloads = downloadTasks.length;
        onProgress?.('Downloading attachments...', 0, totalDownloads);
        ctmLog(`[Export] Starting parallel download of ${totalDownloads} attachments (concurrency: ${MAX_CONCURRENCY})`);

        interface DownloadResult {
            filename: string;
            blob: Blob;
            type: 'diagram' | 'image' | 'file';
        }

        const downloadResults = await runWithConcurrency<DownloadTask, DownloadResult | null>(
            downloadTasks,
            async (task) => {
                ctmLog(`[Export] Downloading ${task.type}: ${task.att.filename}`);
                const exported = task.type === 'file'
                    ? await exportAnyAttachment(task.att)
                    : await exportImageAttachment(task.att);
                if (exported) {
                    ctmLog(`[Export] Downloaded ${task.att.filename}`);
                    return { filename: exported.filename, blob: exported.blob, type: task.type };
                }
                return null;
            },
            {
                concurrency: MAX_CONCURRENCY,
                onProgress: (completed, total) => onProgress?.('Downloading attachments...', completed, total),
            }
        );

        // Step 4: Collect results — sanitize filenames for Windows compatibility
        // and dedupe colliding names by appending pageId
        const attachmentNames = new Set<string>();
        for (const result of downloadResults) {
            if (!result) continue;
            const safeName = sanitizeAttachmentFilename(result.filename);
            let finalPath = `_attachments/${safeName}`;
            if (attachmentNames.has(finalPath)) {
                // Collision: prefix with pageId
                const dotIndex = safeName.lastIndexOf('.');
                const stem = dotIndex > 0 ? safeName.substring(0, dotIndex) : safeName;
                const ext = dotIndex > 0 ? safeName.substring(dotIndex) : '';
                // Note: pageId not available in DownloadResult — use counter fallback
                let n = 2;
                while (attachmentNames.has(`_attachments/${stem}_${n}${ext}`)) n++;
                finalPath = `_attachments/${stem}_${n}${ext}`;
            }
            attachmentNames.add(finalPath);
            attachmentFiles.push({
                path: finalPath,
                blob: result.blob,
            });
            attachmentCount++;
            if (result.type === 'diagram') diagramCount++;
        }
    }

    // Phase 3: Build ZIP using fflate (synchronous, works in Tampermonkey)
    ctmLog(`[Export] Building ZIP with ${pageFiles.length} pages, ${attachmentFiles.length} attachments`);
    onProgress?.('Creating ZIP archive...', 0, 1);

    // Add page files (convert string to Uint8Array, attach mtime via tuple form)
    const now = new Date();
    for (const file of pageFiles) {
        ctmLog(`[Export] Adding page: ${file.path}`);
        zipFiles[file.path] = [strToU8(file.content), { mtime: now }];
    }

    // Add attachment files - convert blob to Uint8Array, attach mtime via tuple form
    for (const file of attachmentFiles) {
        ctmLog(`[Export] Adding attachment: ${file.path}, size: ${file.blob.size} bytes, type: ${file.blob.type}`);
        try {
            const uint8Array = await blobToUint8Array(file.blob);
            ctmLog(`[Export] Converted to Uint8Array: ${uint8Array.length} bytes`);
            if (uint8Array.length === 0) {
                ctmError(`[Export] WARNING: attachment ${file.path} has 0 bytes after conversion!`);
            }
            zipFiles[file.path] = [uint8Array, { mtime: now }];
        } catch (err) {
            ctmError(`[Export] Failed to convert blob for ${file.path}:`, err);
            throw err;
        }
    }
    ctmLog(`[Export] All ${attachmentFiles.length} attachments added to ZIP object`);

    // Add index file
    const indexContent = generateIndexFile(rootNode, pages, {
        attachments: attachmentCount,
        diagrams: diagramCount,
    });
    zipFiles['_Index.md'] = [strToU8(indexContent), { mtime: now }];

    // Generate ZIP blob using fflate (synchronous!)
    ctmLog('[Export] Starting ZIP generation with fflate...');
    ctmLog(`[Export] Total files in ZIP:`, Object.keys(zipFiles).length);

    let zipBlob: Blob;
    try {
        ctmLog('[Export] Calling zipSync...');
        // Use default compression (deflate) — STORE (level:0) causes issues with some unzippers
        const zipData = zipSync(zipFiles);
        ctmLog(`[Export] zipSync completed! Length: ${zipData.length}`);
        // Wrap Uint8Array in a fresh ArrayBuffer to satisfy strict `BlobPart`
        // (Uint8Array<ArrayBufferLike> is not assignable to BlobPart in TS 5.7+
        // because `ArrayBufferLike` may be `SharedArrayBuffer`).
        const ab = new ArrayBuffer(zipData.byteLength);
        new Uint8Array(ab).set(zipData);
        zipBlob = new Blob([ab], { type: 'application/zip' });
    } catch (error) {
        ctmError('[Export] ZIP generation failed:', error);
        throw error;
    }
    ctmLog(`[Export] ZIP generated, size: ${zipBlob.size} bytes`);

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
    ctmLog(`[Export] downloadVaultZip called, blob size: ${result.zipBlob.size} bytes, type: ${result.zipBlob.type}`);

    if (result.zipBlob.size === 0) {
        ctmError('[Export] ZIP blob is empty! Cannot download.');
        alert('Export failed: ZIP file is empty. Please check console logs.');
        return;
    }

    const filename = `${sanitizeFilename(result.title)}_obsidian.zip`;

    // Try GM_download first (Tampermonkey) — more reliable than Blob+URL in sandbox
    if (typeof GM_download === 'function') {
        try {
            const blobUrl = URL.createObjectURL(result.zipBlob);
            GM_download({
                url: blobUrl,
                name: filename,
                saveAs: true,
                onerror(error) {
                    ctmError('[Export] GM_download failed:', error);
                    URL.revokeObjectURL(blobUrl);
                    downloadWithDataUrl(result.zipBlob, filename);
                },
                onload() {
                    URL.revokeObjectURL(blobUrl);
                },
            });
            ctmLog('[Export] Using GM_download for ZIP');
            return;
        } catch (err) {
            ctmError('[Export] GM_download error, falling back:', err);
        }
    }

    downloadWithObjectUrl(result.zipBlob, filename);
}

/** Download via Object URL (anchor click) */
function downloadWithObjectUrl(blob: Blob, filename: string): void {
    try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        ctmLog('[Export] ObjectURL download triggered');
    } catch (err) {
        ctmError('[Export] ObjectURL download failed:', err);
        downloadWithDataUrl(blob, filename);
    }
}

/** Download via data: URL (most compatible with Tampermonkey sandbox) */
function downloadWithDataUrl(blob: Blob, filename: string): void {
    const reader = new FileReader();
    reader.onloadend = () => {
        if (reader.readyState === FileReader.DONE) {
            const a = document.createElement('a');
            a.href = reader.result as string;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            ctmLog('[Export] DataURL download triggered');
        } else {
            ctmError('[Export] FileReader failed to read blob');
            alert('Download failed: could not read ZIP file for download.');
        }
    };
    reader.onerror = () => {
        ctmError('[Export] FileReader error:', reader.error);
        alert('Download failed: error reading ZIP file.');
    };
    reader.readAsDataURL(blob);
}
