/**
 * Tests for jira-payload.ts
 *
 * Covers:
 *   - parseJiraPayload: valid payload, each validation error case, multiple errors
 *   - detectJiraCycle: direct and indirect cycles
 *   - simpleNormal: whitespace collapsing and trimming
 */

import { describe, it, expect } from 'vitest';
import {
    parseJiraPayload,
    detectJiraCycle,
    simpleNormal,
    SYNC_MARKER_LABEL,
    JIRA_PAYLOAD_FORMAT,
    JIRA_PAYLOAD_VERSION,
    JIRA_DEFAULT_ISSUE_TYPE,
    JIRA_SUBTASK_ISSUE_TYPE,
    type JiraPayloadIssue,
} from '@/core/jira-payload';

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
    overrides: Record<string, unknown> = {}
): Record<string, unknown> {
    return {
        format: 'onyx-sync/jira-issues',
        version: 1,
        project: 'ONYX',
        generatedAt: '2026-08-19T12:00:00Z',
        issues,
        ...overrides,
    };
}

// ============================================================================
// parseJiraPayload — valid
// ============================================================================

describe('parseJiraPayload — valid payload', () => {
    it('parses a minimal valid payload', () => {
        const raw = makePayload([makeIssue()]);
        const result = parseJiraPayload(raw);

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.payload.format).toBe('onyx-sync/jira-issues');
            expect(result.payload.version).toBe(1);
            expect(result.payload.project).toBe('ONYX');
            expect(result.payload.generatedAt).toBe('2026-08-19T12:00:00Z');
            expect(result.payload.issues).toHaveLength(1);
            expect(result.payload.issues[0].id).toBe('i1');
        }
    });

    it('parses a payload with parent references and labels', () => {
        const raw = makePayload([
            makeIssue({ id: 'parent', summary: 'Parent', parent: null, labels: ['arch'] }),
            makeIssue({ id: 'child', summary: 'Child', parent: 'parent', issueType: 'Подзадача' }),
        ]);
        const result = parseJiraPayload(raw);

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.payload.issues).toHaveLength(2);
            expect(result.payload.issues[0].labels).toEqual(['arch']);
            expect(result.payload.issues[1].parent).toBe('parent');
            expect(result.payload.issues[1].issueType).toBe('Подзадача');
        }
    });

    it('parses a payload with no issues', () => {
        const raw = makePayload([]);
        const result = parseJiraPayload(raw);

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.payload.issues).toHaveLength(0);
        }
    });

    it('defaults generatedAt when missing', () => {
        const raw = makePayload([makeIssue()]);
        delete (raw as Record<string, unknown>).generatedAt;
        const result = parseJiraPayload(raw);

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.payload.generatedAt).toBeTruthy();
        }
    });

    it('accepts optional description and issueType', () => {
        const raw = makePayload([
            makeIssue({
                id: 'i1',
                summary: 'Issue',
                description: 'Some wiki markup',
                issueType: 'Ошибка',
            }),
        ]);
        const result = parseJiraPayload(raw);

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.payload.issues[0].description).toBe('Some wiki markup');
            expect(result.payload.issues[0].issueType).toBe('Ошибка');
        }
    });
});

// ============================================================================
// parseJiraPayload — format/version errors
// ============================================================================

describe('parseJiraPayload — format/version errors', () => {
    it('rejects wrong format', () => {
        const raw = makePayload([makeIssue()], { format: 'wrong-format' });
        const result = parseJiraPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                expect.arrayContaining([expect.stringContaining('Invalid "format"')])
            );
        }
    });

    it('rejects wrong version', () => {
        const raw = makePayload([makeIssue()], { version: 2 });
        const result = parseJiraPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                expect.arrayContaining([expect.stringContaining('Invalid "version"')])
            );
        }
    });
});

// ============================================================================
// parseJiraPayload — project errors
// ============================================================================

