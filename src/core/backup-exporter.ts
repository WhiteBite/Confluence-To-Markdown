/**
 * Confluence Backup Exporter
 *
 * Creates a lossless `.cfb.zip` archive containing:
 *   - manifest.json: format version, space info, export date
 *   - tree.json: full page hierarchy for fast reconstruction
 *   - pages/{pageId}.json: per-page data with body.storage (raw XHTML)
 *   - attachments/{pageId}/{filename}: binary attachments
 *
 * This format preserves the EXACT Confluence storage markup, enabling
 * lossless import into another Confluence instance via REST API.
 */

import { zipSync, strToU8 } from 'fflate';
import { getBaseUrl } from '@/api/confluence';
import { fetchJson } from '@/utils/transport';
import { runWithConcurrency } from '@/utils/queue';
import { MAX_CONCURRENCY } from '@/config';
import { ctmLog, ctmError } from '@/utils/logger';
import { sanitizeAttachmentFilename } from './link-resolver';
import {
    fetchPageAttachments,
    exportAnyAttachment,
} from './attachment-handler';
import type {
    PageTreeNode,
    AttachmentInfo,
} from '@/api/types';

// ============================================================================
// Types
// ============================================================================

/** Manifest stored in the root of .cfb.zip */
export interface BackupManifest {
    formatVersion: '1.0';
    exportDate: string;
    exportedBy: string;
    spaceKey: string | null;
    spaceName: string | null;
    rootPageId: string;
    rootPageTitle: string;
    pageCount: number;
    attachmentCount: number;
    confluenceBaseUrl: string;
}

/** Per-page JSON stored in pages/{id}.json */
export interface BackupPageData {
    id: string;
    title: string;
    parentId: string | null;
    spaceKey: string;
    ancestors: Array<{ id: string; title: string }>;
    version: { number: number; when: string } | null;
    labels: string[];
    body: {
        /** Raw Confluence storage format (XHTML with macros) */
        storage: string;
        /** Rendered HTML (for preview, optional) */
        view?: string;
    };
    attachments: Array<{
        filename: string;
        mediaType: string;
        size: number;
    }>;
}

/** Result of backup export */
export interface BackupExportResult {
    zipBlob: Blob;
    pageCount: number;
    attachmentCount: number;
    totalSize: number;
    title: string;
}

export type BackupProgressCallback = (phase: string, current: number, total: number) => void;

// ============================================================================
// API helpers (fetch body.storage + labels)
// ============================================================================

interface StoragePageResponse {
    id: string;
    title: string;
    type: string;
    status: string;
    space?: { key: string };
    body?: {
        storage?: { value: string; representation: string };
        view?: { value: string; representation: string };
    };
    ancestors?: Array<{ id: string; title: string; type: string }>;
    version?: { number: number; when: string };
    metadata?: { labels?: { results: Array<{ name: string }> } };
}

async function fetchPageStorage(pageId: string): Promise<StoragePageResponse> {
    const baseUrl = getBaseUrl();
    const expand = 'body.storage,body.view,ancestors,version,metadata.labels,space';
    const url = `${baseUrl}/rest/api/content/${pageId}?expand=${expand}`;
    return fetchJson<StoragePageResponse>(url);
}

// ============================================================================
// Main export function
// ============================================================================

