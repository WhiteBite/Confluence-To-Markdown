/**
 * Tests for sync-importer.ts
 *
 * Covers:
 *   - planSync: create/update/skip actions with mocked existing pages
 *   - applySync: create POST body, update PUT body + version increment,
 *     label calls, parent ordering, report shape
 *   - fetchExistingPages: pagination via _links.next
 *   - orderPagesParentsFirst / orderRowsParentsFirst: parents-first ordering
 *
 * Mocks the transport layer the same way as backup-importer.test.ts.
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
    planSync,
    applySync,
    fetchExistingPages,
    createPage,
    updatePage,
    applyLabels,
    orderPagesParentsFirst,
    orderRowsParentsFirst,
    type SyncPlan,
    type SyncPlanRow,
} from '@/core/sync-importer';
import { transportRequest, fetchJson } from '@/utils/transport';
import type { SyncPayload, SyncPayloadPage } from '@/core/sync-payload';

// ============================================================================
// Helpers
// ============================================================================

function makePage(overrides: Partial<SyncPayloadPage> = {}): SyncPayloadPage {
    return {
        id: 'p1',
        title: 'Page 1',
        parent: null,
        storage: '<p>content</p>',
        ...overrides,
    };
}

function makePayload(
    pages: SyncPayloadPage[],
    space = 'SPC'
): SyncPayload {
    return {
        format: 'onyx-sync/confluence-pages',
        version: 1,
        space,
        generatedAt: '2026-08-19T12:00:00Z',
        pages,
    };
}

function makeExistingPage(
    id: string,
    title: string,
    body: string,
    version = 1
): { id: string; title: string; body: { storage: { value: string } }; version: { number: number } } {
    return {
        id,
        title,
        body: { storage: { value: body } },
        version: { number: version },
    };
}

// ============================================================================
// planSync
// ============================================================================

describe('planSync', () => {
    const mockedFetchJson = vi.mocked(fetchJson);

    beforeEach(() => {
        mockedFetchJson.mockReset();
    });

    it('marks all pages as create when space is empty', async () => {
        const payload = makePayload([
            makePage({ id: 'a', title: 'Page A' }),
            makePage({ id: 'b', title: 'Page B', parent: 'a' }),
        ]);

        mockedFetchJson.mockResolvedValueOnce({ results: [], _links: {} });

        const plan = await planSync(payload);

        expect(plan.space).toBe('SPC');
        expect(plan.rows).toHaveLength(2);
        expect(plan.rows[0].action).toBe('create');
        expect(plan.rows[1].action).toBe('create');
        expect(plan.rows[0].localId).toBe('a');
        expect(plan.rows[1].localId).toBe('b');
    });

    it('marks page as skip when body matches (normalized)', async () => {
        const payload = makePayload([
            makePage({
                id: 'a',
                title: 'Existing',
                storage: '<p>hello world</p>',
            }),
        ]);

        // Existing page has same body but with extra whitespace
        mockedFetchJson.mockResolvedValueOnce({
            results: [
                makeExistingPage('123', 'Existing', '<p>hello   world</p>', 5),
            ],
            _links: {},
        });

        const plan = await planSync(payload);

        expect(plan.rows).toHaveLength(1);
        expect(plan.rows[0].action).toBe('skip');
        expect(plan.rows[0].existingId).toBe('123');
        expect(plan.rows[0].existingVersion).toBe(5);
    });

    it('marks page as update when body differs', async () => {
        const payload = makePayload([
            makePage({
                id: 'a',
                title: 'Existing',
                storage: '<p>new content</p>',
            }),
        ]);

        mockedFetchJson.mockResolvedValueOnce({
            results: [
                makeExistingPage('456', 'Existing', '<p>old content</p>', 3),
            ],
            _links: {},
        });

        const plan = await planSync(payload);

        expect(plan.rows).toHaveLength(1);
        expect(plan.rows[0].action).toBe('update');
        expect(plan.rows[0].existingId).toBe('456');
        expect(plan.rows[0].existingVersion).toBe(3);
    });

    it('orders rows parents-first', async () => {
        const payload = makePayload([
            makePage({ id: 'child', title: 'Child', parent: 'root' }),
            makePage({ id: 'root', title: 'Root', parent: null }),
        ]);

        mockedFetchJson.mockResolvedValueOnce({ results: [], _links: {} });

        const plan = await planSync(payload);

        expect(plan.rows[0].localId).toBe('root');
        expect(plan.rows[1].localId).toBe('child');
    });

    it('paginates via _links.next', async () => {
        const payload = makePayload([
            makePage({ id: 'p1', title: 'Last', storage: '<p>last</p>' }),
        ]);

        const page1 = Array.from({ length: 200 }, (_, i) =>
            makeExistingPage(String(i), `Page ${i}`, '<p>x</p>')
        );
        const page2 = [
            makeExistingPage('200', 'Last', '<p>last</p>', 1),
        ];

        mockedFetchJson
            .mockResolvedValueOnce({
                results: page1,
                _links: { next: '/rest/api/content/search?cql=...&start=200' },
            })
            .mockResolvedValueOnce({
                results: page2,
                _links: {},
            });

        const plan = await planSync(payload);

        expect(mockedFetchJson).toHaveBeenCalledTimes(2);
        // 'Last' only appears in the second page of results
        expect(plan.rows[0].action).toBe('skip');
        expect(plan.rows[0].existingId).toBe('200');
    });

    it('calls onProgress', async () => {
        const payload = makePayload([makePage()]);
        mockedFetchJson.mockResolvedValueOnce({ results: [], _links: {} });

        const calls: Array<[string, number, number]> = [];
        await planSync(payload, (phase, current, total) => {
            calls.push([phase, current, total]);
        });

        expect(calls.length).toBeGreaterThanOrEqual(2);
        expect(calls[0][0]).toContain('Fetching');
    });
});

// ============================================================================
// applySync — create
// ============================================================================

describe('applySync — create', () => {
    const mockedTransportRequest = vi.mocked(transportRequest);

    beforeEach(() => {
        mockedTransportRequest.mockReset();
    });

    it('POSTs to /rest/api/content with correct body', async () => {
        const payload = makePayload([
            makePage({
                id: 'p1',
                title: 'New Page',
                storage: '<p>body</p>',
            }),
        ]);

        const plan: SyncPlan = {
            space: 'SPC',
            rows: [
                {
                    localId: 'p1',
                    title: 'New Page',
                    parentLocalId: null,
                    action: 'create',
                },
            ],
        };

        mockedTransportRequest
            // createPage POST
            .mockResolvedValueOnce({ id: 'new-123' })
            // applyLabels POST
            .mockResolvedValueOnce(undefined);

        const report = await applySync(
            payload,
            plan,
            new Set(['p1'])
        );

        expect(report.created).toHaveLength(1);
        expect(report.created[0].pageId).toBe('new-123');
        expect(report.created[0].title).toBe('New Page');

        // Verify POST body
        const createCall = mockedTransportRequest.mock.calls[0][0];
        expect(createCall.method).toBe('POST');
        expect(createCall.url).toContain('/rest/api/content');
        const body = JSON.parse(createCall.body as string);
        expect(body.type).toBe('page');
        expect(body.title).toBe('New Page');
        expect(body.space.key).toBe('SPC');
        expect(body.body.storage.value).toBe('<p>body</p>');
        expect(body.body.storage.representation).toBe('storage');
        expect(body.ancestors).toBeUndefined();
    });

    it('includes ancestors when parent is resolved', async () => {
        const payload = makePayload([
            makePage({ id: 'parent', title: 'Parent', parent: null }),
            makePage({ id: 'child', title: 'Child', parent: 'parent' }),
        ]);

        const plan: SyncPlan = {
            space: 'SPC',
            rows: [
                {
                    localId: 'parent',
                    title: 'Parent',
                    parentLocalId: null,
                    action: 'create',
                },
                {
                    localId: 'child',
                    title: 'Child',
                    parentLocalId: 'parent',
                    action: 'create',
                },
            ],
        };

        mockedTransportRequest
            // parent create
            .mockResolvedValueOnce({ id: 'parent-1' })
            // parent labels
            .mockResolvedValueOnce(undefined)
            // child create
            .mockResolvedValueOnce({ id: 'child-1' })
            // child labels
            .mockResolvedValueOnce(undefined);

        const report = await applySync(
            payload,
            plan,
            new Set(['parent', 'child'])
        );

        expect(report.created).toHaveLength(2);

        // Child POST should include ancestors
        const childCreateCall = mockedTransportRequest.mock.calls[2][0];
        const childBody = JSON.parse(childCreateCall.body as string);
        expect(childBody.ancestors).toEqual([{ id: 'parent-1' }]);
    });

    it('applies labels including onyx-sync marker', async () => {
        const payload = makePayload([
            makePage({
                id: 'p1',
                title: 'Page',
                storage: '<p>x</p>',
                labels: ['custom-label'],
            }),
        ]);

        const plan: SyncPlan = {
            space: 'SPC',
            rows: [
                {
                    localId: 'p1',
                    title: 'Page',
                    parentLocalId: null,
                    action: 'create',
                },
            ],
        };

        mockedTransportRequest
            .mockResolvedValueOnce({ id: 'new-1' })
            .mockResolvedValueOnce(undefined);

        await applySync(payload, plan, new Set(['p1']));

        const labelCall = mockedTransportRequest.mock.calls[1][0];
        expect(labelCall.url).toContain('/rest/api/content/new-1/label');
        const labelBody = JSON.parse(labelCall.body as string);
        expect(labelBody).toHaveLength(2);
        const names = labelBody.map((l: { name: string }) => l.name);
        expect(names).toContain('custom-label');
        expect(names).toContain('onyx-sync');
        for (const l of labelBody) {
            expect(l.prefix).toBe('global');
        }
    });

    it('deduplicates labels including onyx-sync', async () => {
        const payload = makePayload([
            makePage({
                id: 'p1',
                title: 'Page',
                storage: '<p>x</p>',
                labels: ['onyx-sync', 'other'],
            }),
        ]);

        const plan: SyncPlan = {
            space: 'SPC',
            rows: [
                {
                    localId: 'p1',
                    title: 'Page',
                    parentLocalId: null,
                    action: 'create',
                },
            ],
        };

        mockedTransportRequest
            .mockResolvedValueOnce({ id: 'new-1' })
            .mockResolvedValueOnce(undefined);

        await applySync(payload, plan, new Set(['p1']));

        const labelCall = mockedTransportRequest.mock.calls[1][0];
        const labelBody = JSON.parse(labelCall.body as string);
        const names = labelBody.map((l: { name: string }) => l.name);
        // onyx-sync should appear only once
        expect(names.filter((n: string) => n === 'onyx-sync')).toHaveLength(1);
        expect(names).toHaveLength(2);
    });
});

// ============================================================================
// applySync — update
// ============================================================================

describe('applySync — update', () => {
    const mockedTransportRequest = vi.mocked(transportRequest);

    beforeEach(() => {
        mockedTransportRequest.mockReset();
    });

    it('PUTs to /rest/api/content/{id} with version+1', async () => {
        const payload = makePayload([
            makePage({
                id: 'p1',
                title: 'Existing',
                storage: '<p>new body</p>',
            }),
        ]);

        const plan: SyncPlan = {
            space: 'SPC',
            rows: [
                {
                    localId: 'p1',
                    title: 'Existing',
                    parentLocalId: null,
                    action: 'update',
                    existingId: 'existing-1',
                    existingVersion: 4,
                },
            ],
        };

        mockedTransportRequest
            // updatePage PUT
            .mockResolvedValueOnce(undefined)
            // applyLabels POST
            .mockResolvedValueOnce(undefined);

        const report = await applySync(payload, plan, new Set(['p1']));

        expect(report.updated).toHaveLength(1);
        expect(report.updated[0].pageId).toBe('existing-1');

        const updateCall = mockedTransportRequest.mock.calls[0][0];
        expect(updateCall.method).toBe('PUT');
        expect(updateCall.url).toContain('/rest/api/content/existing-1');
        const body = JSON.parse(updateCall.body as string);
        expect(body.id).toBe('existing-1');
        expect(body.type).toBe('page');
        expect(body.title).toBe('Existing');
        expect(body.version.number).toBe(5); // 4 + 1
        expect(body.body.storage.value).toBe('<p>new body</p>');
        expect(body.body.storage.representation).toBe('storage');
    });
});

// ============================================================================
// applySync — parent ordering and failure
// ============================================================================

describe('applySync — parent ordering and failure', () => {
    const mockedTransportRequest = vi.mocked(transportRequest);

    beforeEach(() => {
        mockedTransportRequest.mockReset();
    });

    it('processes parents before children', async () => {
        const payload = makePayload([
            makePage({ id: 'child', title: 'Child', parent: 'root' }),
            makePage({ id: 'root', title: 'Root', parent: null }),
        ]);

        const plan: SyncPlan = {
            space: 'SPC',
            rows: [
                { localId: 'child', title: 'Child', parentLocalId: 'root', action: 'create' },
                { localId: 'root', title: 'Root', parentLocalId: null, action: 'create' },
            ],
        };

        mockedTransportRequest
            // root create
            .mockResolvedValueOnce({ id: 'root-1' })
            // root labels
            .mockResolvedValueOnce(undefined)
            // child create
            .mockResolvedValueOnce({ id: 'child-1' })
            // child labels
            .mockResolvedValueOnce(undefined);

        const report = await applySync(payload, plan, new Set(['root', 'child']));

        expect(report.created).toHaveLength(2);
        // First call should be for root (parent)
        const firstCallUrl = mockedTransportRequest.mock.calls[0][0].url;
        const firstBody = JSON.parse(mockedTransportRequest.mock.calls[0][0].body as string);
        expect(firstBody.title).toBe('Root');
    });

    it('fails child when parent was not selected (create)', async () => {
        const payload = makePayload([
            makePage({ id: 'parent', title: 'Parent', parent: null }),
            makePage({ id: 'child', title: 'Child', parent: 'parent' }),
        ]);

        const plan: SyncPlan = {
            space: 'SPC',
            rows: [
                { localId: 'parent', title: 'Parent', parentLocalId: null, action: 'create' },
                { localId: 'child', title: 'Child', parentLocalId: 'parent', action: 'create' },
            ],
        };

        // Only select child, not parent
        const report = await applySync(payload, plan, new Set(['child']));

        expect(report.created).toHaveLength(0);
        expect(report.failed).toHaveLength(1);
        expect(report.failed[0].localId).toBe('child');
        expect(report.failed[0].error).toContain('Parent "parent"');
        expect(report.failed[0].error).toContain('not applied');
    });

    it('resolves parent from skip rows (existing id known)', async () => {
        const payload = makePayload([
            makePage({ id: 'parent', title: 'Parent', parent: null, storage: '<p>same</p>' }),
            makePage({ id: 'child', title: 'Child', parent: 'parent', storage: '<p>new</p>' }),
        ]);

        const plan: SyncPlan = {
            space: 'SPC',
            rows: [
                {
                    localId: 'parent',
                    title: 'Parent',
                    parentLocalId: null,
                    action: 'skip',
                    existingId: 'parent-exist',
                    existingVersion: 1,
                },
                {
                    localId: 'child',
                    title: 'Child',
                    parentLocalId: 'parent',
                    action: 'create',
                },
            ],
        };

        mockedTransportRequest
            // child create
            .mockResolvedValueOnce({ id: 'child-new' })
            // child labels
            .mockResolvedValueOnce(undefined);

        const report = await applySync(payload, plan, new Set(['child']));

        expect(report.created).toHaveLength(1);
        expect(report.created[0].pageId).toBe('child-new');

        // Verify child POST includes parent's existing id as ancestor
        const createCall = mockedTransportRequest.mock.calls[0][0];
        const body = JSON.parse(createCall.body as string);
        expect(body.ancestors).toEqual([{ id: 'parent-exist' }]);
    });

    it('resolves parent from update rows (existing id known)', async () => {
        const payload = makePayload([
            makePage({ id: 'parent', title: 'Parent', parent: null, storage: '<p>updated</p>' }),
            makePage({ id: 'child', title: 'Child', parent: 'parent', storage: '<p>new</p>' }),
        ]);

        const plan: SyncPlan = {
            space: 'SPC',
            rows: [
                {
                    localId: 'parent',
                    title: 'Parent',
                    parentLocalId: null,
                    action: 'update',
                    existingId: 'parent-exist',
                    existingVersion: 2,
                },
                {
                    localId: 'child',
                    title: 'Child',
                    parentLocalId: 'parent',
                    action: 'create',
                },
            ],
        };

        // Select only child, not parent — parent's existing id is still known
        mockedTransportRequest
            // child create
            .mockResolvedValueOnce({ id: 'child-new' })
            // child labels
            .mockResolvedValueOnce(undefined);

        const report = await applySync(payload, plan, new Set(['child']));

        expect(report.created).toHaveLength(1);
        expect(report.created[0].pageId).toBe('child-new');

        const createCall = mockedTransportRequest.mock.calls[0][0];
        const body = JSON.parse(createCall.body as string);
        expect(body.ancestors).toEqual([{ id: 'parent-exist' }]);
    });
});

// ============================================================================
// applySync — label failures and report shape
// ============================================================================

describe('applySync — label failures and report shape', () => {
    const mockedTransportRequest = vi.mocked(transportRequest);

    beforeEach(() => {
        mockedTransportRequest.mockReset();
    });

    it('records label failure as warning, not failure', async () => {
        const payload = makePayload([
            makePage({ id: 'p1', title: 'Page', storage: '<p>x</p>' }),
        ]);

        const plan: SyncPlan = {
            space: 'SPC',
            rows: [
                { localId: 'p1', title: 'Page', parentLocalId: null, action: 'create' },
            ],
        };

        mockedTransportRequest
            // create succeeds
            .mockResolvedValueOnce({ id: 'new-1' })
            // labels fail
            .mockRejectedValueOnce(new Error('label API down'));

        const report = await applySync(payload, plan, new Set(['p1']));

        expect(report.created).toHaveLength(1);
        expect(report.failed).toHaveLength(0);
        expect(report.warnings).toHaveLength(1);
        expect(report.warnings[0].warning).toContain('label');
    });

    it('records skipped rows (not selected + skip action)', async () => {
        const payload = makePayload([
            makePage({ id: 'a', title: 'A', storage: '<p>a</p>' }),
            makePage({ id: 'b', title: 'B', storage: '<p>b</p>' }),
        ]);

        const plan: SyncPlan = {
            space: 'SPC',
            rows: [
                { localId: 'a', title: 'A', parentLocalId: null, action: 'create' },
                {
                    localId: 'b',
                    title: 'B',
                    parentLocalId: null,
                    action: 'skip',
                    existingId: 'b-exist',
                    existingVersion: 1,
                },
            ],
        };

        // Select only 'a'
        mockedTransportRequest
            .mockResolvedValueOnce({ id: 'a-new' })
            .mockResolvedValueOnce(undefined);

        const report = await applySync(payload, plan, new Set(['a']));

        expect(report.created).toHaveLength(1);
        expect(report.skipped).toHaveLength(1);
        expect(report.skipped[0].localId).toBe('b');
    });

    it('records unselected create rows as skipped', async () => {
        const payload = makePayload([
            makePage({ id: 'a', title: 'A', storage: '<p>a</p>' }),
            makePage({ id: 'b', title: 'B', storage: '<p>b</p>' }),
        ]);

        const plan: SyncPlan = {
            space: 'SPC',
            rows: [
                { localId: 'a', title: 'A', parentLocalId: null, action: 'create' },
                { localId: 'b', title: 'B', parentLocalId: null, action: 'create' },
            ],
        };

        // Select only 'a'
        mockedTransportRequest
            .mockResolvedValueOnce({ id: 'a-new' })
            .mockResolvedValueOnce(undefined);

        const report = await applySync(payload, plan, new Set(['a']));

        expect(report.created).toHaveLength(1);
        expect(report.skipped).toHaveLength(1);
        expect(report.skipped[0].localId).toBe('b');
    });

    it('returns correct report shape', async () => {
        const payload = makePayload([makePage()]);
        const plan: SyncPlan = {
            space: 'SPC',
            rows: [
                { localId: 'p1', title: 'Page 1', parentLocalId: null, action: 'create' },
            ],
        };

        mockedTransportRequest
            .mockResolvedValueOnce({ id: 'new-1' })
            .mockResolvedValueOnce(undefined);

        const report = await applySync(payload, plan, new Set(['p1']));

        expect(report).toHaveProperty('space', 'SPC');
        expect(report).toHaveProperty('appliedAt');
        expect(typeof report.appliedAt).toBe('string');
        expect(report).toHaveProperty('created');
        expect(report).toHaveProperty('updated');
        expect(report).toHaveProperty('skipped');
        expect(report).toHaveProperty('failed');
        expect(report).toHaveProperty('warnings');
        expect(Array.isArray(report.created)).toBe(true);
        expect(Array.isArray(report.updated)).toBe(true);
        expect(Array.isArray(report.skipped)).toBe(true);
        expect(Array.isArray(report.failed)).toBe(true);
        expect(Array.isArray(report.warnings)).toBe(true);
    });

    it('calls onProgress during apply', async () => {
        const payload = makePayload([makePage()]);
        const plan: SyncPlan = {
            space: 'SPC',
            rows: [
                { localId: 'p1', title: 'Page 1', parentLocalId: null, action: 'create' },
            ],
        };

        mockedTransportRequest
            .mockResolvedValueOnce({ id: 'new-1' })
            .mockResolvedValueOnce(undefined);

        const calls: Array<[string, number, number]> = [];
        await applySync(payload, plan, new Set(['p1']), (phase, current, total) => {
            calls.push([phase, current, total]);
        });

        expect(calls.length).toBeGreaterThanOrEqual(2);
        expect(calls[0][0]).toContain('Applying');
    });
});

// ============================================================================
// fetchExistingPages
// ============================================================================

describe('fetchExistingPages', () => {
    const mockedFetchJson = vi.mocked(fetchJson);

    beforeEach(() => {
        mockedFetchJson.mockReset();
    });

    it('returns empty array when no results', async () => {
        mockedFetchJson.mockResolvedValueOnce({ results: [], _links: {} });

        const pages = await fetchExistingPages('https://confluence.test', 'SPC');

        expect(pages).toEqual([]);
        expect(mockedFetchJson).toHaveBeenCalledTimes(1);
    });

    it('collects pages with body and version', async () => {
        mockedFetchJson.mockResolvedValueOnce({
            results: [
                makeExistingPage('1', 'Page A', '<p>a</p>', 3),
                makeExistingPage('2', 'Page B', '<p>b</p>', 5),
            ],
            _links: {},
        });

        const pages = await fetchExistingPages('https://confluence.test', 'SPC');

        expect(pages).toHaveLength(2);
        expect(pages[0]).toEqual({
            id: '1',
            title: 'Page A',
            body: '<p>a</p>',
            version: 3,
        });
        expect(pages[1]).toEqual({
            id: '2',
            title: 'Page B',
            body: '<p>b</p>',
            version: 5,
        });
    });

    it('paginates via _links.next', async () => {
        const page1 = Array.from({ length: 200 }, (_, i) =>
            makeExistingPage(String(i), `Page ${i}`, '<p>x</p>')
        );
        const page2 = [
            makeExistingPage('200', 'Last', '<p>last</p>'),
        ];

        mockedFetchJson
            .mockResolvedValueOnce({
                results: page1,
                _links: { next: '/rest/api/content/search?start=200' },
            })
            .mockResolvedValueOnce({
                results: page2,
                _links: {},
            });

        const pages = await fetchExistingPages('https://confluence.test', 'SPC');

        expect(mockedFetchJson).toHaveBeenCalledTimes(2);
        expect(pages).toHaveLength(201);
    });

    it('uses expand=body.storage,version in URL', async () => {
        mockedFetchJson.mockResolvedValueOnce({ results: [], _links: {} });

        await fetchExistingPages('https://confluence.test', 'SPC');

        const url = mockedFetchJson.mock.calls[0][0] as string;
        expect(url).toContain('expand=body.storage,version');
        expect(url).toContain('cql=');
    });
});

// ============================================================================
// createPage / updatePage / applyLabels
// ============================================================================

describe('createPage', () => {
    const mockedTransportRequest = vi.mocked(transportRequest);

    beforeEach(() => {
        mockedTransportRequest.mockReset();
    });

    it('returns the new page id', async () => {
        mockedTransportRequest.mockResolvedValueOnce({ id: 'new-42' });

        const id = await createPage(
            'https://confluence.test',
            'SPC',
            'Title',
            '<p>body</p>',
            null
        );

        expect(id).toBe('new-42');
    });

    it('includes ancestors when parentId is provided', async () => {
        mockedTransportRequest.mockResolvedValueOnce({ id: 'new-1' });

        await createPage(
            'https://confluence.test',
            'SPC',
            'Title',
            '<p>body</p>',
            'parent-123'
        );

        const call = mockedTransportRequest.mock.calls[0][0];
        const body = JSON.parse(call.body as string);
        expect(body.ancestors).toEqual([{ id: 'parent-123' }]);
    });

    it('retries once on 429 rate-limit', async () => {
        const { ConfluenceApiError } = await import('@/api/errors');
        const rateLimitError = new ConfluenceApiError({
            category: 'rate_limited',
            status: 429,
            retryAfterMs: 0,
            technicalMessage: 'rate limited',
        });

        mockedTransportRequest
            .mockRejectedValueOnce(rateLimitError)
            .mockResolvedValueOnce({ id: 'new-after-retry' });

        const id = await createPage(
            'https://confluence.test',
            'SPC',
            'Title',
            '<p>body</p>',
            null
        );

        expect(id).toBe('new-after-retry');
        expect(mockedTransportRequest).toHaveBeenCalledTimes(2);
    });

    it('does not retry on non-rate-limit errors', async () => {
        mockedTransportRequest.mockRejectedValueOnce(new Error('500 server error'));

        await expect(
            createPage('https://confluence.test', 'SPC', 'Title', '<p>body</p>', null)
        ).rejects.toThrow('500 server error');

        expect(mockedTransportRequest).toHaveBeenCalledTimes(1);
    });
});

describe('updatePage', () => {
    const mockedTransportRequest = vi.mocked(transportRequest);

    beforeEach(() => {
        mockedTransportRequest.mockReset();
    });

    it('PUTs with version = currentVersion + 1', async () => {
        mockedTransportRequest.mockResolvedValueOnce(undefined);

        await updatePage(
            'https://confluence.test',
            'page-1',
            'SPC',
            'Title',
            '<p>body</p>',
            7
        );

        const call = mockedTransportRequest.mock.calls[0][0];
        expect(call.method).toBe('PUT');
        expect(call.url).toContain('/rest/api/content/page-1');
        const body = JSON.parse(call.body as string);
        expect(body.version.number).toBe(8);
        expect(body.id).toBe('page-1');
    });
});

describe('applyLabels', () => {
    const mockedTransportRequest = vi.mocked(transportRequest);

    beforeEach(() => {
        mockedTransportRequest.mockReset();
    });

    it('POSTs to /label with prefix=global', async () => {
        mockedTransportRequest.mockResolvedValueOnce(undefined);

        await applyLabels('https://confluence.test', 'page-1', ['a', 'b']);

        const call = mockedTransportRequest.mock.calls[0][0];
        expect(call.url).toContain('/rest/api/content/page-1/label');
        const body = JSON.parse(call.body as string);
        expect(body).toHaveLength(2);
        expect(body[0]).toEqual({ prefix: 'global', name: 'a' });
        expect(body[1]).toEqual({ prefix: 'global', name: 'b' });
    });

    it('skips the request when labels is empty', async () => {
        await applyLabels('https://confluence.test', 'page-1', []);

        expect(mockedTransportRequest).not.toHaveBeenCalled();
    });
});

// ============================================================================
// orderPagesParentsFirst / orderRowsParentsFirst
// ============================================================================

describe('orderPagesParentsFirst', () => {
    it('places root pages first', () => {
        const pages = [
            makePage({ id: 'child', parent: 'root' }),
            makePage({ id: 'root', parent: null }),
        ];

        const ordered = orderPagesParentsFirst(pages);
        expect(ordered[0].id).toBe('root');
        expect(ordered[1].id).toBe('child');
    });

    it('handles deep chains', () => {
        const pages = [
            makePage({ id: 'c', parent: 'b' }),
            makePage({ id: 'b', parent: 'a' }),
            makePage({ id: 'a', parent: null }),
        ];

        const ordered = orderPagesParentsFirst(pages);
        expect(ordered.map(p => p.id)).toEqual(['a', 'b', 'c']);
    });

    it('handles multiple roots', () => {
        const pages = [
            makePage({ id: 'b-child', parent: 'b' }),
            makePage({ id: 'a-child', parent: 'a' }),
            makePage({ id: 'a', parent: null }),
            makePage({ id: 'b', parent: null }),
        ];

        const ordered = orderPagesParentsFirst(pages);
        const idx = (id: string) => ordered.findIndex(p => p.id === id);
        expect(idx('a')).toBeLessThan(idx('a-child'));
        expect(idx('b')).toBeLessThan(idx('b-child'));
    });
});

describe('orderRowsParentsFirst', () => {
    function makeRow(
        localId: string,
        parentLocalId: string | null = null,
        action: 'create' | 'update' | 'skip' = 'create'
    ): SyncPlanRow {
        return { localId, title: localId, parentLocalId, action };
    }

    it('places parent rows before child rows', () => {
        const rows = [
            makeRow('child', 'root'),
            makeRow('root', null),
        ];

        const ordered = orderRowsParentsFirst(rows);
        expect(ordered[0].localId).toBe('root');
        expect(ordered[1].localId).toBe('child');
    });

    it('handles deep chains', () => {
        const rows = [
            makeRow('c', 'b'),
            makeRow('b', 'a'),
            makeRow('a', null),
        ];

        const ordered = orderRowsParentsFirst(rows);
        expect(ordered.map(r => r.localId)).toEqual(['a', 'b', 'c']);
    });
});
