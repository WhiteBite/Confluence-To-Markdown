/**
 * Space Sync — orchestrator for incremental space sync.
 *
 * scanSpace: fetch catalog, read stored state, diff.
 * applySpaceSync: fetch bodies for selected added+changed, write/delete
 *   pages in the store, update state + manifest, return report.
 *
 * Uses `fetchPageForHub` from `@/api/confluence` for full page bodies
 * (already has retry via `withRetry`). Uses `fetchSpaceCatalogWithVersions`
 * for the lightweight catalog scan.
 */

import { fetchPageForHub } from '@/api/confluence';
import { ctmLog, ctmError } from '@/utils/logger';
import { fetchSpaceCatalogWithVersions } from './space-catalog';
import { diffSpace } from './space-diff';
import type {
    CatalogEntry,
    SpaceDiff,
    SpaceState,
    SpaceSyncReport,
    SpaceTreeManifest,
    TreePageFile,
} from './space-types';
import type { TreeStore } from './tree-io';

// ============================================================================
// Types
// ============================================================================

/** Result of scanning a space — catalog + diff. */
export interface ScanResult {
    readonly catalog: readonly CatalogEntry[];
    readonly diff: SpaceDiff;
}

/** Progress callback for scan and apply phases. */
export type SpaceSyncProgressCallback = (
    phase: string,
    current: number,
    total: number
) => void;

// ============================================================================
// Scan phase
// ============================================================================

/**
 * Scan a space: fetch catalog, read stored state, diff.
 * Returns the catalog and the diff (added/changed/removed/unchanged).
 */
export async function scanSpace(
    store: TreeStore,
    spaceKey: string,
    onProgress?: SpaceSyncProgressCallback
): Promise<ScanResult> {
    onProgress?.('Fetching catalog...', 0, 1);
    const catalog = await fetchSpaceCatalogWithVersions(spaceKey);
    onProgress?.('Fetching catalog...', 1, 1);

    onProgress?.('Reading state...', 0, 1);
    const state = await store.readState();
    onProgress?.('Reading state...', 1, 1);

    const diff = diffSpace(state, catalog);

    return { catalog, diff };
}

// ============================================================================
// Apply phase
// ============================================================================

/**
 * Apply a space sync: fetch bodies for selected added+changed pages,
 * delete selected removed pages, update state + manifest.
 *
 * Per-page failures go to report.failed (don't abort).
 */
export async function applySpaceSync(
    store: TreeStore,
    spaceKey: string,
    catalog: readonly CatalogEntry[],
    diff: SpaceDiff,
    selectedIds: ReadonlySet<string>,
    onProgress?: SpaceSyncProgressCallback
): Promise<SpaceSyncReport> {
    const failed: Array<{ id: string; title: string; error: string }> = [];
    let written = 0;

    // Collect all work items (added + changed + removed) that are selected.
    const toAddOrUpdate: CatalogEntry[] = [
        ...diff.added.filter(e => selectedIds.has(e.id)),
        ...diff.changed.filter(e => selectedIds.has(e.id)),
    ];
    const toRemove = diff.removed.filter(e => selectedIds.has(e.id));

    const totalWork = toAddOrUpdate.length + toRemove.length;
    let processed = 0;

    onProgress?.('Applying changes...', 0, totalWork);

    // ── Fetch + write added/changed pages ────────────────────────
    for (const entry of toAddOrUpdate) {
        onProgress?.('Applying changes...', processed, totalWork);
        processed++;

        try {
            const page = await fetchPageForHub(entry.id);
            if (!page) {
                failed.push({
                    id: entry.id,
                    title: entry.title,
                    error: 'Failed to fetch page (null response).',
                });
                continue;
            }

            const ancestors = page.ancestors ?? [];
            const treePage: TreePageFile = {
                id: page.id,
                title: page.title,
                parentId:
                    ancestors.length > 0
                        ? ancestors[ancestors.length - 1].id
                        : null,
                version: page.version?.number ?? 0,
                labels: page.labels,
                storage: page.htmlContent,
            };

            await store.writePage(treePage);
            written++;
            ctmLog(`[SpaceSync] Written: ${entry.title} (${entry.id})`);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            failed.push({ id: entry.id, title: entry.title, error: msg });
            ctmError(`[SpaceSync] Failed to write "${entry.title}":`, error);
        }
    }

    // ── Delete removed pages ─────────────────────────────────────
    for (const entry of toRemove) {
        onProgress?.('Applying changes...', processed, totalWork);
        processed++;

        try {
            await store.deletePage(entry.id);
            ctmLog(`[SpaceSync] Deleted: ${entry.title} (${entry.id})`);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            failed.push({ id: entry.id, title: entry.title, error: msg });
            ctmError(`[SpaceSync] Failed to delete "${entry.title}":`, error);
        }
    }

    onProgress?.('Applying changes...', totalWork, totalWork);

    // ── Rebuild state from catalog ───────────────────────────────
    const pages: Record<string, {
        title: string;
        version: number;
        parentId: string | null;
    }> = {};
    for (const entry of catalog) {
        pages[entry.id] = {
            title: entry.title,
            version: entry.version,
            parentId: entry.parentId,
        };
    }

    const newState: SpaceState = {
        format: 'onyx-sync/space-state',
        version: 1,
        space: spaceKey,
        lastSync: new Date().toISOString(),
        pages,
    };
    await store.writeState(newState);

    const manifest: SpaceTreeManifest = {
        format: 'onyx-sync/space-tree',
        version: 1,
        space: spaceKey,
        exportedAt: new Date().toISOString(),
        pageCount: catalog.length,
    };
    await store.writeManifest(manifest);

    return {
        space: spaceKey,
        scannedAt: new Date().toISOString(),
        added: diff.added.filter(e => selectedIds.has(e.id)).length,
        changed: diff.changed.filter(e => selectedIds.has(e.id)).length,
        removed: toRemove.length,
        unchangedCount: diff.unchangedCount,
        failed,
        written,
    };
}
