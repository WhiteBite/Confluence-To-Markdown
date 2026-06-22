/**
 * Tests for size-estimator module.
 *
 * Covers:
 *  1. Race condition fix: parallel fetchPageSizes calls for different ids both populate cache
 *  2. Pagination: second request is made when first response has 200 results
 *  3. Pagination stops when response has fewer than 200 results
 *  4. MAX_PAGES (10) protection: at most 10 requests per page even with full pages
 *  5. calculateSizeEstimate with empty filter: only text, no attachments
 *  6. calculateSizeEstimate with * filter: all attachments counted
 *  7. hasCachedSizes: returns true only when all ids are present in cache
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mocks are hoisted before imports by vitest
vi.mock('@/utils/transport', () => ({
    fetchJson: vi.fn(),
}));

vi.mock('@/api/confluence', () => ({
    getBaseUrl: vi.fn(() => 'https://example.atlassian.net'),
}));

vi.mock('@/utils/logger', () => ({
    ctmLog: vi.fn(),
    ctmError: vi.fn(),
}));

import { fetchJson } from '@/utils/transport';
import {
    fetchPageSizes,
    hasCachedSizes,
    clearSizeCache,
    calculateSizeEstimate,
} from '../src/core/size-estimator';

const mockFetchJson = vi.mocked(fetchJson);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build an AttachmentResponse with `count` generic PDF entries. */
function makePdfResponse(count: number) {
    return {
        results: Array.from({ length: count }, (_, i) => ({
            title: `file${i}.pdf`,
            extensions: { fileSize: 1024, mediaType: 'application/pdf' },
        })),
    };
}

beforeEach(() => {
    clearSizeCache();
    mockFetchJson.mockReset();
});

// ---------------------------------------------------------------------------
// 1. Race condition: parallel calls for different ids both populate cache
// ---------------------------------------------------------------------------

describe('fetchPageSizes – race condition (inProgressIds Set)', () => {
    it('two parallel calls with different page ids both populate cache', async () => {
        // Both calls start before any async work completes.
        // With the old boolean flag the second call would return early and
        // leave its pages uncached; the Set-based approach allows both through.
        mockFetchJson.mockResolvedValue({ results: [] });

        await Promise.all([
            fetchPageSizes(['page-a', 'page-b']),
            fetchPageSizes(['page-c', 'page-d']),
        ]);

        expect(hasCachedSizes(['page-a', 'page-b', 'page-c', 'page-d'])).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// 2-4. Pagination
// ---------------------------------------------------------------------------

describe('fetchPageSizes – pagination', () => {
    it('makes a second request when first response returns 200 results', async () => {
        mockFetchJson
            .mockResolvedValueOnce(makePdfResponse(200)) // full page → has more
            .mockResolvedValueOnce(makePdfResponse(50));  // partial page → done

        await fetchPageSizes(['page1']);

        expect(mockFetchJson).toHaveBeenCalledTimes(2);
    });

    it('second request uses start=200', async () => {
        mockFetchJson
            .mockResolvedValueOnce(makePdfResponse(200))
            .mockResolvedValueOnce(makePdfResponse(0));

        await fetchPageSizes(['page1']);

        const secondUrl = mockFetchJson.mock.calls[1][0] as string;
        expect(secondUrl).toContain('start=200');
    });

    it('stops after one request when first response has fewer than 200 results', async () => {
        mockFetchJson.mockResolvedValueOnce(makePdfResponse(99));

        await fetchPageSizes(['page1']);

        expect(mockFetchJson).toHaveBeenCalledTimes(1);
    });

    it('stops at MAX_PAGES (10) even when every response is a full page of 200', async () => {
        // Always returns 200 results → without the MAX_PAGES guard this would loop forever
        mockFetchJson.mockResolvedValue(makePdfResponse(200));

        await fetchPageSizes(['page1']);

        expect(mockFetchJson).toHaveBeenCalledTimes(10);
    });
});

// ---------------------------------------------------------------------------
// 5-6. calculateSizeEstimate
// ---------------------------------------------------------------------------

describe('calculateSizeEstimate', () => {
    const IMAGE_BYTES = 1_048_576; // 1 MB
    const PDF_BYTES = 524_288;     // 0.5 MB

    // Populate the cache with a page that has one PNG image and one PDF.
    beforeEach(async () => {
        mockFetchJson.mockResolvedValue({
            results: [
                {
                    title: 'photo.png',
                    extensions: { fileSize: IMAGE_BYTES, mediaType: 'image/png' },
                },
                {
                    title: 'report.pdf',
                    extensions: { fileSize: PDF_BYTES, mediaType: 'application/pdf' },
                },
            ],
        });
        await fetchPageSizes(['p1']);
        mockFetchJson.mockReset();
    });

    it('empty filter – only text bytes, no attachment bytes', () => {
        const estimate = calculateSizeEstimate(['p1'], {
            includeImages: false,
            attachmentFilter: '',
        });

        // No attachments included when filter is empty
        expect(estimate.imagesMB).toBe(0);
        expect(estimate.otherMB).toBe(0);
        // Text fallback: DEFAULT_TEXT_SIZE_BYTES = 5 * 1024 bytes
        const expectedTextMB = (5 * 1024) / (1024 * 1024);
        expect(estimate.textMB).toBeCloseTo(expectedTextMB, 6);
        expect(estimate.pageCount).toBe(1);
    });

    it('* filter – all attachment bytes counted (images + other)', () => {
        // includeImages: false, but wildcard also routes image bytes into imagesMB
        const estimate = calculateSizeEstimate(['p1'], {
            includeImages: false,
            attachmentFilter: '*',
        });

        expect(estimate.imagesMB).toBeCloseTo(IMAGE_BYTES / (1024 * 1024), 6);
        expect(estimate.otherMB).toBeCloseTo(PDF_BYTES / (1024 * 1024), 6);
        // Total must include both attachment categories plus text
        expect(estimate.totalMB).toBeGreaterThan(estimate.textMB);
    });
});

// ---------------------------------------------------------------------------
// 7. hasCachedSizes
// ---------------------------------------------------------------------------

describe('hasCachedSizes', () => {
    it('returns false when cache is empty', () => {
        expect(hasCachedSizes(['x'])).toBe(false);
    });

    it('returns false when only a subset of ids is cached', async () => {
        mockFetchJson.mockResolvedValue({ results: [] });
        await fetchPageSizes(['p1']);

        expect(hasCachedSizes(['p1', 'p2'])).toBe(false);
    });

    it('returns true when all requested ids are cached', async () => {
        mockFetchJson.mockResolvedValue({ results: [] });
        await fetchPageSizes(['p1', 'p2']);

        expect(hasCachedSizes(['p1', 'p2'])).toBe(true);
    });

    it('returns true for an empty id list (vacuously)', () => {
        expect(hasCachedSizes([])).toBe(true);
    });
});
