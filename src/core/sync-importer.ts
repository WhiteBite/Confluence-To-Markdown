/**
 * Sync Importer — plans and applies a sync payload to a Confluence space.
 *
 * Plan phase (`planSync`):
 *   1. Fetch all existing pages of the target space with bodies.
 *   2. For each payload page (parents-first), determine action:
 *      create / update / skip.
 *
 * Apply phase (`applySync`):
 *   1. For each selected row (parents-first), create or update the page.
 *   2. Apply labels (including the marker label `onyx-sync`).
 *   3. Retry on rate-limit (429), honoring Retry-After.
 *   4. Return a structured report.
 *
 * Uses `transportRequest` / `fetchJson` from `@/utils/transport` — never
 * calls raw `fetch` directly (the transport layer handles Tampermonkey /
 * extension / browser contexts).
 */

import { getBaseUrl } from '@/api/confluence';
import { fetchJson, transportRequest } from '@/utils/transport';
import { ctmLog, ctmError } from '@/utils/logger';
import { ConfluenceApiError } from '@/api/errors';
import {
    SYNC_MARKER_LABEL,
    normalizeBody,
    type SyncPayload,
    type SyncPayloadPage,
} from './sync-payload';

// ============================================================================
// Constants
// ============================================================================

const RETRY_DELAY_MS = 2_000;

// ============================================================================
// Types
// ============================================================================

/** A single row in the sync plan. */
export interface SyncPlanRow {
    readonly localId: string;
    readonly title: string;
    readonly parentLocalId: string | null;
    readonly action: 'create' | 'update' | 'skip';
    readonly existingId?: string;
    readonly existingVersion?: number;
}

/** Result of the plan phase. */
export interface SyncPlan {
    readonly space: string;
    readonly rows: readonly SyncPlanRow[];
}

/** Progress callback for both plan and apply phases. */
export type SyncProgressCallback = (
    phase: string,
    current: number,
    total: number
) => void;

/** Result of the apply phase. */
export interface SyncReport {
    readonly space: string;
    readonly appliedAt: string;
    readonly created: ReadonlyArray<{
        readonly localId: string;
        readonly pageId: string;
        readonly title: string;
    }>;
    readonly updated: ReadonlyArray<{
        readonly localId: string;
        readonly pageId: string;
        readonly title: string;
    }>;
    readonly skipped: ReadonlyArray<{
        readonly localId: string;
        readonly title: string;
    }>;
    readonly failed: ReadonlyArray<{
        readonly localId: string;
        readonly title: string;
        readonly error: string;
    }>;
    readonly warnings: ReadonlyArray<{
        readonly localId: string;
        readonly title: string;
        readonly warning: string;
    }>;
}

// ============================================================================
// Plan phase
// ============================================================================

/**
 * Compute a sync plan for the given payload.
 *
 * Fetches all existing pages of the target space (with bodies) and determines
 * the action for each payload page: create, update, or skip.
 *
 * Body normalization for comparison: `trim()` + collapse all whitespace runs
 * to a single space. False "differs" is acceptable, false "equal" is not.
 */
export async function planSync(
    payload: SyncPayload,
    onProgress?: SyncProgressCallback
): Promise<SyncPlan> {
    const baseUrl = getBaseUrl();

    onProgress?.('Fetching existing pages...', 0, 1);
    const existingPages = await fetchExistingPages(baseUrl, payload.space);
    onProgress?.('Fetching existing pages...', 1, 1);

    // Build a title → existing-page index for quick lookup.
    // If multiple pages share a title, the first one wins.
    const existingByTitle = new Map<
        string,
        { id: string; body: string; version: number }
    >();
    for (const p of existingPages) {
        if (!existingByTitle.has(p.title)) {
            existingByTitle.set(p.title, p);
        }
    }

    // Order payload pages parents-first.
    const ordered = orderPagesParentsFirst(payload.pages);

    const rows: SyncPlanRow[] = [];
    for (const page of ordered) {
        const existing = existingByTitle.get(page.title);
        if (!existing) {
            rows.push({
                localId: page.id,
                title: page.title,
                parentLocalId: page.parent,
                action: 'create',
            });
            continue;
        }

        const sameBody =
            normalizeBody(page.storage) === normalizeBody(existing.body);
        if (sameBody) {
            rows.push({
                localId: page.id,
                title: page.title,
                parentLocalId: page.parent,
                action: 'skip',
                existingId: existing.id,
                existingVersion: existing.version,
            });
        } else {
            rows.push({
                localId: page.id,
                title: page.title,
                parentLocalId: page.parent,
                action: 'update',
                existingId: existing.id,
                existingVersion: existing.version,
            });
        }
    }

    return { space: payload.space, rows };
}

// ============================================================================
// Apply phase
// ============================================================================

/**
 * Apply a sync plan: create/update selected pages in Confluence.
 *
 * Pages are processed parents-first. If a page's parent was not applied or
 * resolved (i.e., its Confluence id is unknown), the page is failed with a
 * clear error rather than being orphaned.
 *
 * Label failures do NOT fail the page — they are recorded as warnings.
 */
