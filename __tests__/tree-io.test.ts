/**
 * Tests for tree-io.ts (MemoryTreeStore)
 *
 * Covers:
 *   - write/read roundtrip for pages
 *   - deletePage
 *   - writeState/readState
 *   - writeManifest
 *   - listPages
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryTreeStore } from '@/core/tree-io';
import type { SpaceState, SpaceTreeManifest, TreePageFile } from '@/core/space-types';

// ============================================================================
// Helpers
// ============================================================================

function makePage(id: string, overrides: Partial<TreePageFile> = {}): TreePageFile {
    return {
        id,
        title: `Page ${id}`,
        parentId: null,
        version: 1,
        labels: [],
        storage: `<p>content ${id}</p>`,
        ...overrides,
    };
}

function makeState(): SpaceState {
    return {
        format: 'onyx-sync/space-state',
        version: 1,
        space: 'SPC',
        lastSync: '2026-01-01T00:00:00Z',
        pages: {
            '1': { title: 'A', version: 1, parentId: null },
            '2': { title: 'B', version: 2, parentId: '1' },
        },
    };
}

function makeManifest(pageCount: number): SpaceTreeManifest {
    return {
        format: 'onyx-sync/space-tree',
        version: 1,
        space: 'SPC',
        exportedAt: '2026-01-01T00:00:00Z',
        pageCount,
    };
}

// ============================================================================
// Tests
// ============================================================================

describe('MemoryTreeStore', () => {
    let store: MemoryTreeStore;

    beforeEach(() => {
        store = new MemoryTreeStore();
    });

    // ── Page roundtrip ──────────────────────────────────────────

    it('writes and reads a page', async () => {
        const page = makePage('123');
        await store.writePage(page);

        const read = await store.readPage('123');
        expect(read).not.toBeNull();
        expect(read!.id).toBe('123');
        expect(read!.title).toBe('Page 123');
        expect(read!.storage).toBe('<p>content 123</p>');
    });

    it('returns null for non-existent page', async () => {
        const read = await store.readPage('nonexistent');
        expect(read).toBeNull();
    });

    it('overwrites page on re-write', async () => {
        await store.writePage(makePage('1', { version: 1 }));
        await store.writePage(makePage('1', { version: 2 }));

        const read = await store.readPage('1');
        expect(read!.version).toBe(2);
    });

    // ── deletePage ──────────────────────────────────────────────

    it('deletes a page', async () => {
        await store.writePage(makePage('1'));
        await store.deletePage('1');

        const read = await store.readPage('1');
        expect(read).toBeNull();
    });

    it('does not throw when deleting non-existent page', async () => {
        await expect(store.deletePage('nonexistent')).resolves.toBeUndefined();
    });

    // ── listPages ───────────────────────────────────────────────

    it('lists all page IDs', async () => {
        await store.writePage(makePage('1'));
        await store.writePage(makePage('2'));
        await store.writePage(makePage('3'));

        const ids = await store.listPages();
        expect(ids).toHaveLength(3);
        expect(ids).toContain('1');
        expect(ids).toContain('2');
        expect(ids).toContain('3');
    });

    it('returns empty array when no pages', async () => {
        const ids = await store.listPages();
        expect(ids).toEqual([]);
    });

    // ── State roundtrip ─────────────────────────────────────────

    it('writes and reads state', async () => {
        const state = makeState();
        await store.writeState(state);

        const read = await store.readState();
        expect(read).not.toBeNull();
        expect(read!.space).toBe('SPC');
        expect(Object.keys(read!.pages)).toHaveLength(2);
        expect(read!.pages['1'].title).toBe('A');
        expect(read!.pages['2'].parentId).toBe('1');
    });

    it('returns null for state when not written', async () => {
        const read = await store.readState();
        expect(read).toBeNull();
    });

    // ── Manifest ────────────────────────────────────────────────

    it('writes and reads manifest via getManifest', async () => {
        const manifest = makeManifest(42);
        await store.writeManifest(manifest);

        const read = store.getManifest();
        expect(read).not.toBeNull();
        expect(read!.pageCount).toBe(42);
        expect(read!.space).toBe('SPC');
    });

    // ── Full roundtrip ──────────────────────────────────────────

    it('full roundtrip: write pages, state, manifest, then read back', async () => {
        await store.writePage(makePage('1', { parentId: null }));
        await store.writePage(makePage('2', { parentId: '1' }));
        await store.writeState(makeState());
        await store.writeManifest(makeManifest(2));

        // Verify pages
        const ids = await store.listPages();
        expect(ids).toHaveLength(2);

        const page1 = await store.readPage('1');
        const page2 = await store.readPage('2');
        expect(page1!.parentId).toBeNull();
        expect(page2!.parentId).toBe('1');

        // Verify state
        const state = await store.readState();
        expect(state!.pages['2'].version).toBe(2);

        // Verify manifest
        const manifest = store.getManifest();
        expect(manifest!.pageCount).toBe(2);
    });
});
