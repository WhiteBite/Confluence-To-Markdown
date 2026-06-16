import { PAGE_LIMIT, EXPAND_CONTENT } from '@/config';
import { fetchJson as transportFetchJson } from '@/utils/transport';
import { withRetry } from '@/utils/queue';
import { ctmError, ctmLog, ctmWarn } from '@/utils/logger';
import { ConfluenceApiError } from '@/api/errors';
import type {
    ConfluencePage,
    ConfluencePageWithContent,
    ConfluencePaginatedResponse,
    HubPageData,
    HubCatalogPage,
} from './types';

/** Get base URL from current page */
export function getBaseUrl(): string {
    const { protocol, host } = window.location;
    return `${protocol}//${host}`;
}

/**
 * Universal fetch with retry. Delegates to the unified transport layer and
 * wraps the call in `withRetry` so 429/5xx/transient network failures are
 * retried with backoff (capped by RATE_LIMIT_MAX_DELAY_MS). Auth/forbidden/
 * 404 errors are NOT retried — they bubble up immediately as
 * {@link ConfluenceApiError}.
 *
 * Re-exported for legacy callers (e.g. `src/hub/sync-checker.ts`); new code
 * should import from `@/utils/transport` directly when retry is not needed.
 */
export function fetchJson<T>(url: string): Promise<T> {
    return withRetry(() => transportFetchJson<T>(url));
}

/** Fetch single page info (minimal data) */
export async function fetchPage(pageId: string): Promise<ConfluencePage> {
    const url = `${getBaseUrl()}/rest/api/content/${pageId}`;
    return fetchJson<ConfluencePage>(url);
}

/** Fetch page with body content and ancestors */
export async function fetchPageWithContent(pageId: string): Promise<ConfluencePageWithContent> {
    const url = `${getBaseUrl()}/rest/api/content/${pageId}?expand=${EXPAND_CONTENT}`;
    return fetchJson<ConfluencePageWithContent>(url);
}

/** Fetch all children of a page (handles pagination) */
export async function fetchChildren(pageId: string): Promise<ConfluencePage[]> {
    const baseUrl = getBaseUrl();
    const children: ConfluencePage[] = [];
    let start = 0;
    let hasMore = true;

    while (hasMore) {
        const url = `${baseUrl}/rest/api/content/${pageId}/child/page?limit=${PAGE_LIMIT}&start=${start}`;
        const response = await fetchJson<ConfluencePaginatedResponse<ConfluencePage>>(url);

        if (response.results?.length) {
            children.push(...response.results);
        }

        hasMore = response.results?.length === PAGE_LIMIT;
        start += PAGE_LIMIT;
    }

    return children;
}

/** Page with ancestors from CQL search */
export interface PageWithAncestors extends ConfluencePage {
    ancestors?: Array<{ id: string; title: string }>;
}

/** CQL search response */
interface CqlSearchResponse {
    results: PageWithAncestors[];
    start: number;
    limit: number;
    size: number;
    _links?: { next?: string };
}

/** Fetch all descendants using CQL search (much faster than recursive) */
export async function fetchAllDescendants(rootPageId: string): Promise<PageWithAncestors[]> {
    const baseUrl = getBaseUrl();
    const descendants: PageWithAncestors[] = [];
    let start = 0;
    const limit = 200; // CQL supports larger limits
    let hasMore = true;

    while (hasMore) {
        const cql = encodeURIComponent(`ancestor=${rootPageId}`);
        const url = `${baseUrl}/rest/api/content/search?cql=${cql}&expand=ancestors&limit=${limit}&start=${start}`;

        try {
            const response = await fetchJson<CqlSearchResponse>(url);

            if (response.results?.length) {
                descendants.push(...response.results);
            }

            hasMore = response.results?.length === limit;
            start += limit;
        } catch (error) {
            ctmError('[API] CQL search failed:', error);
            throw error;
        }
    }

    return descendants;
}