describe('parseJiraPayload — project errors', () => {
    it('rejects missing project', () => {
        const raw = makePayload([makeIssue()]);
        delete (raw as Record<string, unknown>).project;
        const result = parseJiraPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                expect.arrayContaining([expect.stringContaining('"project"')])
            );
        }
    });

    it('rejects empty project', () => {
        const raw = makePayload([makeIssue()], { project: '   ' });
        const result = parseJiraPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                expect.arrayContaining([expect.stringContaining('"project"')])
            );
        }
    });
});

// ============================================================================
// parseJiraPayload — per-issue errors
// ============================================================================

describe('parseJiraPayload — per-issue errors', () => {
    it('rejects duplicate ids', () => {
        const raw = makePayload([
            makeIssue({ id: 'dup', summary: 'A' }),
            makeIssue({ id: 'dup', summary: 'B' }),
        ]);
        const result = parseJiraPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                expect.arrayContaining([expect.stringContaining('duplicate id "dup"')])
            );
        }
    });

    it('rejects empty summary', () => {
        const raw = makePayload([makeIssue({ id: 'i1', summary: '   ' })]);
        const result = parseJiraPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                expect.arrayContaining([expect.stringContaining('empty "summary"')])
            );
        }
    });

    it('rejects parent reference to unknown id', () => {
        const raw = makePayload([
            makeIssue({ id: 'i1', parent: 'nonexistent' }),
        ]);
        const result = parseJiraPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('parent "nonexistent" does not exist'),
                ])
            );
        }
    });

    it('rejects empty string parent (should be null)', () => {
        const raw = makePayload([
            makeIssue({ id: 'i1', parent: '' as unknown as string | null }),
        ]);
        const result = parseJiraPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('"parent" must not be an empty string'),
                ])
            );
        }
    });

    it('rejects non-string issueType', () => {
        const raw = makePayload([
            makeIssue({ id: 'i1', issueType: 123 as unknown as string }),
        ]);
        const result = parseJiraPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('"issueType" must be a string'),
                ])
            );
        }
    });

    it('rejects non-string description', () => {
        const raw = makePayload([
            makeIssue({ id: 'i1', description: 42 as unknown as string }),
        ]);
        const result = parseJiraPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('"description" must be a string'),
                ])
            );
        }
    });

    it('rejects non-array labels', () => {
        const raw = makePayload([
            makeIssue({ id: 'i1', labels: 'not-an-array' as unknown as string[] }),
        ]);
        const result = parseJiraPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('"labels" must be an array'),
                ])
            );
        }
    });
});

// ============================================================================
// parseJiraPayload — cycle detection
// ============================================================================

describe('parseJiraPayload — cycle detection', () => {
    it('rejects direct self-cycle (A → A)', () => {
        const raw = makePayload([makeIssue({ id: 'a', parent: 'a' })]);
        const result = parseJiraPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                expect.arrayContaining([expect.stringContaining('cycle in parent chain')])
            );
        }
    });

    it('rejects two-node cycle (A → B → A)', () => {
        const raw = makePayload([
            makeIssue({ id: 'a', parent: 'b' }),
            makeIssue({ id: 'b', parent: 'a' }),
        ]);
        const result = parseJiraPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors.some(e => e.includes('cycle'))).toBe(true);
        }
    });

    it('rejects three-node cycle', () => {
        const raw = makePayload([
            makeIssue({ id: 'a', parent: 'c' }),
            makeIssue({ id: 'b', parent: 'a' }),
            makeIssue({ id: 'c', parent: 'b' }),
        ]);
        const result = parseJiraPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors.some(e => e.includes('cycle'))).toBe(true);
        }
    });
});

// ============================================================================
// parseJiraPayload — multiple errors and edge cases
// ============================================================================

