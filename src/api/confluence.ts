import { PAGE_LIMIT, EXPAND_CONTENT } from '@/config';
import { withRetry } from '@/utils/queue';
import { IS_TAMPERMONKEY } from '@/utils/env';
import type {
    ConfluencePage,
    ConfluencePageWithContent,
    ConfluencePaginatedResponse,
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
function fetchJson<T>(url: string): Promise<T> {
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
            console.error('[API] CQL search failed:', error);
            throw error;
        }
    }

    return descendants;
}