export async function applySync(
    payload: SyncPayload,
    plan: SyncPlan,
    selectedLocalIds: ReadonlySet<string>,
    onProgress?: SyncProgressCallback
): Promise<SyncReport> {
    const baseUrl = getBaseUrl();
    const space = payload.space;

    const created: Array<{ localId: string; pageId: string; title: string }> = [];
    const updated: Array<{ localId: string; pageId: string; title: string }> = [];
    const failed: Array<{ localId: string; title: string; error: string }> = [];
    const warnings: Array<{
        localId: string;
        title: string;
        warning: string;
    }> = [];

    // Pre-populate id mapping for all skip and update rows (their existing
    // Confluence ids are known from the plan, regardless of selection).
    // This allows children of unselected-but-existing pages to resolve
    // their parent.
    const idMapping = new Map<string, string>();
    for (const row of plan.rows) {
        if ((row.action === 'skip' || row.action === 'update') && row.existingId) {
            idMapping.set(row.localId, row.existingId);
        }
    }

    // Build a lookup from localId → payload page.
    const pageMap = new Map<string, SyncPayloadPage>();
    for (const p of payload.pages) {
        pageMap.set(p.id, p);
    }

    // Order rows parents-first (same as plan).
    const orderedRows = orderRowsParentsFirst(plan.rows);

    // Filter to rows that need applying (selected + create/update).
    const applicableRows = orderedRows.filter(
        r =>
            selectedLocalIds.has(r.localId) &&
            (r.action === 'create' || r.action === 'update')
    );

    onProgress?.('Applying changes...', 0, applicableRows.length);

    let processed = 0;
    for (const row of applicableRows) {
        onProgress?.('Applying changes...', processed, applicableRows.length);
        processed++;

        const page = pageMap.get(row.localId);
        if (!page) {
            failed.push({
                localId: row.localId,
                title: row.title,
                error: 'Page not found in payload.',
            });
            continue;
        }

        // Resolve parent Confluence id.
        let ancestorId: string | null = null;
        if (row.parentLocalId !== null) {
            const resolved = idMapping.get(row.parentLocalId);
            if (!resolved) {
                failed.push({
                    localId: row.localId,
                    title: row.title,
                    error: `Parent "${row.parentLocalId}" was not applied or resolved.`,
                });
                continue;
            }
            ancestorId = resolved;
        }

        try {
            let pageId: string;
            if (row.action === 'create') {
                pageId = await createPage(
                    baseUrl,
                    space,
                    page.title,
                    page.storage,
                    ancestorId
                );
                idMapping.set(row.localId, pageId);
                created.push({ localId: row.localId, pageId, title: page.title });
                ctmLog(`[Sync] Created: ${page.title} (${pageId})`);
            } else {
                // update
                pageId = row.existingId!;
                await updatePage(
                    baseUrl,
                    pageId,
                    space,
                    page.title,
                    page.storage,
                    row.existingVersion!
                );
                updated.push({ localId: row.localId, pageId, title: page.title });
                ctmLog(`[Sync] Updated: ${page.title} (${pageId})`);
            }

            // Apply labels (payload labels + marker). Failures are warnings.
            const labels = [
                ...new Set([...(page.labels ?? []), SYNC_MARKER_LABEL]),
            ];
            await applyLabels(baseUrl, pageId, labels).catch(err => {
                const msg = err instanceof Error ? err.message : String(err);
                warnings.push({
                    localId: row.localId,
                    title: page.title,
                    warning: `Failed to apply labels: ${msg}`,
                });
                ctmError(`[Sync] Label failure for "${page.title}":`, err);
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            failed.push({ localId: row.localId, title: row.title, error: msg });
            ctmError(`[Sync] Failed to ${row.action} "${page.title}":`, error);
        }
    }

    onProgress?.('Applying changes...', applicableRows.length, applicableRows.length);

    // Build skipped list: every plan row not in created/updated/failed.
    const processedIds = new Set<string>();
    for (const c of created) processedIds.add(c.localId);
    for (const u of updated) processedIds.add(u.localId);
    for (const f of failed) processedIds.add(f.localId);

    const skipped: Array<{ localId: string; title: string }> = [];
    for (const row of plan.rows) {
        if (!processedIds.has(row.localId)) {
            skipped.push({ localId: row.localId, title: row.title });
        }
    }

    return {
        space,
        appliedAt: new Date().toISOString(),
        created,
        updated,
        skipped,
        failed,
        warnings,
    };
}

// ============================================================================
// REST API helpers
// ============================================================================

interface ExistingPage {
    id: string;
    title: string;
    body: string;
    version: number;
}

/**
 * Fetch all existing pages of a space with their storage bodies and versions.
 *
 * Uses CQL search with `expand=body.storage,version` and paginates by
 * `_links.next` (mirrors `fetchExistingTitles` in backup-importer.ts).
 *
 * @internal Exported for testing.
 */
export async function fetchExistingPages(
    baseUrl: string,
    spaceKey: string
): Promise<ExistingPage[]> {
    const pages: ExistingPage[] = [];
    let start = 0;
    const limit = 200;
    let hasMore = true;

    while (hasMore) {
        const cql = encodeURIComponent(`space="${spaceKey}" AND type=page`);
        const url =
            `${baseUrl}/rest/api/content/search?cql=${cql}` +
            `&expand=body.storage,version&limit=${limit}&start=${start}`;

        const response = await fetchJson<{
            results: Array<{
                id: string;
                title: string;
                body?: { storage?: { value: string } };
                version?: { number: number };
            }>;
            _links?: { next?: string };
        }>(url);

        for (const r of response.results) {
            pages.push({
                id: r.id,
                title: r.title,
                body: r.body?.storage?.value ?? '',
                version: r.version?.number ?? 0,
            });
        }

        hasMore = !!response._links?.next;
        start += limit;
    }

    return pages;
}

/**
 * Create a page in Confluence via `POST /rest/api/content`.
 * Retries once on rate-limit (429), honoring Retry-After.
 *
 * @internal Exported for testing.
 */
export async function createPage(
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
            ctmLog(
                `[Sync] Rate limited creating "${title}", retrying in ${delay}ms`
            );
            await sleep(delay);
            return createPage(
                baseUrl,
                spaceKey,
                title,
                storageBody,
                parentId,
                retries - 1
            );
        }
        throw error;
    }
}