interface ConfluenceLabelResponse {
    results: Array<{ name: string }>;
}

interface ConfluencePageWithStorage {
    id: string;
    title: string;
    type: string;
    status: string;
    space?: { key: string };
    body?: {
        storage?: { value: string; representation: string };
    };
    ancestors?: Array<{ id: string; title: string; type: string }>;
    version?: { number: number; when: string };
    metadata?: { labels?: ConfluenceLabelResponse };
}

export async function fetchPageForHub(pageId: string): Promise<HubPageData | null> {
    const url = `${getBaseUrl()}/rest/api/content/${pageId}?expand=body.storage,ancestors,version,metadata.labels,space`;
    try {
        const page = await fetchJson<ConfluencePageWithStorage>(url);

        const labels = page.metadata?.labels?.results?.map(l => l.name) || [];

        return {
            id: page.id,
            title: page.title,
            htmlContent: page.body?.storage?.value || '',
            ancestors: (page.ancestors || []).map(a => ({ id: a.id, title: a.title, type: a.type || 'page' })),
            version: page.version ? { number: page.version.number, when: page.version.when } : undefined,
            labels,
            space: page.space?.key || '',
        };
    } catch (error) {
        ctmError('[API] fetchPageForHub failed:', error);
        return null;
    }
}

interface CqlCatalogResponse {
    results: Array<{
        id: string;
        title: string;
        status?: string;
        space?: { key: string };
        ancestors?: Array<{ id: string; title: string }>;
        version?: { when: string };
        metadata?: { labels?: ConfluenceLabelResponse };
    }>;
    start: number;
    limit: number;
    size: number;
    _links?: { next?: string };
}

export async function fetchSpaceCatalog(spaceKey: string): Promise<HubCatalogPage[]> {
    const baseUrl = getBaseUrl();
    const pages: HubCatalogPage[] = [];
    let start = 0;
    const limit = 200;
    let hasMore = true;

    while (hasMore) {
        // NOTE: Do NOT add `status=current` to CQL — Confluence Server 8.5
        // does not support the `status` field in CQL and returns HTTP 400.
        // Server 8.5 CQL already excludes drafts by default.
        const cql = encodeURIComponent(`space="${spaceKey}" AND type=page`);
        const url = `${baseUrl}/rest/api/content/search?cql=${cql}&expand=ancestors,version,metadata.labels,space&limit=${limit}&start=${start}`;

        try {
            const response = await fetchJson<CqlCatalogResponse>(url);

            if (response.results?.length) {
                for (const r of response.results) {
                    // Client-side filter: skip non-current pages (safety net)
                    if (r.status && r.status !== 'current') continue;
                    const labels = r.metadata?.labels?.results?.map(l => l.name) || [];
                    pages.push({
                        id: r.id,
                        title: r.title,
                        space: r.space?.key || spaceKey,
                        ancestors: (r.ancestors || []).map(a => ({ id: a.id, title: a.title })),
                        labels,
                        last_modified: r.version?.when || new Date().toISOString(),
                    });
                }
            }

            hasMore = response.results?.length === limit;
            start += limit;
        } catch (error) {
            ctmError('[API] fetchSpaceCatalog failed:', error);
            throw error;
        }
    }

    return pages;
}

/** Fetch space info including homepage */
interface SpaceResponse {
    id: string;
    key: string;
    name: string;
    type: string;
    status: string;
    homepage?: { id: string; title: string };
    description?: { plain?: { value: string } };
}

