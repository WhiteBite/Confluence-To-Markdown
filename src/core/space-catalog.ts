/**
 * Space Catalog — fetch a lightweight page catalog with versions.
 *
 * `fetchSpaceCatalogWithVersions` uses CQL search with
 * `expand=ancestors,version` and paginates by `_links.next`.
 * parentId = last ancestor id or null.
 *
 * Does NOT fetch body content — that's done selectively during apply.
 */

import { getBaseUrl, fetchJson } from '@/api/confluence';
import type { CatalogEntry } from './space-types';

// ============================================================================
// Public API
// ============================================================================

/**
 * Fetch all pages of a space with their version numbers and parent IDs.
 *
 * CQL: `space="KEY" AND type=page`, `expand=ancestors,version`.
 * Paginates by `_links.next` (avoids spurious extra requests).
 */
export async function fetchSpaceCatalogWithVersions(
    spaceKey: string,
    onProgress?: (count: number) => void
): Promise<CatalogEntry[]> {
    const baseUrl = getBaseUrl();
    const entries: CatalogEntry[] = [];
    let start = 0;
    const limit = 200;
    let hasMore = true;

    while (hasMore) {
        const cql = encodeURIComponent(`space="${spaceKey}" AND type=page`);
        const url =
            `${baseUrl}/rest/api/content/search?cql=${cql}` +
            `&expand=ancestors,version&limit=${limit}&start=${start}`;

        const response = await fetchJson<{
            results: Array<{
                id: string;
                title: string;
                status?: string;
                ancestors?: Array<{ id: string; title: string }>;
                version?: { number: number };
            }>;
            _links?: { next?: string };
        }>(url);

        for (const r of response.results) {
            // Client-side filter: skip non-current pages (safety net).
            if (r.status && r.status !== 'current') continue;

            const ancestors = r.ancestors ?? [];
            const parentId =
                ancestors.length > 0
                    ? ancestors[ancestors.length - 1].id
                    : null;

            entries.push({
                id: r.id,
                title: r.title,
                version: r.version?.number ?? 0,
                parentId,
            });
        }

        onProgress?.(entries.length);
        hasMore = !!response._links?.next;
        start += limit;
    }

    return entries;
}
