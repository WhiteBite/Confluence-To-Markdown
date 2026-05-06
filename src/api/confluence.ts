import { PAGE_LIMIT, EXPAND_CONTENT } from '@/config';
import { withRetry } from '@/utils/queue';
import { IS_TAMPERMONKEY } from '@/utils/env';
import { ctmError, ctmWarn } from '@/utils/logger';
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

/** Fetch JSON via GM_xmlhttpRequest (Tampermonkey) */
function gmFetch<T>(url: string): Promise<T> {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'GET',
            url,
            headers: { Accept: 'application/json' },
            onload(response) {
                if (response.status >= 200 && response.status < 300) {
                    try {
                        resolve(JSON.parse(response.responseText) as T);
                    } catch (e) {
                        reject(new Error(`JSON parse error: ${e}`));
                    }
                } else if (response.status === 429) {
                    reject(new Error('429 Rate Limited'));
                } else {
                    reject(new Error(`API error ${response.status}: ${response.statusText}`));
                }
            },
            onerror(response) {
                reject(new Error(`Network error: ${response.statusText || 'Unknown'}`));
            },
        });
    });
}

/** Fetch JSON via native fetch or chrome.runtime (Extension) */
async function browserFetch<T>(url: string): Promise<T> {
    // Try direct fetch first (same-origin)
    try {
        const response = await fetch(url, {
            credentials: 'include',
            headers: { Accept: 'application/json' },
        });

        if (response.ok) {
            return response.json();
        }

        if (response.status === 429) {
            throw new Error('429 Rate Limited');
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
        // If direct fetch fails and we're in extension, try via background script
        if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
            const result = await chrome.runtime.sendMessage({
                type: 'FETCH',
                url,
            });

            if (result.success) {
                return result.data as T;
            }

            if (result.status === 429) {
                throw new Error('429 Rate Limited');
            }

            throw new Error(result.error || 'Background fetch failed');
        }

        throw error;
    }
}

/** Universal fetch with retry */
export function fetchJson<T>(url: string): Promise<T> {
    return withRetry(async () => {
        if (IS_TAMPERMONKEY) {
            return gmFetch<T>(url);
        }
        return browserFetch<T>(url);
    });
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
        const cql = encodeURIComponent(`space="${spaceKey}" AND type=page AND status=current`);
        const url = `${baseUrl}/rest/api/content/search?cql=${cql}&expand=ancestors,version,metadata.labels,space&limit=${limit}&start=${start}`;

        try {
            const response = await fetchJson<CqlCatalogResponse>(url);

            if (response.results?.length) {
                for (const r of response.results) {
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
        space?: { key: string };
        ancestors?: Array<{ id: string; title: string }>;
    }>;
    start: number;
    limit: number;
    size: number;
    _links?: { next?: string };
}

export async function fetchAllPagesInSpace(spaceKey: string): Promise<PageWithAncestors[]> {
    const baseUrl = getBaseUrl();
    const pages: PageWithAncestors[] = [];
    let start = 0;
    const limit = 200;
    let hasMore = true;
    let useFallback = false;

    while (hasMore) {
        let url: string;
        
        if (!useFallback) {
            // Try CQL search first (Confluence Cloud and newer Server)
            const cql = encodeURIComponent(`space="${spaceKey}" AND type=page`);
            url = `${baseUrl}/rest/api/content/search?cql=${cql}&expand=ancestors,space&limit=${limit}&start=${start}`;
        } else {
            // Fallback: use space content endpoint (older Confluence Server)
            url = `${baseUrl}/rest/api/space/${spaceKey}/content?type=page&expand=ancestors,space&limit=${limit}&start=${start}`;
        }

        try {
            const response = await fetchJson<SpacePagesResponse>(url);

            if (response.results?.length) {
                pages.push(...response.results);
            }

            hasMore = response.results?.length === limit;
            start += limit;
        } catch (error) {
            if (!useFallback && (error as Error).message?.includes('400')) {
                ctmWarn('[API] CQL search failed with 400, trying fallback endpoint');
                useFallback = true;
                // Retry with fallback (don't advance start, try same page)
                continue;
            }
            ctmError('[API] fetchAllPagesInSpace failed:', error);
            throw error;
        }
    }

    return pages;
}
