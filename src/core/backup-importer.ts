/**
 * Confluence Backup Importer
 *
 * Reads a `.cfb.zip` archive and creates pages in Confluence via REST API.
 *
 * Import strategy:
 *   1. Parse manifest.json + tree.json
 *   2. Create pages top-down (parents first) using body.storage
 *   3. Upload attachments to created pages
 *   4. Report progress and errors
 *
 * Pages are created under a specified parent page (or space root).
 */

import { unzipSync } from 'fflate';
import { getBaseUrl } from '@/api/confluence';
import { fetchJson, transportRequest } from '@/utils/transport';
import { ctmLog, ctmError } from '@/utils/logger';
import { ConfluenceApiError } from '@/api/errors';
import type { BackupManifest, BackupPageData } from './backup-exporter';

// ============================================================================
// Constants
// ============================================================================

const RETRY_DELAY_MS = 2_000;

// ============================================================================
// Types
// ============================================================================

export interface ImportOptions {
    /** Target space key where pages will be created */
    readonly targetSpaceKey: string;
    /** Parent page ID under which to create the tree (null = space root) */
    readonly parentPageId: string | null;
    /** Whether to upload attachments */
    readonly includeAttachments: boolean;
    /** Skip pages that already exist (match by title) */
    readonly skipExisting: boolean;
    /**
     * Max retry attempts for page creation on rate-limit (429).
     * Each retry waits for the server's Retry-After hint.
     * Default: 1 (2 total attempts).
     */
    readonly maxPageCreateRetries?: number;
}

export interface ImportResult {
    created: number;
    skipped: number;
    failed: number;
    errors: Array<{ readonly pageTitle: string; readonly error: string }>;
}

export type ImportProgressCallback = (phase: string, current: number, total: number) => void;

// ============================================================================
// Main import function
// ============================================================================

export async function importConfluenceBackup(
    zipBlob: Blob,
    options: ImportOptions,
    onProgress?: ImportProgressCallback
): Promise<ImportResult> {
    const baseUrl = getBaseUrl();

    // ── Phase 1: Parse ZIP ───────────────────────────────────────
    onProgress?.('Parsing backup...', 0, 1);
    ctmLog('[Import] Parsing ZIP...');

    const zipBuffer = await zipBlob.arrayBuffer();
    const entries = unzipSync(new Uint8Array(zipBuffer));

    const manifest = parseJsonEntry<BackupManifest>(entries, 'manifest.json');
    if (!manifest) {
        throw new Error('Invalid backup: manifest.json not found');
    }
    ctmLog(`[Import] Manifest: ${manifest.pageCount} pages, format v${manifest.formatVersion}`);

    // Parse tree for ordering
    const tree = parseJsonEntry<TreeNode>(entries, 'tree.json');

    // Collect page data
    const pages: BackupPageData[] = [];
    for (const [path, data] of Object.entries(entries)) {
        if (path.startsWith('pages/') && path.endsWith('.json') && data.length > 0) {
            try {
                const text = new TextDecoder().decode(data);
                pages.push(JSON.parse(text) as BackupPageData);
            } catch {
                ctmError(`[Import] Failed to parse ${path}`);
            }
        }
    }
    ctmLog(`[Import] Parsed ${pages.length} pages from backup`);

    // ── Phase 2: Determine creation order (parents first) ────────
    const orderedPages = tree
        ? orderByTree(pages, tree)
        : pages; // fallback: as-is

    // ── Phase 3: Check existing pages (if skipExisting) ──────────
    let existingTitles = new Set<string>();
    if (options.skipExisting) {
        onProgress?.('Checking existing pages...', 0, 1);
        existingTitles = await fetchExistingTitles(baseUrl, options.targetSpaceKey);
        ctmLog(`[Import] Found ${existingTitles.size} existing pages in space`);
    }

    // ── Phase 4: Create pages ────────────────────────────────────
    const result: ImportResult = { created: 0, skipped: 0, failed: 0, errors: [] };
    const idMapping = new Map<string, string>(); // originalId → newId

    onProgress?.('Creating pages...', 0, orderedPages.length);

    for (let i = 0; i < orderedPages.length; i++) {
        const page = orderedPages[i];
        onProgress?.('Creating pages...', i, orderedPages.length);

        if (options.skipExisting && existingTitles.has(page.title)) {
            result.skipped++;
            ctmLog(`[Import] Skipped (exists): ${page.title}`);
            continue;
        }

        // Determine parent: mapped parent from backup, or the target parent
        let ancestorId = options.parentPageId;
        if (page.parentId && idMapping.has(page.parentId)) {
            ancestorId = idMapping.get(page.parentId)!;
        }

        try {
            const newId = await createPage(
                baseUrl,
                options.targetSpaceKey,
                page.title,
                page.body.storage,
                ancestorId,
                options.maxPageCreateRetries ?? 1
            );
            idMapping.set(page.id, newId);
            result.created++;
            ctmLog(`[Import] Created: ${page.title} (${newId})`);
        } catch (error) {
            result.failed++;
            const msg = error instanceof Error ? error.message : String(error);
            result.errors.push({ pageTitle: page.title, error: msg });
            ctmError(`[Import] Failed to create "${page.title}":`, error);
        }
    }

    onProgress?.('Creating pages...', orderedPages.length, orderedPages.length);

    // ── Phase 5: Upload attachments ──────────────────────────────
    if (options.includeAttachments) {
        const attachmentEntries = Object.keys(entries).filter(
            k => k.startsWith('attachments/') && !k.endsWith('/')
        );

        if (attachmentEntries.length > 0) {
            const attFailures = await uploadPageAttachments(baseUrl, attachmentEntries, entries, idMapping, onProgress);
            for (const f of attFailures) {
                // Surface attachment upload failures alongside page errors so the
                // import-modal can display them to the user.
                result.errors.push({ pageTitle: `Attachment: ${f.filename}`, error: f.error });
            }
        }
    }

    onProgress?.('Done!', 1, 1);
    ctmLog(`[Import] Complete: ${result.created} created, ${result.skipped} skipped, ${result.failed} failed`);
    return result;
}

