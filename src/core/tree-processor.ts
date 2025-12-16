import { fetchPage, fetchChildren, fetchPageWithContent } from '@/api/confluence';
import type { PageTreeNode, PageContentData, ConfluenceAncestor } from '@/api/types';
import { BATCH_SIZE, DEBUG } from '@/config';

export type StatusCallback = (message: string) => void;

/** Build page hierarchy tree recursively */
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
        onStatus?.(`Collecting hierarchy: ${counter} pages... (ID: ${pageId})`);

        try {
            const pageInfo = await fetchPage(pageId);
            const children = await fetchChildren(pageId);

            const childNodes: PageTreeNode[] = [];
            for (const child of children) {
                const childNode = await processNode(child.id, level + 1, pageId);
                childNodes.push(childNode);
            }

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
