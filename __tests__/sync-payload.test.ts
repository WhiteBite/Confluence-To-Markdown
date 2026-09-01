/**
 * Tests for sync-payload.ts
 *
 * Covers:
 *   - parseSyncPayload: valid payload, each validation error case, multiple errors
 *   - detectCycle: direct and indirect cycles
 *   - normalizeBody: whitespace collapsing and trimming
 */

import { describe, it, expect } from 'vitest';
import {
    parseSyncPayload,
    detectCycle,
    normalizeBody,
    SYNC_MARKER_LABEL,
    type SyncPayloadPage,
} from '@/core/sync-payload';

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
    overrides: Record<string, unknown> = {}
): Record<string, unknown> {
    return {
        format: 'onyx-sync/confluence-pages',
        version: 1,
        space: 'SPC',
        generatedAt: '2026-08-19T12:00:00Z',
        pages,
        ...overrides,
    };
}

// ============================================================================
// parseSyncPayload — valid
// ============================================================================

describe('parseSyncPayload — valid payload', () => {
    it('parses a minimal valid payload', () => {
        const raw = makePayload([makePage()]);
        const result = parseSyncPayload(raw);

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.payload.format).toBe('onyx-sync/confluence-pages');
            expect(result.payload.version).toBe(1);
            expect(result.payload.space).toBe('SPC');
            expect(result.payload.generatedAt).toBe('2026-08-19T12:00:00Z');
            expect(result.payload.pages).toHaveLength(1);
            expect(result.payload.pages[0].id).toBe('p1');
        }
    });

    it('parses a payload with parent references and labels', () => {
        const raw = makePayload([
            makePage({ id: 'root', title: 'Root', parent: null, labels: ['arch'] }),
            makePage({ id: 'child', title: 'Child', parent: 'root' }),
        ]);
        const result = parseSyncPayload(raw);

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.payload.pages).toHaveLength(2);
            expect(result.payload.pages[0].labels).toEqual(['arch']);
            expect(result.payload.pages[1].parent).toBe('root');
        }
    });

    it('parses a payload with no pages', () => {
        const raw = makePayload([]);
        const result = parseSyncPayload(raw);

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.payload.pages).toHaveLength(0);
        }
    });

    it('defaults generatedAt when missing', () => {
        const raw = makePayload([makePage()]);
        delete (raw as Record<string, unknown>).generatedAt;
        const result = parseSyncPayload(raw);

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.payload.generatedAt).toBeTruthy();
        }
    });
});

// ============================================================================
// parseSyncPayload — format/version errors
// ============================================================================

describe('parseSyncPayload — format/version errors', () => {
    it('rejects wrong format', () => {
        const raw = makePayload([makePage()], { format: 'wrong-format' });
        const result = parseSyncPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('Invalid "format"'),
                ])
            );
        }
    });

    it('rejects wrong version', () => {
        const raw = makePayload([makePage()], { version: 2 });
        const result = parseSyncPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('Invalid "version"'),
                ])
            );
        }
    });

    it('rejects missing format and version', () => {
        const raw = makePayload([makePage()]);
        delete (raw as Record<string, unknown>).format;
        delete (raw as Record<string, unknown>).version;
        const result = parseSyncPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors.length).toBeGreaterThanOrEqual(2);
        }
    });
});

// ============================================================================
// parseSyncPayload — space errors
// ============================================================================

describe('parseSyncPayload — space errors', () => {
    it('rejects missing space', () => {
        const raw = makePayload([makePage()]);
        delete (raw as Record<string, unknown>).space;
        const result = parseSyncPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('Missing or empty "space"'),
                ])
            );
        }
    });

    it('rejects empty space', () => {
        const raw = makePayload([makePage()], { space: '   ' });
        const result = parseSyncPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('"space"'),
                ])
            );
        }
    });
});

// ============================================================================
// parseSyncPayload — per-page errors
// ============================================================================