// ============================================================================
// Phase 5: Attachment upload (extracted for clarity and testability)
// ============================================================================

/** Describes a single failed attachment upload. */
export interface AttachmentUploadFailure {
    readonly filename: string;
    readonly pageId: string;
    readonly error: string;
}

/** @internal Exported for testing */
export async function uploadPageAttachments(
    baseUrl: string,
    attachmentEntries: readonly string[],
    entries: Readonly<Record<string, Uint8Array>>,
    idMapping: ReadonlyMap<string, string>,
    onProgress?: ImportProgressCallback
): Promise<AttachmentUploadFailure[]> {
    onProgress?.('Uploading attachments...', 0, attachmentEntries.length);
    ctmLog(`[Import] Uploading ${attachmentEntries.length} attachments`);

    let uploaded = 0;
    const failures: AttachmentUploadFailure[] = [];

    for (const path of attachmentEntries) {
        // path: attachments/{originalPageId}/{filename}
        const parts = path.split('/');
        if (parts.length < 3) continue;
        const originalPageId = parts[1];
        const filename = parts.slice(2).join('/');
        const newPageId = idMapping.get(originalPageId);

        if (!newPageId) {
            // Page wasn't created (skipped or failed) — skip attachment
            continue;
        }

        try {
            const data = entries[path];
            const ab = new ArrayBuffer(data.byteLength);
            new Uint8Array(ab).set(data);
            await uploadAttachment(baseUrl, newPageId, filename, ab);
            uploaded++;
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            ctmError(`[Import] Failed to upload ${filename} to ${newPageId}:`, error);
            failures.push({ filename, pageId: newPageId, error: msg });
        }

        // ✅ Bug fix: no ++ here — uploaded is only incremented on success above
        onProgress?.('Uploading attachments...', uploaded, attachmentEntries.length);
    }

    return failures;
}

// ============================================================================
// REST API helpers
// ============================================================================

