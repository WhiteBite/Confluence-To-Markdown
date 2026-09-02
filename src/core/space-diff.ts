/**
 * Space Diff — pure diff logic for incremental space sync.
 *
 * No I/O — operates on in-memory data structures only.
 * Unit-testable without mocking the transport layer.
 */

import type {
    CatalogEntry,
    ChangedEntry,
    RemovedEntry,
    SpaceDiff,
    SpaceState,
} from './space-types';

// ============================================================================
// Public API
// ============================================================================

/**
 * Create an empty SpaceState for a given space key.
 * Used when no prior state exists (first sync).
 */
export function emptyState(space: string): SpaceState {
    return {
        format: 'onyx-sync/space-state',
        version: 1,
        space,
        lastSync: new Date(0).toISOString(),
        pages: {},
    };
}

/**
 * Diff a space catalog against a stored state.
 *
 * - state null → everything added, removed = []
 * - added: in catalog not in state.pages
 * - changed: in both AND (version differs OR title differs OR parentId differs)
 * - removed: in state.pages not in catalog
 * - unchangedCount: rest
 */
export function diffSpace(
    state: SpaceState | null,
    catalog: readonly CatalogEntry[]
): SpaceDiff {
    if (state === null) {
        return {
            added: [...catalog],
            changed: [],
            removed: [],
            unchangedCount: 0,
        };
    }

    const statePages = state.pages;
    const catalogIds = new Set(catalog.map(c => c.id));

    const added: CatalogEntry[] = [];
    const changed: ChangedEntry[] = [];
    let unchangedCount = 0;

    for (const entry of catalog) {
        const stored = statePages[entry.id];
        if (!stored) {
            added.push(entry);
            continue;
        }

        if (
            stored.version !== entry.version ||
            stored.title !== entry.title ||
            stored.parentId !== entry.parentId
        ) {
            changed.push({ ...entry, oldVersion: stored.version });
        } else {
            unchangedCount++;
        }
    }

    const removed: RemovedEntry[] = [];
    for (const [id, info] of Object.entries(statePages)) {
        if (!catalogIds.has(id)) {
            removed.push({
                id,
                title: info.title,
                version: info.version,
            });
        }
    }

    return { added, changed, removed, unchangedCount };
}
