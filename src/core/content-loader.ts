import { fetchPageWithContent } from '@/api/confluence';
import type { PageContentData } from '@/api/types';
import type { ExportSettings } from '@/storage/types';
import { MAX_CONCURRENCY, DEBUG } from '@/config';
import { runWithConcurrency } from '@/utils/queue';
import { sanitizeHtml } from './converter';

export type ProgressCallback = (completed: number, total: number, phase: string) => void;

/** Fetch content for multiple pages with concurrency pool */
export async function fetchPagesContent(
    pageIds: string[],
    settings: ExportSettings,
    onProgress?: ProgressCallback
): Promise<PageContentData[]> {
    const sanitizeOptions = {
        includeImages: settings.includeImages,
        includeComments: settings.includeComments,
    };

    const fetchSingle = async (pageId: string): Promise<PageContentData> => {
        try {
            const page = await fetchPageWithContent(pageId);

            return {
                id: page.id,
                title: page.title,
                htmlContent: sanitizeHtml(page.body.view.value, sanitizeOptions, pageId),
                ancestors: page.ancestors || [],
                version: page.version,
                error: false,
            };
        } catch (error) {
            if (DEBUG) console.error(`Error fetching content for ${pageId}:`, error);

            return {
                id: pageId,
                title: `Error loading: ${pageId}`,
                htmlContent: '',
                ancestors: [],
                error: true,
            };
        }
    };

    const results = await runWithConcurrency(pageIds, fetchSingle, {
        concurrency: MAX_CONCURRENCY,
        onProgress: (completed, total) => {
            onProgress?.(completed, total, 'content');
        },
    });

    return results;
}
