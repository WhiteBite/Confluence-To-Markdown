import { fetchPage, fetchChildren } from '@/api/confluence';
import type { PageTreeNode } from '@/api/types';
import { DEBUG } from '@/config';
import { runWithConcurrency } from '@/utils/queue';

export type StatusCallback = (message: string) => void;

/** Concurrency for tree building */
const TREE_CONCURRENCY = 8;

/** Build page hierarchy tree with parallel fetching */
export async function buildPageTree(
    rootPageId: string,
    onStatus?: StatusCallback
): Promise<PageTreeNode> {
    const processedIds = new Set<string>();
    let counter = 0;

    async function processNode(
        pageId: string,
        level: number,
        parentId: string | null
    ): Promise<PageTreeNode> {
        if (processedIds.has(pageId)) {
            return { id: pageId, title: '[Duplicate]', level, parentId, children: [], error: true };
        }
        processedIds.add(pageId);
        counter++;
        onStatus?.(`Scanning: ${counter} pages found...`);

        try {
            // Fetch page info and children in parallel
            const [pageInfo, children] = await Promise.all([
                fetchPage(pageId),
                fetchChildren(pageId),
            ]);

            // Process children in parallel with concurrency limit
            const childNodes = await runWithConcurrency(
                children,
                async (child) => processNode(child.id, level + 1, pageId),
                { concurrency: TREE_CONCURRENCY }
            );

            return {
                id: pageId,
                title: pageInfo.title,
                level,
                parentId,
                children: childNodes,
                error: false,
            };
        } catch (error) {
            if (DEBUG) console.error(`Error fetching page ${pageId}:`, error);
            return {
                id: pageId,
                title: `Error loading (${pageId})`,
                level,
                parentId,
                children: [],
                error: true,
            };
        }
    }

    return processNode(rootPageId, 0, null);
}

/** Flatten tree to array for lookup */
export function flattenTree(node: PageTreeNode): PageTreeNode[] {
    const result: PageTreeNode[] = [node];
    for (const child of node.children) {
        result.push(...flattenTree(child));
    }
    return result;
}

/** Find node in tree by ID */
export function findInTree(node: PageTreeNode, pageId: string): PageTreeNode | null {
    if (node.id === pageId) return node;
    for (const child of node.children) {
        const found = findInTree(child, pageId);
        if (found) return found;
    }
    return null;
}
