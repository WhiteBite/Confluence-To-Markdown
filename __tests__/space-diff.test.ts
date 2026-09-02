/**
 * Tests for space-diff.ts
 *
 * Covers:
 *   - diffSpace: null state (all added), added/changed/removed/unchanged
 *   - Changed detection: version, title, parentId differences
 *   - emptyState
 */

import { describe, it, expect } from 'vitest';
import { diffSpace, emptyState } from '@/core/space-diff';
import type { CatalogEntry, SpaceState } from '@/core/space-types';

// ============================================================================
// Helpers
// ============================================================================

function makeEntry(
    id: string,
    overrides: Partial<CatalogEntry> = {}
): CatalogEntry {
    return {
        id,
        title: `Page ${id}`,
        version: 1,
        parentId: null,
        ...overrides,
    };
}

function makeState(
    space: string,
    pages: Record<string, { title: string; version: number; parentId: string | null }>
): SpaceState {
    return {
        format: 'onyx-sync/space-state',
        version: 1,
        space,
        lastSync: '2026-01-01T00:00:00Z',
        pages,
    };
}

// ============================================================================
// diffSpace — null state
// ============================================================================

describe('diffSpace — null state', () => {
    it('marks all catalog entries as added when state is null', () => {
        const catalog = [
            makeEntry('1', { title: 'A' }),
            makeEntry('2', { title: 'B' }),
        ];

        const diff = diffSpace(null, catalog);

        expect(diff.added).toHaveLength(2);
        expect(diff.changed).toHaveLength(0);
        expect(diff.removed).toHaveLength(0);
        expect(diff.unchangedCount).toBe(0);
    });

    it('returns empty diff for empty catalog with null state', () => {
        const diff = diffSpace(null, []);

        expect(diff.added).toHaveLength(0);
        expect(diff.changed).toHaveLength(0);
        expect(diff.removed).toHaveLength(0);
        expect(diff.unchangedCount).toBe(0);
    });
});

// ============================================================================
// diffSpace — added
// ============================================================================

describe('diffSpace — added', () => {
    it('detects new pages not in state', () => {
        const state = makeState('SPC', {
            '1': { title: 'A', version: 1, parentId: null },
        });
        const catalog = [
            makeEntry('1', { title: 'A', version: 1 }),
            makeEntry('2', { title: 'B', version: 1 }),
        ];

        const diff = diffSpace(state, catalog);

        expect(diff.added).toHaveLength(1);
        expect(diff.added[0].id).toBe('2');
        expect(diff.unchangedCount).toBe(1);
    });
});

// ============================================================================
// diffSpace — changed
// ============================================================================

describe('diffSpace — changed', () => {
    it('detects version change', () => {
        const state = makeState('SPC', {
            '1': { title: 'A', version: 1, parentId: null },
        });
        const catalog = [makeEntry('1', { title: 'A', version: 2 })];

        const diff = diffSpace(state, catalog);

        expect(diff.changed).toHaveLength(1);
        expect(diff.changed[0].id).toBe('1');
        expect(diff.changed[0].oldVersion).toBe(1);
        expect(diff.changed[0].version).toBe(2);
    });

    it('detects title change', () => {
        const state = makeState('SPC', {
            '1': { title: 'Old', version: 1, parentId: null },
        });
        const catalog = [makeEntry('1', { title: 'New', version: 1 })];

        const diff = diffSpace(state, catalog);

        expect(diff.changed).toHaveLength(1);
        expect(diff.changed[0].title).toBe('New');
        expect(diff.changed[0].oldVersion).toBe(1);
    });

    it('detects parentId change', () => {
        const state = makeState('SPC', {
            '1': { title: 'A', version: 1, parentId: null },
        });
        const catalog = [makeEntry('1', { title: 'A', version: 1, parentId: '99' })];

        const diff = diffSpace(state, catalog);

        expect(diff.changed).toHaveLength(1);
        expect(diff.changed[0].parentId).toBe('99');
    });

    it('does NOT mark as changed when all fields match', () => {
        const state = makeState('SPC', {
            '1': { title: 'A', version: 1, parentId: '99' },
        });
        const catalog = [makeEntry('1', { title: 'A', version: 1, parentId: '99' })];

        const diff = diffSpace(state, catalog);

        expect(diff.changed).toHaveLength(0);
        expect(diff.unchangedCount).toBe(1);
    });
});

// ============================================================================
// diffSpace — removed
// ============================================================================

describe('diffSpace — removed', () => {
    it('detects pages in state not in catalog', () => {
        const state = makeState('SPC', {
            '1': { title: 'A', version: 1, parentId: null },
            '2': { title: 'B', version: 2, parentId: null },
        });
        const catalog = [makeEntry('1', { title: 'A', version: 1 })];

        const diff = diffSpace(state, catalog);

        expect(diff.removed).toHaveLength(1);
        expect(diff.removed[0].id).toBe('2');
        expect(diff.removed[0].title).toBe('B');
        expect(diff.removed[0].version).toBe(2);
    });
});

// ============================================================================
// diffSpace — mixed
// ============================================================================

describe('diffSpace — mixed', () => {
    it('handles a mix of added/changed/removed/unchanged', () => {
        const state = makeState('SPC', {
            '1': { title: 'A', version: 1, parentId: null },     // unchanged
            '2': { title: 'B', version: 1, parentId: null },     // changed (version)
            '3': { title: 'C', version: 1, parentId: null },     // removed
        });
        const catalog = [
            makeEntry('1', { title: 'A', version: 1 }),          // unchanged
            makeEntry('2', { title: 'B', version: 2 }),          // changed
            makeEntry('4', { title: 'D', version: 1 }),          // added
        ];

        const diff = diffSpace(state, catalog);

        expect(diff.added).toHaveLength(1);
        expect(diff.added[0].id).toBe('4');
        expect(diff.changed).toHaveLength(1);
        expect(diff.changed[0].id).toBe('2');
        expect(diff.removed).toHaveLength(1);
        expect(diff.removed[0].id).toBe('3');
        expect(diff.unchangedCount).toBe(1);
    });

    it('handles empty catalog with non-null state (all removed)', () => {
        const state = makeState('SPC', {
            '1': { title: 'A', version: 1, parentId: null },
            '2': { title: 'B', version: 2, parentId: null },
        });

        const diff = diffSpace(state, []);

        expect(diff.added).toHaveLength(0);
        expect(diff.changed).toHaveLength(0);
        expect(diff.removed).toHaveLength(2);
        expect(diff.unchangedCount).toBe(0);
    });

    it('handles empty state (no pages) with non-null state', () => {
        const state = makeState('SPC', {});
        const catalog = [makeEntry('1'), makeEntry('2')];

        const diff = diffSpace(state, catalog);

        expect(diff.added).toHaveLength(2);
        expect(diff.changed).toHaveLength(0);
        expect(diff.removed).toHaveLength(0);
    });
});

// ============================================================================
// emptyState
// ============================================================================

describe('emptyState', () => {
    it('creates a valid empty state', () => {
        const state = emptyState('SPC');

        expect(state.format).toBe('onyx-sync/space-state');
        expect(state.version).toBe(1);
        expect(state.space).toBe('SPC');
        expect(state.lastSync).toBeTruthy();
        expect(Object.keys(state.pages)).toHaveLength(0);
    });

    it('diffing against empty state marks all as added', () => {
        const state = emptyState('SPC');
        const catalog = [makeEntry('1'), makeEntry('2')];

        const diff = diffSpace(state, catalog);

        expect(diff.added).toHaveLength(2);
        expect(diff.removed).toHaveLength(0);
    });
});