async function createPage(
    baseUrl: string,
    spaceKey: string,
    title: string,
    storageBody: string,
    parentId: string | null,
    retries = 1
): Promise<string> {
    const body: Record<string, unknown> = {
        type: 'page',
        title,
        space: { key: spaceKey },
        body: {
            storage: {
                value: storageBody,
                representation: 'storage',
            },
        },
    };

    if (parentId) {
        body.ancestors = [{ id: parentId }];
    }

    try {
        const result = await transportRequest<{ id: string }>({
            url: `${baseUrl}/rest/api/content`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        return result.id;
    } catch (error) {
        if (retries > 0 && isRateLimited(error)) {
            const delay = getRetryDelay(error);
            ctmLog(`[Import] Rate limited creating "${title}", retrying in ${delay}ms`);
            await sleep(delay);
            return createPage(baseUrl, spaceKey, title, storageBody, parentId, retries - 1);
        }
        throw error;
    }
}

async function uploadAttachment(
    baseUrl: string,
    pageId: string,
    filename: string,
    data: ArrayBuffer
): Promise<void> {
    const formData = new FormData();
    const blob = new Blob([data]);
    formData.append('file', blob, filename);

    try {
        await transportRequest<unknown>({
            url: `${baseUrl}/rest/api/content/${pageId}/child/attachment`,
            method: 'POST',
            headers: { 'X-Atlassian-Token': 'nocheck' },
            body: formData,
        });
    } catch (error) {
        if (error instanceof ConfluenceApiError && error.status === 409) {
            throw new Error(
                `Attachment "${filename}" already exists on page ${pageId} (conflict 409)`
            );
        }
        throw error;
    }
}

/** @internal Exported for testing */
export async function fetchExistingTitles(baseUrl: string, spaceKey: string): Promise<Set<string>> {
    const titles = new Set<string>();
    let start = 0;
    const limit = 200;
    let hasMore = true;

    while (hasMore) {
        try {
            const cql = encodeURIComponent(`space="${spaceKey}" AND type=page`);
            const url = `${baseUrl}/rest/api/content/search?cql=${cql}&limit=${limit}&start=${start}`;
            const response = await fetchJson<{
                results: Array<{ title: string }>;
                size: number;
                /** Present when more results are available (Confluence REST API pagination). */
                _links?: { next?: string };
            }>(url);

            for (const r of response.results) {
                titles.add(r.title);
            }

            // Use _links.next (Confluence's canonical pagination signal) rather than
            // comparing results.length === limit — avoids one spurious request when the
            // total count is an exact multiple of `limit`.
            hasMore = !!response._links?.next;
            start += limit;
        } catch {
            break;
        }
    }

    return titles;
}

// ============================================================================
// Tree ordering
// ============================================================================

interface TreeNode {
    id: string;
    title: string;
    children: TreeNode[];
}

/** Flatten tree in BFS order (parents before children). @internal Exported for testing */
export function orderByTree(pages: BackupPageData[], tree: TreeNode): BackupPageData[] {
    const order: string[] = [];
    const queue: TreeNode[] = [tree];

    while (queue.length > 0) {
        const node = queue.shift()!;
        order.push(node.id);
        queue.push(...node.children);
    }

    const pageMap = new Map(pages.map(p => [p.id, p]));
    const ordered: BackupPageData[] = [];

    for (const id of order) {
        const page = pageMap.get(id);
        if (page) {
            ordered.push(page);
            pageMap.delete(id);
        }
    }

    // Append any pages not in tree (shouldn't happen, but safety)
    for (const page of pageMap.values()) {
        ordered.push(page);
    }

    return ordered;
}

// ============================================================================
// Helpers
// ============================================================================

/** @internal Exported for testing */
export function parseJsonEntry<T>(entries: Record<string, Uint8Array>, path: string): T | null {
    const data = entries[path];
    if (!data || data.length === 0) return null;
    try {
        const text = new TextDecoder().decode(data);
        return JSON.parse(text) as T;
    } catch {
        return null;
    }
}

function isRateLimited(error: unknown): boolean {
    return error instanceof ConfluenceApiError && error.category === 'rate_limited';
}

function getRetryDelay(error: unknown): number {
    if (error instanceof ConfluenceApiError && error.retryAfterMs !== undefined) {
        return error.retryAfterMs;
    }
    return RETRY_DELAY_MS;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
