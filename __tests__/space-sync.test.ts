/**
 * Tests for space-sync.ts
 *
 * Covers:
 *   - scanSpace: fetches catalog, reads state, returns diff
 *   - applySpaceSync: writes only selected added+changed, deletes removed,
 *     updates state+manifest, records failures, report shape
 *
 * Mocks the transport layer the same way as sync-importer.test.ts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mocks
vi.mock('@/api/confluence', () => ({
    getBaseUrl: () => 'https://confluence.test',
    fetchJson: vi.fn(),
    fetchPageForHub: vi.fn(),
}));

vi.mock('@/utils/logger', () => ({
    ctmLog: vi.fn(),
    ctmError: vi.fn(),
}));

import { scanSpace, applySpaceSync } from '@/core/space-sync';
import { MemoryTreeStore } from '@/core/tree-io';
import { fetchJson, fetchPageForHub } from '@/api/confluence';
import type {
    CatalogEntry,
    SpaceDiff,
    SpaceState,
} from '@/core/space-types';

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
    pages: Record<string, { title: string; version: number; parentId: string | null }>
): SpaceState {
    return {
        format: 'onyx-sync/space-state',
        version: 1,
        space: 'SPC',
        lastSync: '2026-01-01T00:00:00Z',
        pages,
    };
}

function makePageResponse(id: string, title: string, version = 1): unknown {
    return {
        id,
        title,
        htmlContent: `<p>body ${id}</p>`,
        ancestors: [],
        version: { number: version, when: '2026-01-01T00:00:00Z' },
        labels: ['onyx-sync'],
        space: 'SPC',
    };
}

function makeCatalogResponse(entries: CatalogEntry[]): unknown {
    return {
        results: entries.map(e => ({
            id: e.id,
            title: e.title,
            ancestors: e.parentId ? [{ id: e.parentId, title: 'Parent' }] : [],
            version: { number: e.version },
        })),
        _links: {},
    };
}

// ============================================================================
// scanSpace
// ============================================================================

describe('scanSpace', () => {
    const mockedFetchJson = vi.mocked(fetchJson);

    beforeEach(() => {
        mockedFetchJson.mockReset();
    });

    it('returns catalog and diff (all added for fresh store)', async () => {
        const store = new MemoryTreeStore();
        const catalog = [makeEntry('1'), makeEntry('2')];

        mockedFetchJson.mockResolvedValueOnce(makeCatalogResponse(catalog));

        const result = await scanSpace(store, 'SPC');

        expect(result.catalog).toHaveLength(2);
        expect(result.diff.added).toHaveLength(2);
        expect(result.diff.changed).toHaveLength(0);
        expect(result.diff.removed).toHaveLength(0);
    });

    it('detects changes vs stored state', async () => {
        const store = newTreeStoreWithState(makeState({
            '1': { title: 'Page 1', version: 1, parentId: null },
            '2': { title: 'Old Title', version: 1, parentId: null },
        }));
        const catalog = [
            makeEntry('1', { version: 1 }),           // unchanged
            makeEntry('2', { title: 'New Title', version: 2 }), // changed
            makeEntry('3', { version: 1 }),           // added
        ];

        mockedFetchJson.mockResolvedValueOnce(makeCatalogResponse(catalog));

        const result = await scanSpace(store, 'SPC');

        expect(result.diff.added).toHaveLength(1);
        expect(result.diff.added[0].id).toBe('3');
        expect(result.diff.changed).toHaveLength(1);
        expect(result.diff.changed[0].id).toBe('2');
        expect(result.diff.changed[0].oldVersion).toBe(1);
        expect(result.diff.removed).toHaveLength(0);
        expect(result.diff.unchangedCount).toBe(1);
    });

    it('detects removed pages', async () => {
        const store = newTreeStoreWithState(makeState({
            '1': { title: 'A', version: 1, parentId: null },
            '2': { title: 'B', version: 1, parentId: null },
        }));
        const catalog = [makeEntry('1', { version: 1 })];

        mockedFetchJson.mockResolvedValueOnce(makeCatalogResponse(catalog));

        const result = await scanSpace(store, 'SPC');

        expect(result.diff.removed).toHaveLength(1);
        expect(result.diff.removed[0].id).toBe('2');
    });

    it('calls onProgress', async () => {
        const store = new MemoryTreeStore();
        mockedFetchJson.mockResolvedValueOnce(makeCatalogResponse([makeEntry('1')]));

        const calls: Array<[string, number, number]> = [];
        await scanSpace(store, 'SPC', (phase, current, total) => {
            calls.push([phase, current, total]);
        });

        expect(calls.length).toBeGreaterThanOrEqual(2);
        expect(calls[0][0]).toContain('Fetching');
    });
});

// ============================================================================
// applySpaceSync — write added/changed
// ============================================================================

describe('applySpaceSync — write added/changed', () => {
    const mockedFetchPageForHub = vi.mocked(fetchPageForHub);

    beforeEach(() => {
        mockedFetchPageForHub.mockReset();
    });

    it('fetches and writes selected added pages', async () => {
        const store = new MemoryTreeStore();
        const catalog = [makeEntry('1', { version: 1 })];
        const diff: SpaceDiff = {
            added: [makeEntry('1', { version: 1 })],
            changed: [],
            removed: [],
            unchangedCount: 0,
        };

        mockedFetchPageForHub.mockResolvedValueOnce(
            makePageResponse('1', 'Page 1', 1) as never
        );

        const report = await applySpaceSync(
            store, 'SPC', catalog, diff, new Set(['1'])
        );

        expect(report.added).toBe(1);
        expect(report.written).toBe(1);
        expect(report.failed).toHaveLength(0);

        const page = await store.readPage('1');
        expect(page).not.toBeNull();
        expect(page!.storage).toBe('<p>body 1</p>');
    });

    it('fetches and writes selected changed pages', async () => {
        const store = new MemoryTreeStore();
        const catalog = [makeEntry('1', { version: 2 })];
        const diff: SpaceDiff = {
            added: [],
            changed: [{ ...makeEntry('1', { version: 2 }), oldVersion: 1 }],
            removed: [],
            unchangedCount: 0,
        };

        mockedFetchPageForHub.mockResolvedValueOnce(
            makePageResponse('1', 'Page 1', 2) as never
        );

        const report = await applySpaceSync(
            store, 'SPC', catalog, diff, new Set(['1'])
        );

        expect(report.changed).toBe(1);
        expect(report.written).toBe(1);

        const page = await store.readPage('1');
        expect(page!.version).toBe(2);
    });

    it('skips unselected pages', async () => {
        const store = new MemoryTreeStore();
        const catalog = [makeEntry('1'), makeEntry('2')];
        const diff: SpaceDiff = {
            added: [makeEntry('1'), makeEntry('2')],
            changed: [],
            removed: [],
            unchangedCount: 0,
        };

        // Only select '1'
        mockedFetchPageForHub.mockResolvedValueOnce(
            makePageResponse('1', 'Page 1') as never
        );

        const report = await applySpaceSync(
            store, 'SPC', catalog, diff, new Set(['1'])
        );

        expect(report.added).toBe(1);
        expect(report.written).toBe(1);

        const page2 = await store.readPage('2');
        expect(page2).toBeNull();
    });

    it('builds TreePageFile with parentId from ancestors', async () => {
        const store = new MemoryTreeStore();
        const catalog = [makeEntry('1', { parentId: '99' })];
        const diff: SpaceDiff = {
            added: [makeEntry('1', { parentId: '99' })],
            changed: [],
            removed: [],
            unchangedCount: 0,
        };

        mockedFetchPageForHub.mockResolvedValueOnce({
            id: '1',
            title: 'Page 1',
            htmlContent: '<p>body</p>',
            ancestors: [{ id: '99', title: 'Parent', type: 'page' }],
            version: { number: 1, when: '2026-01-01T00:00:00Z' },
            labels: ['onyx-sync'],
            space: 'SPC',
        } as never);

        const report = await applySpaceSync(
            store, 'SPC', catalog, diff, new Set(['1'])
        );

        expect(report.written).toBe(1);
        const page = await store.readPage('1');
        expect(page!.parentId).toBe('99');
        expect(page!.labels).toContain('onyx-sync');
    });
});

// ============================================================================
// applySpaceSync — delete removed
// ============================================================================

describe('applySpaceSync — delete removed', () => {
    const mockedFetchPageForHub = vi.mocked(fetchPageForHub);

    beforeEach(() => {
        mockedFetchPageForHub.mockReset();
    });

    it('deletes selected removed pages', async () => {
        const store = new MemoryTreeStore();
        // Pre-populate with a page that will be removed
        await store.writePage({
            id: 'old',
            title: 'Old Page',
            parentId: null,
            version: 1,
            labels: [],
            storage: '<p>old</p>',
        });

        const catalog: CatalogEntry[] = [];
        const diff: SpaceDiff = {
            added: [],
            changed: [],
            removed: [{ id: 'old', title: 'Old Page', version: 1 }],
            unchangedCount: 0,
        };

        const report = await applySpaceSync(
            store, 'SPC', catalog, diff, new Set(['old'])
        );

        expect(report.removed).toBe(1);
        const page = await store.readPage('old');
        expect(page).toBeNull();
    });
});

// ============================================================================
// applySpaceSync — state + manifest update
// ============================================================================

describe('applySpaceSync — state + manifest', () => {
    const mockedFetchPageForHub = vi.mocked(fetchPageForHub);

    beforeEach(() => {
        mockedFetchPageForHub.mockReset();
    });

    it('writes updated state with catalog versions', async () => {
        const store = new MemoryTreeStore();
        const catalog = [makeEntry('1', { version: 3 })];
        const diff: SpaceDiff = {
            added: [makeEntry('1', { version: 3 })],
            changed: [],
            removed: [],
            unchangedCount: 0,
        };

        mockedFetchPageForHub.mockResolvedValueOnce(
            makePageResponse('1', 'Page 1', 3) as never
        );

        await applySpaceSync(store, 'SPC', catalog, diff, new Set(['1']));

        const state = await store.readState();
        expect(state).not.toBeNull();
        expect(state!.space).toBe('SPC');
        expect(state!.pages['1'].version).toBe(3);
        expect(state!.lastSync).toBeTruthy();
    });

    it('writes manifest with correct page count', async () => {
        const store = new MemoryTreeStore();
        const catalog = [makeEntry('1'), makeEntry('2')];
        const diff: SpaceDiff = {
            added: [makeEntry('1'), makeEntry('2')],
            changed: [],
            removed: [],
            unchangedCount: 0,
        };

        mockedFetchPageForHub
            .mockResolvedValueOnce(makePageResponse('1', 'Page 1') as never)
            .mockResolvedValueOnce(makePageResponse('2', 'Page 2') as never);

        await applySpaceSync(store, 'SPC', catalog, diff, new Set(['1', '2']));

        const manifest = store.getManifest();
        expect(manifest).not.toBeNull();
        expect(manifest!.format).toBe('onyx-sync/space-tree');
        expect(manifest!.pageCount).toBe(2);
        expect(manifest!.space).toBe('SPC');
    });
});

// ============================================================================
// applySpaceSync — failures + report shape
// ============================================================================

describe('applySpaceSync — failures + report', () => {
    const mockedFetchPageForHub = vi.mocked(fetchPageForHub);

    beforeEach(() => {
        mockedFetchPageForHub.mockReset();
    });

    it('records fetch failures without aborting', async () => {
        const store = new MemoryTreeStore();
        const catalog = [makeEntry('1'), makeEntry('2')];
        const diff: SpaceDiff = {
            added: [makeEntry('1'), makeEntry('2')],
            changed: [],
            removed: [],
            unchangedCount: 0,
        };

        mockedFetchPageForHub
            .mockResolvedValueOnce(makePageResponse('1', 'Page 1') as never)
            .mockResolvedValueOnce(null); // fetchPageForHub returns null → failure

        const report = await applySpaceSync(
            store, 'SPC', catalog, diff, new Set(['1', '2'])
        );

        expect(report.written).toBe(1);
        expect(report.failed).toHaveLength(1);
        expect(report.failed[0].id).toBe('2');
    });

    it('records write failures without aborting', async () => {
        const store = new MemoryTreeStore();
        const catalog = [makeEntry('1')];
        const diff: SpaceDiff = {
            added: [makeEntry('1')],
            changed: [],
            removed: [],
            unchangedCount: 0,
        };

        // fetchPageForHub throws
        mockedFetchPageForHub.mockRejectedValueOnce(new Error('network fail'));

        const report = await applySpaceSync(
            store, 'SPC', catalog, diff, new Set(['1'])
        );

        expect(report.written).toBe(0);
        expect(report.failed).toHaveLength(1);
        expect(report.failed[0].error).toContain('network fail');
    });

    it('returns correct report shape', async () => {
        const store = new MemoryTreeStore();
        const catalog = [makeEntry('1')];
        const diff: SpaceDiff = {
            added: [makeEntry('1')],
            changed: [],
            removed: [],
            unchangedCount: 5,
        };

        mockedFetchPageForHub.mockResolvedValueOnce(
            makePageResponse('1', 'Page 1') as never
        );

        const report = await applySpaceSync(
            store, 'SPC', catalog, diff, new Set(['1'])
        );

        expect(report).toHaveProperty('space', 'SPC');
        expect(report).toHaveProperty('scannedAt');
        expect(typeof report.scannedAt).toBe('string');
        expect(report).toHaveProperty('added', 1);
        expect(report).toHaveProperty('changed', 0);
        expect(report).toHaveProperty('removed', 0);
        expect(report).toHaveProperty('unchangedCount', 5);
        expect(report).toHaveProperty('failed');
        expect(report).toHaveProperty('written', 1);
        expect(Array.isArray(report.failed)).toBe(true);
    });

    it('calls onProgress during apply', async () => {
        const store = new MemoryTreeStore();
        const catalog = [makeEntry('1')];
        const diff: SpaceDiff = {
            added: [makeEntry('1')],
            changed: [],
            removed: [],
            unchangedCount: 0,
        };

        mockedFetchPageForHub.mockResolvedValueOnce(
            makePageResponse('1', 'Page 1') as never
        );

        const calls: Array<[string, number, number]> = [];
        await applySpaceSync(store, 'SPC', catalog, diff, new Set(['1']), (phase, current, total) => {
            calls.push([phase, current, total]);
        });

        expect(calls.length).toBeGreaterThanOrEqual(2);
        expect(calls[0][0]).toContain('Applying');
    });
});

// ============================================================================
// Helper: create a MemoryTreeStore with pre-populated state
// ============================================================================

function newTreeStoreWithState(state: SpaceState): MemoryTreeStore {
    const store = new MemoryTreeStore();
    // Write state synchronously (MemoryTreeStore is in-memory)
    void store.writeState(state);
    return store;
}