export async function createConfluenceBackup(
    pageIds: string[],
    rootNode: PageTreeNode,
    rootTitle: string,
    spaceKey: string | null,
    spaceName: string | null,
    options: {
        includeAttachments: boolean;
        includeViewHtml: boolean;
    },
    onProgress?: BackupProgressCallback
): Promise<BackupExportResult> {
    const baseUrl = getBaseUrl();
    const now = new Date();
    const pages: BackupPageData[] = [];
    const attachmentFiles: Array<{ path: string; data: Uint8Array }> = [];
    let attachmentCount = 0;

    // ── Phase 1: Fetch page storage content ──────────────────────
    onProgress?.('content', 0, pageIds.length);
    ctmLog(`[Backup] Fetching storage content for ${pageIds.length} pages`);

    const pageResults = await runWithConcurrency(
        pageIds,
        async (pageId) => {
            try {
                const page = await fetchPageStorage(pageId);
                const parentId = findParentId(pageId, rootNode);

                const backupPage: BackupPageData = {
                    id: page.id,
                    title: page.title,
                    parentId,
                    spaceKey: page.space?.key ?? spaceKey ?? '',
                    ancestors: (page.ancestors ?? []).map(a => ({ id: a.id, title: a.title })),
                    version: page.version ?? null,
                    labels: page.metadata?.labels?.results?.map(l => l.name) ?? [],
                    body: {
                        storage: page.body?.storage?.value ?? '',
                        view: options.includeViewHtml
                            ? (page.body?.view?.value ?? undefined)
                            : undefined,
                    },
                    attachments: [],
                };

                return backupPage;
            } catch (error) {
                ctmError(`[Backup] Failed to fetch page ${pageId}:`, error);
                return {
                    id: pageId,
                    title: `Error: ${pageId}`,
                    parentId: null,
                    spaceKey: spaceKey ?? '',
                    ancestors: [],
                    version: null,
                    labels: [],
                    body: { storage: '' },
                    attachments: [],
                } as BackupPageData;
            }
        },
        {
            concurrency: MAX_CONCURRENCY,
            onProgress: (completed, total) => onProgress?.('content', completed, total),
        }
    );

    pages.push(...pageResults);

    // ── Phase 2: Fetch and download attachments ──────────────────
    if (options.includeAttachments) {
        onProgress?.('attachments', 0, pageIds.length);
        ctmLog(`[Backup] Fetching attachments for ${pageIds.length} pages`);

        const attachmentLists = await runWithConcurrency(
            pageIds,
            async (pageId) => {
                const atts = await fetchPageAttachments(pageId);
                return { pageId, attachments: atts };
            },
            {
                concurrency: MAX_CONCURRENCY,
                onProgress: (completed, total) =>
                    onProgress?.('attachments', completed, total),
            }
        );

        // Build download queue
        interface DownloadTask { att: AttachmentInfo; pageId: string }
        const downloadTasks: DownloadTask[] = [];

        for (const { pageId, attachments } of attachmentLists) {
            // Update page's attachment metadata
            const page = pages.find(p => p.id === pageId);
            if (page) {
                page.attachments = attachments.map(a => ({
                    filename: a.filename,
                    mediaType: a.mediaType,
                    size: a.fileSize,
                }));
            }
            for (const att of attachments) {
                if (att.downloadUrl) {
                    downloadTasks.push({ att, pageId });
                }
            }
        }

        // Download all
        if (downloadTasks.length > 0) {
            onProgress?.('Downloading attachments...', 0, downloadTasks.length);
            ctmLog(`[Backup] Downloading ${downloadTasks.length} attachments`);

            const downloaded = await runWithConcurrency(
                downloadTasks,
                async (task) => {
                    const exported = await exportAnyAttachment(task.att);
                    if (!exported) return null;
                    return { pageId: task.pageId, filename: exported.filename, blob: exported.blob };
                },
                {
                    concurrency: MAX_CONCURRENCY,
                    bailOnError: false,
                    onProgress: (completed, total) =>
                        onProgress?.('Downloading attachments...', completed, total),
                }
            );

            for (const result of downloaded) {
                if (!result || result instanceof Error) continue;
                const safeName = sanitizeAttachmentFilename(result.filename);
                const path = `attachments/${result.pageId}/${safeName}`;
                try {
                    const arrayBuf = await result.blob.arrayBuffer();
                    attachmentFiles.push({ path, data: new Uint8Array(arrayBuf) });
                    attachmentCount++;
                } catch (err) {
                    ctmError(`[Backup] Failed to read blob for ${result.filename}:`, err);
                }
            }
        }
    }

    // ── Phase 3: Build ZIP ───────────────────────────────────────
    onProgress?.('Creating ZIP archive...', 0, 1);
    ctmLog(`[Backup] Building ZIP: ${pages.length} pages, ${attachmentCount} attachments`);

    const manifest: BackupManifest = {
        formatVersion: '1.0',
        exportDate: now.toISOString(),
        exportedBy: 'Confluence-to-Markdown Extension',
        spaceKey,
        spaceName,
        rootPageId: rootNode.id,
        rootPageTitle: rootTitle,
        pageCount: pages.length,
        attachmentCount,
        confluenceBaseUrl: baseUrl,
    };

    const tree = serializeTree(rootNode);

    const zipFiles: Record<string, [Uint8Array, { mtime: Date }]> = {};

    // manifest.json
    zipFiles['manifest.json'] = [strToU8(JSON.stringify(manifest, null, 2)), { mtime: now }];

    // tree.json
    zipFiles['tree.json'] = [strToU8(JSON.stringify(tree, null, 2)), { mtime: now }];

    // pages/{id}.json
    for (const page of pages) {
        const json = JSON.stringify(page, null, 2);
        zipFiles[`pages/${page.id}.json`] = [strToU8(json), { mtime: now }];
    }

    // attachments/{pageId}/{filename}
    for (const file of attachmentFiles) {
        zipFiles[file.path] = [file.data, { mtime: now }];
    }

    // Generate ZIP
    const zipData = zipSync(zipFiles);
    const ab = new ArrayBuffer(zipData.byteLength);
    new Uint8Array(ab).set(zipData);
    const zipBlob = new Blob([ab], { type: 'application/zip' });

    ctmLog(`[Backup] ZIP generated: ${zipBlob.size} bytes`);
    onProgress?.('Done!', 1, 1);

    return {
        zipBlob,
        pageCount: pages.length,
        attachmentCount,
        totalSize: zipBlob.size,
        title: rootTitle,
    };
}

/** Download the backup ZIP */
export function downloadBackupZip(result: BackupExportResult): void {
    const filename = `${sanitizeTitle(result.title)}_backup.cfb.zip`;
    const url = URL.createObjectURL(result.zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ============================================================================
// Helpers
// ============================================================================

function sanitizeTitle(title: string): string {
    return title
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
        .replace(/\s+/g, '_')
        .substring(0, 80);
}

function findParentId(pageId: string, tree: PageTreeNode): string | null {
    if (tree.id === pageId) return tree.parentId;
    for (const child of tree.children) {
        if (child.id === pageId) return tree.id;
        const found = findParentId(pageId, child);
        if (found !== undefined && found !== null) return found;
    }
    return null;
}

interface SerializedTreeNode {
    id: string;
    title: string;
    children: SerializedTreeNode[];
}

function serializeTree(node: PageTreeNode): SerializedTreeNode {
    return {
        id: node.id,
        title: node.title,
        children: node.children.map(serializeTree),
    };
}
