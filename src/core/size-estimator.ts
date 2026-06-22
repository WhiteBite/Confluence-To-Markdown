/**
 * Real size estimation for export.
 *
 * Fetches actual attachment sizes from Confluence REST API once,
 * caches them, and provides instant recalculation when settings change.
 */

import { getBaseUrl } from '@/api/confluence';
import { fetchJson } from '@/utils/transport';
import { runWithConcurrency } from '@/utils/queue';
import { ctmLog, ctmError } from '@/utils/logger';
import { parseAttachmentFilter } from '@/core/attachment-filter';

// ============================================================================
// Types
// ============================================================================

export interface PageSizeInfo {
    pageId: string;
    /** Estimated text content size in bytes (from body.view length heuristic) */
    textSizeBytes: number;
    /** Total size of image attachments in bytes */
    imageSizeBytes: number;
    /** Total size of non-image attachments in bytes */
    otherAttachmentSizeBytes: number;
    /** Number of image attachments */
    imageCount: number;
    /** Number of diagram attachments (drawio, gliffy) */
    diagramCount: number;
    /** Number of other attachments */
    otherCount: number;
    /** Size breakdown by file extension (lowercase, no dot) */
    sizeByExtension: Record<string, number>;
    /** Count breakdown by file extension */
    countByExtension: Record<string, number>;
}

export interface SizeEstimate {
    /** Total text content (markdown) */
    textMB: number;
    /** Total images size */
    imagesMB: number;
    /** Total other attachments */
    otherMB: number;
    /** Grand total */
    totalMB: number;
    /** Counts */
    pageCount: number;
    imageCount: number;
    diagramCount: number;
    otherAttachmentCount: number;
}

// ============================================================================
// Constants
// ============================================================================

/** Fallback text size per page when body is unavailable (~5 KB). */
const DEFAULT_TEXT_SIZE_BYTES = 5 * 1024;

/** Maximum attachment pages to fetch per page (guards against infinite loops). */
const MAX_ATTACHMENT_PAGES = 10;

// ============================================================================
// Cache
// ============================================================================

const sizeCache = new Map<string, PageSizeInfo>();

/**
 * Tracks page IDs currently being fetched to prevent duplicate parallel requests
 * for the same page. Unlike a simple boolean flag, this allows concurrent calls
 * for different page ID sets to proceed independently.
 */
const inProgressIds = new Set<string>();

/** Clear cache (e.g., on tree refresh) */
export function clearSizeCache(): void {
    sizeCache.clear();
}

/** Check if sizes are cached for given page IDs */
export function hasCachedSizes(pageIds: string[]): boolean {
    return pageIds.every(id => sizeCache.has(id));
}

// ============================================================================
// Fetch sizes
// ============================================================================

interface AttachmentResponse {
    results: Array<{
        title: string;
        extensions?: { fileSize?: number; mediaType?: string };
        metadata?: { mediaType?: string };
    }>;
    /** Offset of the first result in this page. */
    start?: number;
    /** Total number of attachments (may differ from results.length). */
    size?: number;
}

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp']);
const DIAGRAM_TYPES = new Set(['application/vnd.jgraph.mxfile', 'application/gliffy+json']);

/**
 * Fetch real attachment sizes for a list of page IDs.
 * Results are cached — subsequent calls for same IDs are instant.
 * Concurrency-limited to avoid 429.
 *
 * Multiple concurrent calls with different page ID sets proceed independently;
 * IDs already being fetched by another in-flight call are skipped to avoid
 * duplicate requests.
 */
export async function fetchPageSizes(
    pageIds: string[],
    onProgress?: (done: number, total: number) => void
): Promise<void> {
    // Filter out already-cached and currently-in-flight IDs
    const uncached = pageIds.filter(id => !sizeCache.has(id) && !inProgressIds.has(id));
    if (uncached.length === 0) return;

    for (const id of uncached) inProgressIds.add(id);
    ctmLog(`[SizeEstimator] Fetching sizes for ${uncached.length} pages`);

    try {
        await runWithConcurrency(
            uncached,
            async (pageId) => {
                const info = await fetchSinglePageSize(pageId);
                sizeCache.set(pageId, info);
            },
            {
                concurrency: 10, // Higher for metadata (lightweight requests)
                onProgress: (done, total) => onProgress?.(done, total),
                bailOnError: false,
            }
        );
    } finally {
        for (const id of uncached) inProgressIds.delete(id);
    }

    ctmLog(`[SizeEstimator] Cache now has ${sizeCache.size} entries`);
}