describe('parseSyncPayload — per-page errors', () => {
    it('rejects duplicate ids', () => {
        const raw = makePayload([
            makePage({ id: 'dup', title: 'A' }),
            makePage({ id: 'dup', title: 'B' }),
        ]);
        const result = parseSyncPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('duplicate id "dup"'),
                ])
            );
        }
    });

    it('rejects empty title', () => {
        const raw = makePayload([makePage({ id: 'p1', title: '   ' })]);
        const result = parseSyncPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('empty "title"'),
                ])
            );
        }
    });

    it('rejects empty storage', () => {
        const raw = makePayload([makePage({ id: 'p1', storage: '' })]);
        const result = parseSyncPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('empty "storage"'),
                ])
            );
        }
    });

    it('rejects parent reference to unknown id', () => {
        const raw = makePayload([
            makePage({ id: 'p1', parent: 'nonexistent' }),
        ]);
        const result = parseSyncPayload(raw);

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
            makePage({ id: 'p1', parent: '' as unknown as string | null }),
        ]);
        const result = parseSyncPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('"parent" must not be an empty string'),
                ])
            );
        }
    });

    it('rejects non-array labels', () => {
        const raw = makePayload([
            makePage({ id: 'p1', labels: 'not-an-array' as unknown as string[] }),
        ]);
        const result = parseSyncPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('"labels" must be an array'),
                ])
            );
        }
    });

    it('rejects labels array with non-string elements', () => {
        const raw = makePayload([
            makePage({
                id: 'p1',
                labels: ['valid', 123, 'also-valid'] as unknown as string[],
            }),
        ]);
        const result = parseSyncPayload(raw);

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
// parseSyncPayload — cycle detection
// ============================================================================

describe('parseSyncPayload — cycle detection', () => {
    it('rejects direct self-cycle (A → A)', () => {
        const raw = makePayload([
            makePage({ id: 'a', parent: 'a' }),
        ]);
        const result = parseSyncPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('cycle in parent chain'),
                ])
            );
        }
    });

    it('rejects two-node cycle (A → B → A)', () => {
        const raw = makePayload([
            makePage({ id: 'a', parent: 'b' }),
            makePage({ id: 'b', parent: 'a' }),
        ]);
        const result = parseSyncPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('cycle in parent chain'),
                ])
            );
        }
    });

    it('rejects three-node cycle (A → B → C → A)', () => {
        const raw = makePayload([
            makePage({ id: 'a', parent: 'c' }),
            makePage({ id: 'b', parent: 'a' }),
            makePage({ id: 'c', parent: 'b' }),
        ]);
        const result = parseSyncPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors.some(e => e.includes('cycle'))).toBe(true);
        }
    });
});

// ============================================================================
// parseSyncPayload — multiple errors
// ============================================================================

describe('parseSyncPayload — multiple errors', () => {
    it('collects all errors at once', () => {
        const raw = makePayload(
            [
                makePage({ id: 'p1', title: '' }),
                makePage({ id: 'p1', storage: '' }),
                makePage({ id: 'p2', parent: 'unknown' }),
            ],
            { format: 'wrong', version: 99, space: '' }
        );
        const result = parseSyncPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            // Should have at least: format, version, space, empty title,
            // duplicate id, empty storage, unknown parent
            expect(result.errors.length).toBeGreaterThanOrEqual(5);
        }
    });

    it('rejects non-object payload', () => {
        const result = parseSyncPayload('not an object');
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('must be a JSON object'),
                ])
            );
        }
    });

    it('rejects array payload', () => {
        const result = parseSyncPayload([1, 2, 3]);
        expect(result.ok).toBe(false);
    });

    it('rejects null payload', () => {
        const result = parseSyncPayload(null);
        expect(result.ok).toBe(false);
    });

    it('rejects missing pages array', () => {
        const raw = makePayload([makePage()]);
        delete (raw as Record<string, unknown>).pages;
        const result = parseSyncPayload(raw);

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('"pages"'),
                ])
            );
        }
    });
});

// ============================================================================
// detectCycle
// ============================================================================

describe('detectCycle', () => {
    function makePageMap(pages: SyncPayloadPage[]): Map<string, SyncPayloadPage> {
        return new Map(pages.map(p => [p.id, p]));
    }

    it('returns null for a chain that terminates at root', () => {
        const pages = [
            makePage({ id: 'c', parent: 'b' }),
            makePage({ id: 'b', parent: 'a' }),
            makePage({ id: 'a', parent: null }),
        ];
        expect(detectCycle('c', makePageMap(pages))).toBeNull();
    });

    it('returns null for a root page', () => {
        const pages = [makePage({ id: 'a', parent: null })];
        expect(detectCycle('a', makePageMap(pages))).toBeNull();
    });

    it('detects a self-cycle', () => {
        const pages = [makePage({ id: 'a', parent: 'a' })];
        const cycle = detectCycle('a', makePageMap(pages));
        expect(cycle).not.toBeNull();
        expect(cycle).toEqual(['a', 'a']);
    });

    it('detects a two-node cycle', () => {
        const pages = [
            makePage({ id: 'a', parent: 'b' }),
            makePage({ id: 'b', parent: 'a' }),
        ];
        const cycle = detectCycle('a', makePageMap(pages));
        expect(cycle).not.toBeNull();
        expect(cycle).toEqual(['a', 'b', 'a']);
    });
});

