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
// Cache
// ============================================================================

const sizeCache = new Map<string, PageSizeInfo>();
let fetchInProgress = false;

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
}

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp']);
const DIAGRAM_TYPES = new Set(['application/vnd.jgraph.mxfile', 'application/gliffy+json']);

/**
 * Fetch real attachment sizes for a list of page IDs.
 * Results are cached — subsequent calls for same IDs are instant.
 * Concurrency-limited to avoid 429.
 */
export async function fetchPageSizes(
    pageIds: string[],
    onProgress?: (done: number, total: number) => void
): Promise<void> {
    // Filter out already-cached
    const uncached = pageIds.filter(id => !sizeCache.has(id));
    if (uncached.length === 0) return;
    if (fetchInProgress) return; // avoid parallel fetches

    fetchInProgress = true;
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
        fetchInProgress = false;
    }

    ctmLog(`[SizeEstimator] Cache now has ${sizeCache.size} entries`);
}

async function fetchSinglePageSize(pageId: string): Promise<PageSizeInfo> {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/rest/api/content/${pageId}/child/attachment?expand=extensions&limit=200`;

    let imageSizeBytes = 0;
    let otherAttachmentSizeBytes = 0;
    let imageCount = 0;
    let diagramCount = 0;
    let otherCount = 0;

    try {
        const response = await fetchJson<AttachmentResponse>(url);
        for (const att of response.results || []) {
            const size = att.extensions?.fileSize ?? 0;
            const mediaType = att.extensions?.mediaType ?? att.metadata?.mediaType ?? '';

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
        }
    } catch (error) {
        ctmError(`[SizeEstimator] Failed for page ${pageId}:`, error);
    }

    // Text size: rough estimate ~5KB per page (actual HTML is usually 2-20KB)
    const textSizeBytes = 5 * 1024;

    return {
        pageId,
        textSizeBytes,
        imageSizeBytes,
        otherAttachmentSizeBytes,
        imageCount,
        diagramCount,
        otherCount,
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

    for (const id of pageIds) {
        const info = sizeCache.get(id);
        if (!info) {
            // Fallback: estimate 5KB text per page
            textBytes += 5 * 1024;
            continue;
        }

        textBytes += info.textSizeBytes;
        imageCount += info.imageCount;
        diagramCount += info.diagramCount;

        if (options.includeImages) {
            imageBytes += info.imageSizeBytes;
        }

        if (hasFilter) {
            otherBytes += info.otherAttachmentSizeBytes;
            otherAttachmentCount += info.otherCount;
            // If filter is '*' (all), also count images as attachments when images are not enabled
            if (filterSet.has('*') && !options.includeImages) {
                imageBytes += info.imageSizeBytes;
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