describe('parseJiraPayload — multiple errors and edge cases', () => {
    it('collects all errors at once', () => {
        const raw = makePayload(
            [
                makeIssue({ id: 'i1', summary: '' }),
                makeIssue({ id: 'i1', summary: 'dup' }),
                makeIssue({ id: 'i2', parent: 'unknown' }),
            ],
            { format: 'wrong', version: 99, project: '' }
        );
        const result = parseJiraPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors.length).toBeGreaterThanOrEqual(5);
        }
    });

    it('rejects non-object payload', () => {
        const result = parseJiraPayload('not an object');
        expect(result.ok).toBe(false);
    });

    it('rejects array payload', () => {
        const result = parseJiraPayload([1, 2, 3]);
        expect(result.ok).toBe(false);
    });

    it('rejects null payload', () => {
        const result = parseJiraPayload(null);
        expect(result.ok).toBe(false);
    });

    it('rejects missing issues array', () => {
        const raw = makePayload([makeIssue()]);
        delete (raw as Record<string, unknown>).issues;
        const result = parseJiraPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                expect.arrayContaining([expect.stringContaining('"issues"')])
            );
        }
    });
});

// ============================================================================
// detectJiraCycle
// ============================================================================

describe('detectJiraCycle', () => {
    function makeIssueMap(issues: JiraPayloadIssue[]): Map<string, JiraPayloadIssue> {
        return new Map(issues.map(i => [i.id, i]));
    }

    it('returns null for a chain that terminates at root', () => {
        const issues = [
            makeIssue({ id: 'c', parent: 'b' }),
            makeIssue({ id: 'b', parent: 'a' }),
            makeIssue({ id: 'a', parent: null }),
        ];
        expect(detectJiraCycle('c', makeIssueMap(issues))).toBeNull();
    });

    it('returns null for a root issue', () => {
        const issues = [makeIssue({ id: 'a', parent: null })];
        expect(detectJiraCycle('a', makeIssueMap(issues))).toBeNull();
    });

    it('detects a self-cycle', () => {
        const issues = [makeIssue({ id: 'a', parent: 'a' })];
        const cycle = detectJiraCycle('a', makeIssueMap(issues));
        expect(cycle).not.toBeNull();
        expect(cycle).toEqual(['a', 'a']);
    });

    it('detects a two-node cycle', () => {
        const issues = [
            makeIssue({ id: 'a', parent: 'b' }),
            makeIssue({ id: 'b', parent: 'a' }),
        ];
        const cycle = detectJiraCycle('a', makeIssueMap(issues));
        expect(cycle).not.toBeNull();
        expect(cycle).toEqual(['a', 'b', 'a']);
    });
});

// ============================================================================
// simpleNormal
// ============================================================================

describe('simpleNormal', () => {
    it('trims leading and trailing whitespace', () => {
        expect(simpleNormal('  hello  ')).toBe('hello');
    });

    it('collapses multiple spaces to a single space', () => {
        expect(simpleNormal('a    b')).toBe('a b');
    });

    it('collapses newlines and tabs to a single space', () => {
        expect(simpleNormal('a\n\n\tb')).toBe('a b');
    });

    it('returns empty string for whitespace-only input', () => {
        expect(simpleNormal('   \n\t  ')).toBe('');
    });

    it('does NOT do XML canonicalization (preserves wiki markup)', () => {
        const wiki = 'h1. Heading\n* item 1\n* item 2';
        expect(simpleNormal(wiki)).toBe('h1. Heading * item 1 * item 2');
    });
});

// ============================================================================
// Constants
// ============================================================================

describe('Constants', () => {
    it('SYNC_MARKER_LABEL is "onyx-sync"', () => {
        expect(SYNC_MARKER_LABEL).toBe('onyx-sync');
    });

    it('JIRA_PAYLOAD_FORMAT is "onyx-sync/jira-issues"', () => {
        expect(JIRA_PAYLOAD_FORMAT).toBe('onyx-sync/jira-issues');
    });

    it('JIRA_PAYLOAD_VERSION is 1', () => {
        expect(JIRA_PAYLOAD_VERSION).toBe(1);
    });

    it('JIRA_DEFAULT_ISSUE_TYPE is "Задача"', () => {
        expect(JIRA_DEFAULT_ISSUE_TYPE).toBe('Задача');
    });

    it('JIRA_SUBTASK_ISSUE_TYPE is "Подзадача"', () => {
        expect(JIRA_SUBTASK_ISSUE_TYPE).toBe('Подзадача');
    });
});
