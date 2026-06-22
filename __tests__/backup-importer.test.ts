/**
 * Tests for backup-importer.ts
 *
 * Covers:
 *  - parseJsonEntry: null for missing/invalid entries
 *  - orderByTree: BFS ordering (parents before children)
 *  - uploadPageAttachments: uploaded counter never exceeds total
 *  - fetchExistingTitles: handles empty response without looping
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mocks — vitest lifts vi.mock calls before imports
vi.mock('@/utils/transport', () => ({
    fetchJson: vi.fn(),
    transportRequest: vi.fn(),
}));

vi.mock('@/api/confluence', () => ({
    getBaseUrl: () => 'https://confluence.test',
}));

vi.mock('@/utils/logger', () => ({
    ctmLog: vi.fn(),
    ctmError: vi.fn(),
}));

import {
    orderByTree,
    parseJsonEntry,
    uploadPageAttachments,
    fetchExistingTitles,
} from '@/core/backup-importer';
import { transportRequest, fetchJson } from '@/utils/transport';
import type { BackupPageData } from '@/core/backup-exporter';

// ============================================================================
// Helpers
// ============================================================================

function makePage(id: string, parentId: string | null = null): BackupPageData {
    return {
        id,
        title: `Page ${id}`,
        parentId,
        spaceKey: 'TEST',
        ancestors: [],
        version: null,
        labels: [],
        body: { storage: `<p>Content ${id}</p>` },
        attachments: [],
    };
}

function strToU8(s: string): Uint8Array {
    return new TextEncoder().encode(s);
}

// ============================================================================
// parseJsonEntry
// ============================================================================

describe('parseJsonEntry', () => {
    it('returns null for a non-existent path', () => {
        expect(parseJsonEntry({}, 'missing.json')).toBeNull();
    });

    it('returns null for an empty Uint8Array', () => {
        const entries = { 'empty.json': new Uint8Array(0) };
        expect(parseJsonEntry(entries, 'empty.json')).toBeNull();
    });

    it('returns null for invalid JSON', () => {
        const entries = { 'bad.json': strToU8('not valid json {{{') };
        expect(parseJsonEntry(entries, 'bad.json')).toBeNull();
    });

    it('parses valid JSON and returns the value', () => {
        const obj = { foo: 'bar', num: 42 };
        const entries = { 'valid.json': strToU8(JSON.stringify(obj)) };
        expect(parseJsonEntry(entries, 'valid.json')).toEqual(obj);
    });

    it('parses an array value correctly', () => {
        const arr = [1, 2, 3];
        const entries = { 'arr.json': strToU8(JSON.stringify(arr)) };
        expect(parseJsonEntry(entries, 'arr.json')).toEqual(arr);
    });
});

// ============================================================================
// orderByTree
// ============================================================================

describe('orderByTree', () => {
    it('places the root page first', () => {
        const pages = [makePage('child', 'root'), makePage('root', null)];
        const tree = {
            id: 'root',
            title: 'Root',
            children: [{ id: 'child', title: 'Child', children: [] }],
        };

        const ordered = orderByTree(pages, tree);
        expect(ordered[0].id).toBe('root');
    });

    it('places all parents before their children', () => {
        // Tree: root → [a, b], a → [a1, a2]
        const pages = [
            makePage('a1', 'a'),
            makePage('a', 'root'),
            makePage('b', 'root'),
            makePage('root', null),
            makePage('a2', 'a'),
        ];
        const tree = {
            id: 'root',
            title: 'Root',
            children: [
                {
                    id: 'a',
                    title: 'A',
                    children: [
                        { id: 'a1', title: 'A1', children: [] },
                        { id: 'a2', title: 'A2', children: [] },
                    ],
                },
                { id: 'b', title: 'B', children: [] },
            ],
        };

        const ordered = orderByTree(pages, tree);
        const idx = (id: string) => ordered.findIndex(p => p.id === id);

        // BFS order: root, a, b, a1, a2
        expect(idx('root')).toBeLessThan(idx('a'));
        expect(idx('root')).toBeLessThan(idx('b'));
        expect(idx('a')).toBeLessThan(idx('a1'));
        expect(idx('a')).toBeLessThan(idx('a2'));
    });

    it('appends pages not present in tree at the end', () => {
        const pages = [makePage('root', null), makePage('orphan', null)];
        const tree = { id: 'root', title: 'Root', children: [] };

        const ordered = orderByTree(pages, tree);
        expect(ordered).toHaveLength(2);
        expect(ordered[0].id).toBe('root');
        expect(ordered[1].id).toBe('orphan');
    });

    it('returns empty array for empty pages input', () => {
        const tree = { id: 'root', title: 'Root', children: [] };
        expect(orderByTree([], tree)).toEqual([]);
    });
});

// ============================================================================
// uploadPageAttachments — counter correctness
// ============================================================================

describe('uploadPageAttachments', () => {
    const mockedTransportRequest = vi.mocked(transportRequest);

    beforeEach(() => {
        mockedTransportRequest.mockReset();
    });

    it('calls onProgress with uploaded = n after n successful uploads', async () => {
        mockedTransportRequest.mockResolvedValue(undefined);

        const entries: Record<string, Uint8Array> = {
            'attachments/page1/file-a.png': strToU8('data-a'),
            'attachments/page1/file-b.png': strToU8('data-b'),
            'attachments/page2/file-c.png': strToU8('data-c'),
        };
        const attachmentPaths = Object.keys(entries);
        const idMapping = new Map([
            ['page1', 'new-page-1'],
            ['page2', 'new-page-2'],
        ]);

        const progressCalls: Array<[string, number, number]> = [];
        const onProgress = (phase: string, current: number, total: number) => {
            progressCalls.push([phase, current, total]);
        };

        await uploadPageAttachments('https://confluence.test', attachmentPaths, entries, idMapping, onProgress);

        // Filter to the per-iteration calls (exclude the initial call with 0)
        const iterCalls = progressCalls.filter(([, current]) => current > 0);

        // Uploaded counter must never exceed total
        for (const [, current, total] of iterCalls) {
            expect(current).toBeLessThanOrEqual(total);
        }

        // Final value must equal the number of successfully uploaded files
        const lastCall = progressCalls[progressCalls.length - 1];
        expect(lastCall[1]).toBe(3); // all 3 succeeded
        expect(lastCall[2]).toBe(3);
    });

    it('does not increment counter for failed uploads', async () => {
        mockedTransportRequest
            .mockResolvedValueOnce(undefined)   // file-a: success
            .mockRejectedValueOnce(new Error('network error')) // file-b: fail
            .mockResolvedValueOnce(undefined);  // file-c: success

        const entries: Record<string, Uint8Array> = {
            'attachments/p1/file-a.png': strToU8('a'),
            'attachments/p1/file-b.png': strToU8('b'),
            'attachments/p1/file-c.png': strToU8('c'),
        };
        const idMapping = new Map([['p1', 'new-p1']]);

        const progressValues: number[] = [];
        await uploadPageAttachments(
            'https://confluence.test',
            Object.keys(entries),
            entries,
            idMapping,
            (_phase, current) => progressValues.push(current)
        );

        // progress sequence: 0, 1, 1, 2  (failure keeps counter at 1)
        expect(progressValues).toEqual([0, 1, 1, 2]);
    });

    it('skips attachments whose page was not created (not in idMapping)', async () => {
        mockedTransportRequest.mockResolvedValue(undefined);

        const entries: Record<string, Uint8Array> = {
            'attachments/unknown-page/file.png': strToU8('x'),
        };
        const idMapping = new Map<string, string>(); // no mapping

        const onProgress = vi.fn();
        await uploadPageAttachments(
            'https://confluence.test',
            Object.keys(entries),
            entries,
            idMapping,
            onProgress
        );

        expect(mockedTransportRequest).not.toHaveBeenCalled();
        // final progress: uploaded=0, total=1
        expect(onProgress).toHaveBeenLastCalledWith('Uploading attachments...', 0, 1);
    });
});

// ============================================================================
// fetchExistingTitles — pagination and empty response
// ============================================================================

describe('fetchExistingTitles', () => {
    const mockedFetchJson = vi.mocked(fetchJson);

    beforeEach(() => {
        mockedFetchJson.mockReset();
    });

    it('returns an empty set when the first response has no results', async () => {
        mockedFetchJson.mockResolvedValueOnce({ results: [], size: 0 });

        const titles = await fetchExistingTitles('https://confluence.test', 'MYSPACE');

        expect(titles.size).toBe(0);
        expect(mockedFetchJson).toHaveBeenCalledTimes(1);
    });

    it('collects titles from the response', async () => {
        mockedFetchJson.mockResolvedValueOnce({
            results: [{ title: 'Page A' }, { title: 'Page B' }],
            size: 2,
        });

        const titles = await fetchExistingTitles('https://confluence.test', 'MYSPACE');

        expect(titles.has('Page A')).toBe(true);
        expect(titles.has('Page B')).toBe(true);
        expect(titles.size).toBe(2);
    });

    it('paginates when first page has _links.next (more results available)', async () => {
        const fullPage = Array.from({ length: 200 }, (_, i) => ({ title: `Page ${i}` }));
        mockedFetchJson
            // First page: _links.next present → hasMore = true
            .mockResolvedValueOnce({ results: fullPage, size: 200, _links: { next: '/rest/api/content/search?cql=...&start=200' } })
            // Second page: no _links.next → hasMore = false
            .mockResolvedValueOnce({ results: [], size: 0 });

        const titles = await fetchExistingTitles('https://confluence.test', 'MYSPACE');

        expect(mockedFetchJson).toHaveBeenCalledTimes(2);
        expect(titles.size).toBe(200);
    });

    it('stops after one request when _links.next is absent (no spurious extra request)', async () => {
        // Even 200 results — if no _links.next, it means this is the last page.
        // The old length===limit logic would make an extra empty request here; _links.next does not.
        const fullPage = Array.from({ length: 200 }, (_, i) => ({ title: `Page ${i}` }));
        mockedFetchJson.mockResolvedValueOnce({ results: fullPage, size: 200 });
        // No second mock — would throw if called

        const titles = await fetchExistingTitles('https://confluence.test', 'MYSPACE');

        expect(mockedFetchJson).toHaveBeenCalledTimes(1);
        expect(titles.size).toBe(200);
    });

    it('stops after a partial page (no infinite loop)', async () => {
        const partial = Array.from({ length: 5 }, (_, i) => ({ title: `Page ${i}` }));
        mockedFetchJson.mockResolvedValueOnce({ results: partial, size: 5 });

        const titles = await fetchExistingTitles('https://confluence.test', 'MYSPACE');

        expect(mockedFetchJson).toHaveBeenCalledTimes(1);
        expect(titles.size).toBe(5);
    });

    it('stops and returns collected titles if a request throws', async () => {
        const firstPage = [{ title: 'Existing' }];
        mockedFetchJson
            .mockResolvedValueOnce({ results: firstPage, size: 1 })
            .mockRejectedValueOnce(new Error('network fail'));

        const titles = await fetchExistingTitles('https://confluence.test', 'MYSPACE');

        expect(titles.has('Existing')).toBe(true);
        // second call threw → loop breaks → only 1 fetch beyond the successful one
        expect(mockedFetchJson).toHaveBeenCalledTimes(1);
    });
});