export async function fetchSpace(spaceKey: string): Promise<{ id: string; key: string; name: string; homepageId?: string }> {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/rest/api/space/${spaceKey}?expand=homepage`;
    const space = await fetchJson<SpaceResponse>(url);
    return {
        id: space.id,
        key: space.key,
        name: space.name,
        homepageId: space.homepage?.id,
    };
}

/** Fetch all pages in a space with ancestors for tree building */
interface SpacePagesResponse {
    results: Array<{
        id: string;
        title: string;
        type?: string;
        status?: string;
        space?: { key: string };
        ancestors?: Array<{ id: string; title: string }>;
    }>;
    start: number;
    limit: number;
    size: number;
    _links?: { next?: string };
}

export async function fetchAllPagesInSpace(
    spaceKey: string,
    onProgress?: (count: number) => void
): Promise<PageWithAncestors[]> {
    const baseUrl = getBaseUrl();
    const pages: PageWithAncestors[] = [];
    let start = 0;
    const limit = 200;
    let hasMore = true;
    let useFallback = false;
    let iteration = 0;
    const MAX_ITERATIONS = 50; // 50 × 200 = 10,000 pages max (safety break)

    ctmLog(`[API] fetchAllPagesInSpace START: spaceKey=${spaceKey}, baseUrl=${baseUrl}`);

    while (hasMore) {
        iteration++;
        if (iteration > MAX_ITERATIONS) {
            ctmError(`[API] fetchAllPagesInSpace: exceeded max iterations (${MAX_ITERATIONS}), loaded ${pages.length} pages. Possible API pagination bug.`);
            break;
        }

        let url: string;
        
        if (!useFallback) {
            // Try CQL search first (Confluence Cloud and newer Server).
            // NOTE: Do NOT add `status=current` to CQL — Confluence Server 8.5
            // does not support the `status` field in CQL and returns HTTP 400.
            // Server 8.5 CQL already excludes drafts by default.
            const cql = encodeURIComponent(`space="${spaceKey}" AND type=page`);
            url = `${baseUrl}/rest/api/content/search?cql=${cql}&expand=ancestors,space&limit=${limit}&start=${start}`;
        } else {
            // Fallback: use space content endpoint (older Confluence Server).
            // `status=current` is valid on this REST endpoint (not CQL).
            url = `${baseUrl}/rest/api/space/${spaceKey}/content?type=page&status=current&expand=ancestors,space&limit=${limit}&start=${start}`;
        }

        try {
            ctmLog(`[API] fetchAllPagesInSpace page ${iteration}: start=${start}, limit=${limit}, mode=${useFallback ? 'fallback' : 'cql'}`);
            const response = await fetchJson<SpacePagesResponse>(url);

            if (response.results?.length) {
                // Map raw response into PageWithAncestors (fill required fields with defaults
                // since `/space/{key}/content` and `/content/search` return slightly different shapes).
                // Client-side filter: skip drafts/archived pages (safety net for Confluence
                // Cloud or newer Server versions that may return them). Server 8.5 CQL
                // already excludes drafts, but this protects against edge cases.
                for (const r of response.results) {
                    const pageStatus = r.status || 'current';
                    if (pageStatus !== 'current') {
                        ctmLog(`[API] fetchAllPagesInSpace: skipping ${r.id} "${r.title}" (status=${pageStatus})`);
                        continue;
                    }
                    pages.push({
                        ...r,
                        type: r.type || 'page',
                        status: pageStatus,
                    } as PageWithAncestors);
                }
                onProgress?.(pages.length);
            }

            hasMore = response.results?.length === limit;
            start += limit;

            ctmLog(`[API] fetchAllPagesInSpace progress: ${pages.length} pages loaded (this batch: ${response.results?.length || 0})`);
        } catch (error) {
            if (!useFallback && (error as Error).message?.includes('400')) {
                ctmWarn('[API] CQL search failed with 400, trying fallback endpoint');
                useFallback = true;
                // Retry with fallback (don't advance start, try same page)
                continue;
            }
            ctmError('[API] fetchAllPagesInSpace failed at iteration', iteration, ':', error);
            throw error;
        }
    }

    ctmLog(`[API] fetchAllPagesInSpace DONE: ${pages.length} total pages loaded in ${iteration} iterations`);
    return pages;
}
