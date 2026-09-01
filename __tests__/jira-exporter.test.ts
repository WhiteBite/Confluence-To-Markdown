/**
 * Tests for jira-exporter.ts
 *
 * Covers:
 *   - exportJiraIssues: pagination via startAt/total, output shape
 *   - JQL query construction
 *   - onProgress callback
 *
 * Mocks the transport layer the same way as sync-importer.test.ts.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoist mocks — vitest lifts vi.mock calls before imports
vi.mock('@/utils/transport', () => ({
    fetchJson: vi.fn(),
}));

vi.mock('@/api/confluence', () => ({
    getBaseUrl: () => 'https://jira.test',
}));

vi.mock('@/utils/logger', () => ({
    ctmLog: vi.fn(),
    ctmError: vi.fn(),
}));

import { exportJiraIssues } from '@/core/jira-exporter';
import { fetchJson } from '@/utils/transport';

// ============================================================================
// Helpers
// ============================================================================

function makeIssue(
    key: string,
    summary: string,
    overrides: { status?: string; issuetype?: string; labels?: string[] } = {}
): {
    key: string;
    fields: {
        summary: string;
        status: { name: string };
        issuetype: { name: string };
        labels: string[];
    };
} {
    return {
        key,
        fields: {
            summary,
            status: { name: overrides.status ?? 'Open' },
            issuetype: { name: overrides.issuetype ?? 'Задача' },
            labels: overrides.labels ?? [],
        },
    };
}

// ============================================================================
// exportJiraIssues
// ============================================================================

describe('exportJiraIssues', () => {
    const mockedFetchJson = vi.mocked(fetchJson);

    beforeEach(() => {
        mockedFetchJson.mockReset();
    });

    it('returns empty issues array when project has no issues', async () => {
        mockedFetchJson.mockResolvedValueOnce({
            startAt: 0,
            maxResults: 100,
            total: 0,
            issues: [],
        });

        const result = await exportJiraIssues('ONYX');

        expect(result.format).toBe('onyx-sync/jira-export');
        expect(result.version).toBe(1);
        expect(result.project).toBe('ONYX');
        expect(result.issues).toEqual([]);
        expect(result.exportedAt).toBeTruthy();
    });

    it('collects issues with key, summary, status, issueType, labels', async () => {
        mockedFetchJson.mockResolvedValueOnce({
            startAt: 0,
            maxResults: 100,
            total: 2,
            issues: [
                makeIssue('ONYX-1', 'Issue A', {
                    status: 'In Progress',
                    issuetype: 'Ошибка',
                    labels: ['bug', 'onyx-sync'],
                }),
                makeIssue('ONYX-2', 'Issue B', {
                    status: 'Done',
                    issuetype: 'Задача',
                    labels: [],
                }),
            ],
        });

        const result = await exportJiraIssues('ONYX');

        expect(result.issues).toHaveLength(2);
        expect(result.issues[0]).toEqual({
            key: 'ONYX-1',
            summary: 'Issue A',
            status: 'In Progress',
            issueType: 'Ошибка',
            labels: ['bug', 'onyx-sync'],
        });
        expect(result.issues[1]).toEqual({
            key: 'ONYX-2',
            summary: 'Issue B',
            status: 'Done',
            issueType: 'Задача',
            labels: [],
        });
    });

    it('paginates via startAt/total', async () => {
        const page1 = Array.from({ length: 100 }, (_, i) =>
            makeIssue(`ONYX-${i + 1}`, `Issue ${i + 1}`)
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
                issues: [makeIssue('ONYX-101', 'Last')],
            });

        const result = await exportJiraIssues('ONYX');

        expect(mockedFetchJson).toHaveBeenCalledTimes(2);
        expect(result.issues).toHaveLength(101);
        expect(result.issues[100].key).toBe('ONYX-101');
    });

    it('uses JQL with project filter and ORDER BY key ASC', async () => {
        mockedFetchJson.mockResolvedValueOnce({
            startAt: 0,
            maxResults: 100,
            total: 0,
            issues: [],
        });

        await exportJiraIssues('ONYX');

        const url = mockedFetchJson.mock.calls[0][0] as string;
        expect(url).toContain('jql=');
        // URL-encoded `project = "ONYX" ORDER BY key ASC`
        expect(url).toContain('project');
        expect(url).toContain('ORDER%20BY%20key%20ASC');
    });

    it('uses fields=key,summary,status,issuetype,labels', async () => {
        mockedFetchJson.mockResolvedValueOnce({
            startAt: 0,
            maxResults: 100,
            total: 0,
            issues: [],
        });

        await exportJiraIssues('ONYX');

        const url = mockedFetchJson.mock.calls[0][0] as string;
        expect(url).toContain('fields=key,summary,status,issuetype,labels');
    });

    it('uses maxResults=100', async () => {
        mockedFetchJson.mockResolvedValueOnce({
            startAt: 0,
            maxResults: 100,
            total: 0,
            issues: [],
        });

        await exportJiraIssues('ONYX');

        const url = mockedFetchJson.mock.calls[0][0] as string;
        expect(url).toContain('maxResults=100');
    });

    it('breaks on empty page to avoid infinite loop', async () => {
        mockedFetchJson.mockResolvedValueOnce({
            startAt: 0,
            maxResults: 100,
            total: 100, // total > 0 but no issues returned
            issues: [],
        });

        const result = await exportJiraIssues('ONYX');

        expect(result.issues).toEqual([]);
        expect(mockedFetchJson).toHaveBeenCalledTimes(1);
    });

    it('calls onProgress during export', async () => {
        mockedFetchJson.mockResolvedValueOnce({
            startAt: 0,
            maxResults: 100,
            total: 2,
            issues: [
                makeIssue('ONYX-1', 'A'),
                makeIssue('ONYX-2', 'B'),
            ],
        });

        const calls: Array<[string, number, number]> = [];
        await exportJiraIssues('ONYX', (phase, current, total) => {
            calls.push([phase, current, total]);
        });

        expect(calls.length).toBeGreaterThanOrEqual(2);
        expect(calls[0][0]).toContain('Exporting');
    });

    it('returns correct export shape', async () => {
        mockedFetchJson.mockResolvedValueOnce({
            startAt: 0,
            maxResults: 100,
            total: 1,
            issues: [makeIssue('ONYX-1', 'Test')],
        });

        const result = await exportJiraIssues('ONYX');

        expect(result).toHaveProperty('format', 'onyx-sync/jira-export');
        expect(result).toHaveProperty('version', 1);
        expect(result).toHaveProperty('project', 'ONYX');
        expect(result).toHaveProperty('exportedAt');
        expect(result).toHaveProperty('issues');
        expect(Array.isArray(result.issues)).toBe(true);
    });

    it('handles missing status/issuetype gracefully', async () => {
        mockedFetchJson.mockResolvedValueOnce({
            startAt: 0,
            maxResults: 100,
            total: 1,
            issues: [
                {
                    key: 'ONYX-1',
                    fields: {
                        summary: 'No Status',
                        // status and issuetype missing
                        labels: ['x'],
                    },
                },
            ],
        });

        const result = await exportJiraIssues('ONYX');

        expect(result.issues[0].status).toBe('');
        expect(result.issues[0].issueType).toBe('');
        expect(result.issues[0].labels).toEqual(['x']);
    });

    it('throws on fetch error', async () => {
        mockedFetchJson.mockRejectedValueOnce(new Error('network fail'));

        await expect(exportJiraIssues('ONYX')).rejects.toThrow('network fail');
    });
});