async function fetchSinglePageSize(pageId: string): Promise<PageSizeInfo> {
    const baseUrl = getBaseUrl();
    const limit = 200;

    let imageSizeBytes = 0;
    let otherAttachmentSizeBytes = 0;
    let imageCount = 0;
    let diagramCount = 0;
    let otherCount = 0;
    const sizeByExtension: Record<string, number> = {};
    const countByExtension: Record<string, number> = {};

    let start = 0;
    let hasMore = true;
    let pages = 0;

    try {
        while (hasMore && pages < MAX_ATTACHMENT_PAGES) {
            const url = `${baseUrl}/rest/api/content/${pageId}/child/attachment?expand=extensions&limit=${limit}&start=${start}`;
            const response = await fetchJson<AttachmentResponse>(url);

            for (const att of response.results || []) {
                const size = att.extensions?.fileSize ?? 0;
                const mediaType = att.extensions?.mediaType ?? att.metadata?.mediaType ?? '';
                const ext = (att.title.match(/\.([^.]+)$/) || [])[1]?.toLowerCase() || '';

                if (DIAGRAM_TYPES.has(mediaType)) {
                    diagramCount++;
                    otherAttachmentSizeBytes += size;
                } else if (IMAGE_TYPES.has(mediaType) || /\.(png|jpe?g|gif|svg|webp)$/i.test(att.title)) {
                    imageCount++;
                    imageSizeBytes += size;
                } else {
                    otherCount++;
                    otherAttachmentSizeBytes += size;
                }

                // Track per-extension breakdown for all non-diagram attachments
                if (ext && !DIAGRAM_TYPES.has(mediaType)) {
                    sizeByExtension[ext] = (sizeByExtension[ext] || 0) + size;
                    countByExtension[ext] = (countByExtension[ext] || 0) + 1;
                }
            }

            hasMore = response.results.length === limit;
            start += limit;
            pages++;
        }
    } catch (error) {
        ctmError(`[SizeEstimator] Failed for page ${pageId}:`, error);
    }

    return {
        pageId,
        // Fallback estimate: ~5 KB per page (actual HTML is usually 2–20 KB).
        // Used when body content is not fetched; sufficient for order-of-magnitude estimates.
        textSizeBytes: DEFAULT_TEXT_SIZE_BYTES,
        imageSizeBytes,
        otherAttachmentSizeBytes,
        imageCount,
        diagramCount,
        otherCount,
        sizeByExtension,
        countByExtension,
    };
}

// ============================================================================
// Calculate estimate from cache
// ============================================================================

export interface EstimateOptions {
    includeImages: boolean;
    attachmentFilter: string;
}

/**
 * Calculate size estimate from cached data. Instant (no API calls).
 * Call fetchPageSizes() first to populate cache.
 */
export function calculateSizeEstimate(
    pageIds: string[],
    options: EstimateOptions
): SizeEstimate {
    let textBytes = 0;
    let imageBytes = 0;
    let otherBytes = 0;
    let imageCount = 0;
    let diagramCount = 0;
    let otherAttachmentCount = 0;

    const filterSet = parseAttachmentFilter(options.attachmentFilter);
    const hasFilter = filterSet.size > 0;
    const isWildcard = filterSet.has('*');

    for (const id of pageIds) {
        const info = sizeCache.get(id);
        if (!info) {
            // Fallback: estimate DEFAULT_TEXT_SIZE_BYTES text per page
            textBytes += DEFAULT_TEXT_SIZE_BYTES;
            continue;
        }

        textBytes += info.textSizeBytes;
        imageCount += info.imageCount;
        diagramCount += info.diagramCount;

        if (options.includeImages) {
            imageBytes += info.imageSizeBytes;
        }

        if (hasFilter) {
            if (isWildcard) {
                // Wildcard: count all other attachments
                otherBytes += info.otherAttachmentSizeBytes;
                otherAttachmentCount += info.otherCount;
                // Also count images as attachments when images checkbox is not enabled
                if (!options.includeImages) {
                    imageBytes += info.imageSizeBytes;
                }
            } else {
                // Filtered: only count extensions that match the filter
                for (const [ext, bytes] of Object.entries(info.sizeByExtension)) {
                    if (filterSet.has(ext)) {
                        // Image extensions go to imageBytes, others to otherBytes
                        if (/^(png|jpe?g|gif|svg|webp|bmp|ico|tiff)$/.test(ext)) {
                            if (!options.includeImages) {
                                imageBytes += bytes;
                            }
                        } else {
                            otherBytes += bytes;
                            otherAttachmentCount += info.countByExtension[ext] || 0;
                        }
                    }
                }
            }
        }
    }

    const toMB = (bytes: number): number => bytes / (1024 * 1024);

    return {
        textMB: toMB(textBytes),
        imagesMB: toMB(imageBytes),
        otherMB: toMB(otherBytes),
        totalMB: toMB(textBytes + imageBytes + otherBytes),
        pageCount: pageIds.length,
        imageCount,
        diagramCount,
        otherAttachmentCount,
    };
}