/**
 * Update a page in Confluence via `PUT /rest/api/content/{id}`.
 * Increments the version number. Retries once on rate-limit (429).
 *
 * @internal Exported for testing.
 */
export async function updatePage(
    baseUrl: string,
    pageId: string,
    spaceKey: string,
    title: string,
    storageBody: string,
    currentVersion: number,
    retries = 1
): Promise<void> {
    const body: Record<string, unknown> = {
        id: pageId,
        type: 'page',
        title,
        space: { key: spaceKey },
        body: {
            storage: {
                value: storageBody,
                representation: 'storage',
            },
        },
        version: { number: currentVersion + 1 },
    };

    try {
        await transportRequest<unknown>({
            url: `${baseUrl}/rest/api/content/${pageId}`,
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    } catch (error) {
        if (retries > 0 && isRateLimited(error)) {
            const delay = getRetryDelay(error);
            ctmLog(
                `[Sync] Rate limited updating "${title}", retrying in ${delay}ms`
            );
            await sleep(delay);
            return updatePage(
                baseUrl,
                pageId,
                spaceKey,
                title,
                storageBody,
                currentVersion,
                retries - 1
            );
        }
        throw error;
    }
}

/**
 * Apply labels to a page via `POST /rest/api/content/{id}/label`.
 * Body: `[{prefix:'global', name}]` for each label.
 *
 * @internal Exported for testing.
 */
export async function applyLabels(
    baseUrl: string,
    pageId: string,
    labels: readonly string[]
): Promise<void> {
    if (labels.length === 0) return;

    const body = labels.map(name => ({ prefix: 'global', name }));

    await transportRequest<unknown>({
        url: `${baseUrl}/rest/api/content/${pageId}/label`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

// ============================================================================
// Ordering helpers
// ============================================================================

/**
 * Order payload pages parents-first (topological by parent reference).
 * Pages with no parent come first, then their children, etc.
 *
 * @internal Exported for testing.
 */
export function orderPagesParentsFirst(
    pages: readonly SyncPayloadPage[]
): SyncPayloadPage[] {
    const pageMap = new Map<string, SyncPayloadPage>();
    for (const p of pages) {
        pageMap.set(p.id, p);
    }

    const depthMemo = new Map<string, number>();

    const depth = (id: string): number => {
        if (depthMemo.has(id)) return depthMemo.get(id)!;
        const page = pageMap.get(id);
        if (!page || page.parent === null) {
            depthMemo.set(id, 0);
            return 0;
        }
        // Temporarily set to large value to prevent infinite recursion
        // (cycles are already caught by validation, but safety first).
        depthMemo.set(id, Number.MAX_SAFE_INTEGER);
        const d = depth(page.parent) + 1;
        depthMemo.set(id, d);
        return d;
    };

    return [...pages].sort((a, b) => depth(a.id) - depth(b.id));
}

/**
 * Order plan rows parents-first (topological by parentLocalId reference).
 *
 * @internal Exported for testing.
 */
export function orderRowsParentsFirst(rows: readonly SyncPlanRow[]): SyncPlanRow[] {
    const rowMap = new Map<string, SyncPlanRow>();
    for (const r of rows) {
        rowMap.set(r.localId, r);
    }

    const depthMemo = new Map<string, number>();

    const depth = (id: string): number => {
        if (depthMemo.has(id)) return depthMemo.get(id)!;
        const row = rowMap.get(id);
        if (!row || row.parentLocalId === null) {
            depthMemo.set(id, 0);
            return 0;
        }
        depthMemo.set(id, Number.MAX_SAFE_INTEGER);
        const d = depth(row.parentLocalId) + 1;
        depthMemo.set(id, d);
        return d;
    };

    return [...rows].sort((a, b) => depth(a.localId) - depth(b.localId));
}

// ============================================================================
// Helpers
// ============================================================================

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