// ============================================================================
// normalizeBody
// ============================================================================

describe('normalizeBody', () => {
    it('trims leading and trailing whitespace', () => {
        expect(normalizeBody('  hello  ')).toBe('hello');
    });

    it('collapses multiple spaces to a single space', () => {
        expect(normalizeBody('a    b')).toBe('a b');
    });

    it('collapses newlines and tabs to a single space', () => {
        expect(normalizeBody('a\n\n\tb')).toBe('a b');
    });

    it('returns empty string for whitespace-only input', () => {
        expect(normalizeBody('   \n\t  ')).toBe('');
    });

    it('treats equal bodies with different whitespace as equal', () => {
        const a = '<p>hello   world</p>';
        const b = '<p>hello\nworld</p>';
        expect(normalizeBody(a)).toBe(normalizeBody(b));
    });

    it('strips server-generated ac:schema-version and ac:macro-id attributes', () => {
        const payload =
            '<ac:structured-macro ac:name="info"><ac:rich-text-body><p>Hi</p></ac:rich-text-body></ac:structured-macro>';
        const stored =
            '<ac:structured-macro ac:name="info" ac:schema-version="1" ac:macro-id="2b4dcf98-ea2a-459a-b7ca-c055484f762b"><ac:rich-text-body><p>Hi</p></ac:rich-text-body></ac:structured-macro>';
        expect(normalizeBody(stored)).toBe(normalizeBody(payload));
    });

    it('still detects real content differences after stripping server attributes', () => {
        const a = '<ac:structured-macro ac:name="info"><ac:rich-text-body><p>Hi</p></ac:rich-text-body></ac:structured-macro>';
        const b = '<ac:structured-macro ac:name="info" ac:schema-version="1" ac:macro-id="61d538c5"><ac:rich-text-body><p>Bye</p></ac:rich-text-body></ac:structured-macro>';
        expect(normalizeBody(a)).not.toBe(normalizeBody(b));
    });

    it('treats reordered ac:parameter children as equal (server reorders them on save)', () => {
        const payload =
            '<ac:structured-macro ac:name="status"><ac:parameter ac:name="title">STABLE</ac:parameter><ac:parameter ac:name="colour">Green</ac:parameter></ac:structured-macro>';
        const stored =
            '<ac:structured-macro ac:name="status" ac:schema-version="1" ac:macro-id="12f0d344"><ac:parameter ac:name="colour">Green</ac:parameter><ac:parameter ac:name="title">STABLE</ac:parameter></ac:structured-macro>';
        expect(normalizeBody(stored)).toBe(normalizeBody(payload));
    });

    it('keeps significant content order (does not sort non-parameter children)', () => {
        const a = '<h2>First</h2><p>Second</p>';
        const b = '<p>Second</p><h2>First</h2>';
        expect(normalizeBody(a)).not.toBe(normalizeBody(b));
    });

    it('canonicalizes nested macros inside rich-text-body', () => {
        const payload =
            '<ac:structured-macro ac:name="expand"><ac:parameter ac:name="title">X</ac:parameter><ac:rich-text-body><ac:structured-macro ac:name="code"><ac:parameter ac:name="language">json</ac:parameter><ac:plain-text-body><![CDATA[{"a":1}]]></ac:plain-text-body></ac:structured-macro></ac:rich-text-body></ac:structured-macro>';
        const stored =
            '<ac:structured-macro ac:name="expand" ac:schema-version="1" ac:macro-id="aaa"><ac:parameter ac:name="title">X</ac:parameter><ac:rich-text-body><ac:structured-macro ac:name="code" ac:schema-version="1" ac:macro-id="bbb"><ac:parameter ac:name="language">json</ac:parameter><ac:plain-text-body><![CDATA[{"a":1}]]></ac:plain-text-body></ac:structured-macro></ac:rich-text-body></ac:structured-macro>';
        expect(normalizeBody(stored)).toBe(normalizeBody(payload));
    });
});

// ============================================================================
// Constants
// ============================================================================

describe('SYNC_MARKER_LABEL', () => {
    it('is "onyx-sync"', () => {
        expect(SYNC_MARKER_LABEL).toBe('onyx-sync');
    });
});
