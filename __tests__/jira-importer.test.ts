/**
 * Tests for jira-importer.ts
 *
 * Covers:
 *   - planJiraSync: create/update/skip actions with mocked existing issues
 *   - applyJiraSync: create POST body, update PUT body, labels+parent,
 *     parent ordering, report shape, 429 retry
 *   - fetchExistingIssues: pagination via startAt/total
 *   - orderIssuesParentsFirst / orderJiraRowsParentsFirst
 *
 * Mocks the transport layer the same way as sync-importer.test.ts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mocks — vitest lifts vi.mock calls before imports
vi.mock('@/utils/transport', () => ({
    fetchJson: vi.fn(),
    transportRequest: vi.fn(),
}));

vi.mock('@/api/confluence', () => ({
    getBaseUrl: () => 'https://jira.test',
}));

vi.mock('@/utils/logger', () => ({
    ctmLog: vi.fn(),
    ctmError: vi.fn(),
}));

import {
    planJiraSync,
    applyJiraSync,
    fetchExistingIssues,
    createIssue,
    updateIssue,
    orderIssuesParentsFirst,
    orderJiraRowsParentsFirst,
    type JiraPlan,
    type JiraPlanRow,
} from '@/core/jira-importer';
import { transportRequest, fetchJson } from '@/utils/transport';
import type { JiraPayload, JiraPayloadIssue } from '@/core/jira-payload';

// ============================================================================
// Helpers
// ============================================================================

function makeIssue(overrides: Partial<JiraPayloadIssue> = {}): JiraPayloadIssue {
    return {
        id: 'i1',
        summary: 'Issue 1',
        parent: null,
        ...overrides,
    };
}

function makePayload(
    issues: JiraPayloadIssue[],
    project = 'ONYX'
): JiraPayload {
    return {
        format: 'onyx-sync/jira-issues',
        version: 1,
        project,
        generatedAt: '2026-08-19T12:00:00Z',
        issues,
    };
}

function makeExistingIssue(
    key: string,
    summary: string,
    description = ''
): {
    key: string;
    fields: { summary: string; description: string; labels: string[] };
} {
    return {
        key,
        fields: { summary, description, labels: ['onyx-sync'] },
    };
}

// ============================================================================
// planJiraSync
// ============================================================================

describe('planJiraSync', () => {
    const mockedFetchJson = vi.mocked(fetchJson);

    beforeEach(() => {
        mockedFetchJson.mockReset();
    });

    it('marks all issues as create when no existing issues', async () => {
        const payload = makePayload([
            makeIssue({ id: 'a', summary: 'Issue A' }),
            makeIssue({ id: 'b', summary: 'Issue B', parent: 'a' }),
        ]);

        mockedFetchJson.mockResolvedValueOnce({
            startAt: 0,
            maxResults: 100,
            total: 0,
            issues: [],
        });

        const plan = await planJiraSync(payload);

        expect(plan.project).toBe('ONYX');
        expect(plan.rows).toHaveLength(2);
        expect(plan.rows[0].action).toBe('create');
        expect(plan.rows[1].action).toBe('create');
    });

    it('marks issue as skip when description matches (normalized)', async () => {
        const payload = makePayload([
            makeIssue({
                id: 'a',
                summary: 'Existing',
                description: 'hello world',
            }),
        ]);

        // Existing issue has same description but with extra whitespace
        mockedFetchJson.mockResolvedValueOnce({
            startAt: 0,
            maxResults: 100,
            total: 1,
            issues: [
                makeExistingIssue('ONYX-1', 'Existing', 'hello   world'),
            ],
        });

        const plan = await planJiraSync(payload);

        expect(plan.rows).toHaveLength(1);
        expect(plan.rows[0].action).toBe('skip');
        expect(plan.rows[0].existingKey).toBe('ONYX-1');
    });

    it('marks issue as update when description differs', async () => {
        const payload = makePayload([
            makeIssue({
                id: 'a',
                summary: 'Existing',
                description: 'new content',
            }),
        ]);

        mockedFetchJson.mockResolvedValueOnce({
            startAt: 0,
            maxResults: 100,
            total: 1,
            issues: [
                makeExistingIssue('ONYX-1', 'Existing', 'old content'),
            ],
        });

        const plan = await planJiraSync(payload);

        expect(plan.rows).toHaveLength(1);
        expect(plan.rows[0].action).toBe('update');
        expect(plan.rows[0].existingKey).toBe('ONYX-1');
    });

    it('marks issue as skip when both descriptions are empty/undefined', async () => {
        const payload = makePayload([
            makeIssue({ id: 'a', summary: 'No Desc', description: undefined }),
        ]);

        mockedFetchJson.mockResolvedValueOnce({
            startAt: 0,
            maxResults: 100,
            total: 1,
            issues: [makeExistingIssue('ONYX-1', 'No Desc', '')],
        });

        const plan = await planJiraSync(payload);

        expect(plan.rows[0].action).toBe('skip');
    });

    it('orders rows parents-first', async () => {
        const payload = makePayload([
            makeIssue({ id: 'child', summary: 'Child', parent: 'root' }),
            makeIssue({ id: 'root', summary: 'Root', parent: null }),
        ]);

        mockedFetchJson.mockResolvedValueOnce({
            startAt: 0,
            maxResults: 100,
            total: 0,
            issues: [],
        });

        const plan = await planJiraSync(payload);

        expect(plan.rows[0].localId).toBe('root');
        expect(plan.rows[1].localId).toBe('child');
    });

    it('paginates via startAt/total', async () => {
        const payload = makePayload([
            makeIssue({ id: 'last', summary: 'Last', description: 'match' }),
        ]);

        const page1 = Array.from({ length: 100 }, (_, i) =>
            makeExistingIssue(`ONYX-${i}`, `Issue ${i}`)
        );

        mockedFetchJson
            .mockResolvedValueOnce({
                startAt: 0,
                maxResults: 100,
                total: 101,
                issues: page1,
            })
            .mockResolvedValueOnce({
                startAt: 100,
                maxResults: 100,
                total: 101,
                issues: [makeExistingIssue('ONYX-100', 'Last', 'match')],
            });

        const plan = await planJiraSync(payload);

        expect(mockedFetchJson).toHaveBeenCalledTimes(2);
        expect(plan.rows[0].action).toBe('skip');
        expect(plan.rows[0].existingKey).toBe('ONYX-100');
    });

    it('uses JQL with labels = onyx-sync filter', async () => {
        const payload = makePayload([makeIssue()]);
        mockedFetchJson.mockResolvedValueOnce({
            startAt: 0,
            maxResults: 100,
            total: 0,
            issues: [],
        });

        await planJiraSync(payload);

        const url = mockedFetchJson.mock.calls[0][0] as string;
        expect(url).toContain('jql=');
        expect(url).toContain('labels');
        expect(url).toContain('onyx-sync');
    });

    it('calls onProgress', async () => {
        const payload = makePayload([makeIssue()]);
        mockedFetchJson.mockResolvedValueOnce({
            startAt: 0,
            maxResults: 100,
            total: 0,
            issues: [],
        });

        const calls: Array<[string, number, number]> = [];
        await planJiraSync(payload, (phase, current, total) => {
            calls.push([phase, current, total]);
        });

        expect(calls.length).toBeGreaterThanOrEqual(2);
        expect(calls[0][0]).toContain('Fetching');
    });
});

// ============================================================================
// applyJiraSync — create
// ============================================================================

describe('applyJiraSync — create', () => {
    const mockedTransportRequest = vi.mocked(transportRequest);

    beforeEach(() => {
        mockedTransportRequest.mockReset();
    });

    it('POSTs to /rest/api/2/issue with correct fields', async () => {
        const payload = makePayload([
            makeIssue({
                id: 'i1',
                summary: 'New Issue',
                description: 'desc',
                labels: ['custom'],
            }),
        ]);

        const plan: JiraPlan = {
            project: 'ONYX',
            rows: [
                {
                    localId: 'i1',
                    title: 'New Issue',
                    parentLocalId: null,
                    action: 'create',
                },
            ],
        };

        mockedTransportRequest.mockResolvedValueOnce({ key: 'ONYX-42' });

        const report = await applyJiraSync(payload, plan, new Set(['i1']));

        expect(report.created).toHaveLength(1);
        expect(report.created[0].pageId).toBe('ONYX-42');
        expect(report.created[0].title).toBe('New Issue');

        const call = mockedTransportRequest.mock.calls[0][0];
        expect(call.method).toBe('POST');
        expect(call.url).toContain('/rest/api/2/issue');
        expect(call.headers).toHaveProperty('X-Atlassian-Token', 'no-check');
        const body = JSON.parse(call.body as string);
        expect(body.fields.project.key).toBe('ONYX');
        expect(body.fields.summary).toBe('New Issue');
        expect(body.fields.issuetype.name).toBe('Задача');
        expect(body.fields.description).toBe('desc');
        expect(body.fields.labels).toContain('custom');
        expect(body.fields.labels).toContain('onyx-sync');
        expect(body.fields.parent).toBeUndefined();
    });

    it('uses default issue type when not specified', async () => {
        const payload = makePayload([
            makeIssue({ id: 'i1', summary: 'Issue' }),
        ]);

        const plan: JiraPlan = {
            project: 'ONYX',
            rows: [
                { localId: 'i1', title: 'Issue', parentLocalId: null, action: 'create' },
            ],
        };

        mockedTransportRequest.mockResolvedValueOnce({ key: 'ONYX-1' });

        await applyJiraSync(payload, plan, new Set(['i1']));

        const body = JSON.parse(mockedTransportRequest.mock.calls[0][0].body as string);
        expect(body.fields.issuetype.name).toBe('Задача');
    });

    it('uses specified issue type when provided', async () => {
        const payload = makePayload([
            makeIssue({ id: 'i1', summary: 'Bug', issueType: 'Ошибка' }),
        ]);

        const plan: JiraPlan = {
            project: 'ONYX',
            rows: [
                { localId: 'i1', title: 'Bug', parentLocalId: null, action: 'create' },
            ],
        };

        mockedTransportRequest.mockResolvedValueOnce({ key: 'ONYX-1' });

        await applyJiraSync(payload, plan, new Set(['i1']));

        const body = JSON.parse(mockedTransportRequest.mock.calls[0][0].body as string);
        expect(body.fields.issuetype.name).toBe('Ошибка');
    });

    it('forces subtask type and sets parent when parent is resolved', async () => {
        const payload = makePayload([
            makeIssue({ id: 'parent', summary: 'Parent', parent: null }),
            makeIssue({
                id: 'child',
                summary: 'Child',
                parent: 'parent',
                issueType: 'Задача',
            }),
        ]);

        const plan: JiraPlan = {
            project: 'ONYX',
            rows: [
                { localId: 'parent', title: 'Parent', parentLocalId: null, action: 'create' },
                { localId: 'child', title: 'Child', parentLocalId: 'parent', action: 'create' },
            ],
        };

        mockedTransportRequest
            .mockResolvedValueOnce({ key: 'ONYX-1' }) // parent create
            .mockResolvedValueOnce({ key: 'ONYX-2' }); // child create

        const report = await applyJiraSync(
            payload,
            plan,
            new Set(['parent', 'child'])
        );

        expect(report.created).toHaveLength(2);

        // Child POST should have parent + subtask type
        const childCall = mockedTransportRequest.mock.calls[1][0];
        const childBody = JSON.parse(childCall.body as string);
        expect(childBody.fields.parent).toEqual({ key: 'ONYX-1' });
        expect(childBody.fields.issuetype.name).toBe('Подзадача');
    });

    it('deduplicates labels including onyx-sync', async () => {
        const payload = makePayload([
            makeIssue({
                id: 'i1',
                summary: 'Issue',
                labels: ['onyx-sync', 'other'],
            }),
        ]);

        const plan: JiraPlan = {
            project: 'ONYX',
            rows: [
                { localId: 'i1', title: 'Issue', parentLocalId: null, action: 'create' },
            ],
        };

        mockedTransportRequest.mockResolvedValueOnce({ key: 'ONYX-1' });

        await applyJiraSync(payload, plan, new Set(['i1']));

        const body = JSON.parse(mockedTransportRequest.mock.calls[0][0].body as string);
        const labels = body.fields.labels;
        expect(labels.filter((l: string) => l === 'onyx-sync')).toHaveLength(1);
        expect(labels).toContain('other');
    });
});

// ============================================================================
// applyJiraSync — update
// ============================================================================

describe('applyJiraSync — update', () => {
    const mockedTransportRequest = vi.mocked(transportRequest);

    beforeEach(() => {
        mockedTransportRequest.mockReset();
    });

    it('PUTs to /rest/api/2/issue/{key} with summary, description, labels', async () => {
        const payload = makePayload([
            makeIssue({
                id: 'i1',
                summary: 'Updated',
                description: 'new desc',
                labels: ['new-label'],
            }),
        ]);

        const plan: JiraPlan = {
            project: 'ONYX',
            rows: [
                {
                    localId: 'i1',
                    title: 'Updated',
                    parentLocalId: null,
                    action: 'update',
                    existingKey: 'ONYX-10',
                },
            ],
        };

        mockedTransportRequest.mockResolvedValueOnce(undefined);

        const report = await applyJiraSync(payload, plan, new Set(['i1']));

        expect(report.updated).toHaveLength(1);
        expect(report.updated[0].pageId).toBe('ONYX-10');

        const call = mockedTransportRequest.mock.calls[0][0];
        expect(call.method).toBe('PUT');
        expect(call.url).toContain('/rest/api/2/issue/ONYX-10');
        expect(call.headers).toHaveProperty('X-Atlassian-Token', 'no-check');
        const body = JSON.parse(call.body as string);
        expect(body.fields.summary).toBe('Updated');
        expect(body.fields.description).toBe('new desc');
        expect(body.fields.labels).toContain('new-label');
        expect(body.fields.labels).toContain('onyx-sync');
        // Update should NOT include project or issuetype
        expect(body.fields.project).toBeUndefined();
        expect(body.fields.issuetype).toBeUndefined();
    });
});

// ============================================================================
// applyJiraSync — parent ordering and failure
// ============================================================================

describe('applyJiraSync — parent ordering and failure', () => {
    const mockedTransportRequest = vi.mocked(transportRequest);

    beforeEach(() => {
        mockedTransportRequest.mockReset();
    });

    it('processes parents before children', async () => {
        const payload = makePayload([
            makeIssue({ id: 'child', summary: 'Child', parent: 'root' }),
            makeIssue({ id: 'root', summary: 'Root', parent: null }),
        ]);

        const plan: JiraPlan = {
            project: 'ONYX',
            rows: [
                { localId: 'child', title: 'Child', parentLocalId: 'root', action: 'create' },
                { localId: 'root', title: 'Root', parentLocalId: null, action: 'create' },
            ],
        };

        mockedTransportRequest
            .mockResolvedValueOnce({ key: 'ONYX-1' }) // root
            .mockResolvedValueOnce({ key: 'ONYX-2' }); // child

        const report = await applyJiraSync(payload, plan, new Set(['root', 'child']));

        expect(report.created).toHaveLength(2);
        // First call should be for root (parent)
        const firstBody = JSON.parse(mockedTransportRequest.mock.calls[0][0].body as string);
        expect(firstBody.fields.summary).toBe('Root');
    });

    it('fails child when parent was not selected (create)', async () => {
        const payload = makePayload([
            makeIssue({ id: 'parent', summary: 'Parent', parent: null }),
            makeIssue({ id: 'child', summary: 'Child', parent: 'parent' }),
        ]);

        const plan: JiraPlan = {
            project: 'ONYX',
            rows: [
                { localId: 'parent', title: 'Parent', parentLocalId: null, action: 'create' },
                { localId: 'child', title: 'Child', parentLocalId: 'parent', action: 'create' },
            ],
        };

        // Only select child, not parent
        const report = await applyJiraSync(payload, plan, new Set(['child']));

        expect(report.created).toHaveLength(0);
        expect(report.failed).toHaveLength(1);
        expect(report.failed[0].localId).toBe('child');
        expect(report.failed[0].error).toContain('Parent "parent"');
        expect(report.failed[0].error).toContain('not applied');
    });

    it('resolves parent from skip rows (existing key known)', async () => {
        const payload = makePayload([
            makeIssue({ id: 'parent', summary: 'Parent', parent: null, description: 'same' }),
            makeIssue({ id: 'child', summary: 'Child', parent: 'parent' }),
        ]);

        const plan: JiraPlan = {
            project: 'ONYX',
            rows: [
                {
                    localId: 'parent',
                    title: 'Parent',
                    parentLocalId: null,
                    action: 'skip',
                    existingKey: 'ONYX-100',
                },
                {
                    localId: 'child',
                    title: 'Child',
                    parentLocalId: 'parent',
                    action: 'create',
                },
            ],
        };

        // Select only child — parent is skip (existing key known)
        mockedTransportRequest.mockResolvedValueOnce({ key: 'ONYX-101' });

        const report = await applyJiraSync(payload, plan, new Set(['child']));

        expect(report.created).toHaveLength(1);
        expect(report.created[0].pageId).toBe('ONYX-101');

        // Child POST should include parent key
        const body = JSON.parse(mockedTransportRequest.mock.calls[0][0].body as string);
        expect(body.fields.parent).toEqual({ key: 'ONYX-100' });
        expect(body.fields.issuetype.name).toBe('Подзадача');
    });

    it('resolves parent from update rows (existing key known)', async () => {
        const payload = makePayload([
            makeIssue({ id: 'parent', summary: 'Parent', parent: null, description: 'updated' }),
            makeIssue({ id: 'child', summary: 'Child', parent: 'parent' }),
        ]);

        const plan: JiraPlan = {
            project: 'ONYX',
            rows: [
                {
                    localId: 'parent',
                    title: 'Parent',
                    parentLocalId: null,
                    action: 'update',
                    existingKey: 'ONYX-200',
                },
                {
                    localId: 'child',
                    title: 'Child',
                    parentLocalId: 'parent',
                    action: 'create',
                },
            ],
        };

        // Select only child, not parent — parent's existing key is still known
        mockedTransportRequest.mockResolvedValueOnce({ key: 'ONYX-201' });

        const report = await applyJiraSync(payload, plan, new Set(['child']));

        expect(report.created).toHaveLength(1);
        const body = JSON.parse(mockedTransportRequest.mock.calls[0][0].body as string);
        expect(body.fields.parent).toEqual({ key: 'ONYX-200' });
    });
});

// ============================================================================
// applyJiraSync — report shape and skipped
// ============================================================================

describe('applyJiraSync — report shape and skipped', () => {
    const mockedTransportRequest = vi.mocked(transportRequest);

    beforeEach(() => {
        mockedTransportRequest.mockReset();
    });

    it('records skipped rows (not selected + skip action)', async () => {
        const payload = makePayload([
            makeIssue({ id: 'a', summary: 'A' }),
            makeIssue({ id: 'b', summary: 'B' }),
        ]);

        const plan: JiraPlan = {
            project: 'ONYX',
            rows: [
                { localId: 'a', title: 'A', parentLocalId: null, action: 'create' },
                {
                    localId: 'b',
                    title: 'B',
                    parentLocalId: null,
                    action: 'skip',
                    existingKey: 'ONYX-1',
                },
            ],
        };

        // Select only 'a'
        mockedTransportRequest.mockResolvedValueOnce({ key: 'ONYX-2' });

        const report = await applyJiraSync(payload, plan, new Set(['a']));

        expect(report.created).toHaveLength(1);
        expect(report.skipped).toHaveLength(1);
        expect(report.skipped[0].localId).toBe('b');
    });

    it('records unselected create rows as skipped', async () => {
        const payload = makePayload([
            makeIssue({ id: 'a', summary: 'A' }),
            makeIssue({ id: 'b', summary: 'B' }),
        ]);

        const plan: JiraPlan = {
            project: 'ONYX',
            rows: [
                { localId: 'a', title: 'A', parentLocalId: null, action: 'create' },
                { localId: 'b', title: 'B', parentLocalId: null, action: 'create' },
            ],
        };

        // Select only 'a'
        mockedTransportRequest.mockResolvedValueOnce({ key: 'ONYX-1' });

        const report = await applyJiraSync(payload, plan, new Set(['a']));

        expect(report.created).toHaveLength(1);
        expect(report.skipped).toHaveLength(1);
        expect(report.skipped[0].localId).toBe('b');
    });

    it('returns correct report shape', async () => {
        const payload = makePayload([makeIssue()]);
        const plan: JiraPlan = {
            project: 'ONYX',
            rows: [
                { localId: 'i1', title: 'Issue 1', parentLocalId: null, action: 'create' },
            ],
        };

        mockedTransportRequest.mockResolvedValueOnce({ key: 'ONYX-1' });

        const report = await applyJiraSync(payload, plan, new Set(['i1']));

        expect(report).toHaveProperty('project', 'ONYX');
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
        const payload = makePayload([makeIssue()]);
        const plan: JiraPlan = {
            project: 'ONYX',
            rows: [
                { localId: 'i1', title: 'Issue 1', parentLocalId: null, action: 'create' },
            ],
        };

        mockedTransportRequest.mockResolvedValueOnce({ key: 'ONYX-1' });

        const calls: Array<[string, number, number]> = [];
        await applyJiraSync(payload, plan, new Set(['i1']), (phase, current, total) => {
            calls.push([phase, current, total]);
        });

        expect(calls.length).toBeGreaterThanOrEqual(2);
        expect(calls[0][0]).toContain('Applying');
    });
});

// ============================================================================
// fetchExistingIssues
// ============================================================================

describe('fetchExistingIssues', () => {
    const mockedFetchJson = vi.mocked(fetchJson);

    beforeEach(() => {
        mockedFetchJson.mockReset();
    });

    it('returns empty array when no issues', async () => {
        mockedFetchJson.mockResolvedValueOnce({
            startAt: 0,
            maxResults: 100,
            total: 0,
            issues: [],
        });

        const issues = await fetchExistingIssues('https://jira.test', 'ONYX');

        expect(issues).toEqual([]);
        expect(mockedFetchJson).toHaveBeenCalledTimes(1);
    });

    it('collects issues with key, summary, description', async () => {
        mockedFetchJson.mockResolvedValueOnce({
            startAt: 0,
            maxResults: 100,
            total: 2,
            issues: [
                makeExistingIssue('ONYX-1', 'Issue A', 'desc A'),
                makeExistingIssue('ONYX-2', 'Issue B', 'desc B'),
            ],
        });

        const issues = await fetchExistingIssues('https://jira.test', 'ONYX');

        expect(issues).toHaveLength(2);
        expect(issues[0]).toEqual({
            key: 'ONYX-1',
            summary: 'Issue A',
            description: 'desc A',
        });
        expect(issues[1]).toEqual({
            key: 'ONYX-2',
            summary: 'Issue B',
            description: 'desc B',
        });
    });

    it('paginates via startAt/total', async () => {
        const page1 = Array.from({ length: 100 }, (_, i) =>
            makeExistingIssue(`ONYX-${i}`, `Issue ${i}`)
        );

        mockedFetchJson
            .mockResolvedValueOnce({
                startAt: 0,
                maxResults: 100,
                total: 101,
                issues: page1,
            })
            .mockResolvedValueOnce({
                startAt: 100,
                maxResults: 100,
                total: 101,
                issues: [makeExistingIssue('ONYX-100', 'Last')],
            });

        const issues = await fetchExistingIssues('https://jira.test', 'ONYX');

        expect(mockedFetchJson).toHaveBeenCalledTimes(2);
        expect(issues).toHaveLength(101);
    });

    it('uses fields=key,summary,description,labels', async () => {
        mockedFetchJson.mockResolvedValueOnce({
            startAt: 0,
            maxResults: 100,
            total: 0,
            issues: [],
        });

        await fetchExistingIssues('https://jira.test', 'ONYX');

        const url = mockedFetchJson.mock.calls[0][0] as string;
        expect(url).toContain('fields=key,summary,description,labels');
    });

    it('breaks on empty page to avoid infinite loop', async () => {
        mockedFetchJson.mockResolvedValueOnce({
            startAt: 0,
            maxResults: 100,
            total: 100, // total > 0 but no issues returned
            issues: [],
        });

        const issues = await fetchExistingIssues('https://jira.test', 'ONYX');

        expect(issues).toEqual([]);
        expect(mockedFetchJson).toHaveBeenCalledTimes(1);
    });
});

// ============================================================================
// createIssue / updateIssue
// ============================================================================

describe('createIssue', () => {
    const mockedTransportRequest = vi.mocked(transportRequest);

    beforeEach(() => {
        mockedTransportRequest.mockReset();
    });

    it('returns the new issue key', async () => {
        mockedTransportRequest.mockResolvedValueOnce({ key: 'ONYX-42' });

        const key = await createIssue(
            'https://jira.test',
            'ONYX',
            makeIssue({ summary: 'Test' }),
            null
        );

        expect(key).toBe('ONYX-42');
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
            .mockResolvedValueOnce({ key: 'ONYX-1' });

        const key = await createIssue(
            'https://jira.test',
            'ONYX',
            makeIssue({ summary: 'Test' }),
            null
        );

        expect(key).toBe('ONYX-1');
        expect(mockedTransportRequest).toHaveBeenCalledTimes(2);
    });

    it('does not retry on non-rate-limit errors', async () => {
        mockedTransportRequest.mockRejectedValueOnce(new Error('500 server error'));

        await expect(
            createIssue('https://jira.test', 'ONYX', makeIssue({ summary: 'Test' }), null)
        ).rejects.toThrow('500 server error');

        expect(mockedTransportRequest).toHaveBeenCalledTimes(1);
    });

    it('includes X-Atlassian-Token header', async () => {
        mockedTransportRequest.mockResolvedValueOnce({ key: 'ONYX-1' });

        await createIssue('https://jira.test', 'ONYX', makeIssue(), null);

        const call = mockedTransportRequest.mock.calls[0][0];
        expect(call.headers).toHaveProperty('X-Atlassian-Token', 'no-check');
        expect(call.headers).toHaveProperty('Content-Type', 'application/json');
    });
});

describe('updateIssue', () => {
    const mockedTransportRequest = vi.mocked(transportRequest);

    beforeEach(() => {
        mockedTransportRequest.mockReset();
    });

    it('PUTs with summary, description, labels only', async () => {
        mockedTransportRequest.mockResolvedValueOnce(undefined);

        await updateIssue('https://jira.test', 'ONYX-1', makeIssue({
            summary: 'Updated',
            description: 'new',
            labels: ['l1'],
        }));

        const call = mockedTransportRequest.mock.calls[0][0];
        expect(call.method).toBe('PUT');
        expect(call.url).toContain('/rest/api/2/issue/ONYX-1');
        const body = JSON.parse(call.body as string);
        expect(body.fields.summary).toBe('Updated');
        expect(body.fields.description).toBe('new');
        expect(body.fields.labels).toContain('l1');
        expect(body.fields.labels).toContain('onyx-sync');
        expect(body.fields.project).toBeUndefined();
        expect(body.fields.issuetype).toBeUndefined();
    });

    it('includes X-Atlassian-Token header', async () => {
        mockedTransportRequest.mockResolvedValueOnce(undefined);

        await updateIssue('https://jira.test', 'ONYX-1', makeIssue());

        const call = mockedTransportRequest.mock.calls[0][0];
        expect(call.headers).toHaveProperty('X-Atlassian-Token', 'no-check');
    });
});

// ============================================================================
// orderIssuesParentsFirst / orderJiraRowsParentsFirst
// ============================================================================

describe('orderIssuesParentsFirst', () => {
    it('places root issues first', () => {
        const issues = [
            makeIssue({ id: 'child', parent: 'root' }),
            makeIssue({ id: 'root', parent: null }),
        ];

        const ordered = orderIssuesParentsFirst(issues);
        expect(ordered[0].id).toBe('root');
        expect(ordered[1].id).toBe('child');
    });

    it('handles deep chains', () => {
        const issues = [
            makeIssue({ id: 'c', parent: 'b' }),
            makeIssue({ id: 'b', parent: 'a' }),
            makeIssue({ id: 'a', parent: null }),
        ];

        const ordered = orderIssuesParentsFirst(issues);
        expect(ordered.map(i => i.id)).toEqual(['a', 'b', 'c']);
    });
});

describe('orderJiraRowsParentsFirst', () => {
    function makeRow(
        localId: string,
        parentLocalId: string | null = null,
        action: 'create' | 'update' | 'skip' = 'create'
    ): JiraPlanRow {
        return { localId, title: localId, parentLocalId, action };
    }

    it('places parent rows before child rows', () => {
        const rows = [
            makeRow('child', 'root'),
            makeRow('root', null),
        ];

        const ordered = orderJiraRowsParentsFirst(rows);
        expect(ordered[0].localId).toBe('root');
        expect(ordered[1].localId).toBe('child');
    });

    it('handles deep chains', () => {
        const rows = [
            makeRow('c', 'b'),
            makeRow('b', 'a'),
            makeRow('a', null),
        ];

        const ordered = orderJiraRowsParentsFirst(rows);
        expect(ordered.map(r => r.localId)).toEqual(['a', 'b', 'c']);
    });
});
