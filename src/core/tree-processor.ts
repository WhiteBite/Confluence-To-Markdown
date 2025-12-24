import { fetchPage, fetchChildren, fetchAllDescendants, type PageWithAncestors } from '@/api/confluence';
import type { PageTreeNode } from '@/api/types';
import { DEBUG } from '@/config';
import { runWithConcurrency } from '@/utils/queue';

export type StatusCallback = (message: string) => void;

/** Concurrency for tree building */
const TREE_CONCURRENCY = 8;

/** Build tree from flat list of descendants with ancestors */
function buildTreeFromDescendants(
    rootPage: { id: string; title: string },
    descendants: PageWithAncestors[]
): PageTreeNode {
    // Create map of all pages
    const pageMap = new Map<string, PageTreeNode>();

    // Add root
    const rootNode: PageTreeNode = {
        id: rootPage.id,
        title: rootPage.title,
        level: 0,
        parentId: null,
        children: [],
        error: false,
    };
    pageMap.set(rootPage.id, rootNode);

    // Add all descendants to map
    for (const page of descendants) {
        const ancestors = page.ancestors || [];
        // Find parent (last ancestor before this page)
        const parentId = ancestors.length > 0 ? ancestors[ancestors.length - 1].id : rootPage.id;

        // Calculate level based on ancestors after root
        const rootIndex = ancestors.findIndex(a => a.id === rootPage.id);
        const level = rootIndex >= 0 ? ancestors.length - rootIndex : 1;

        const node: PageTreeNode = {
            id: page.id,
            title: page.title,
            level,
            parentId,
            children: [],
            error: false,
        };
        pageMap.set(page.id, node);
    }

    // Build tree structure
    for (const page of descendants) {
        const node = pageMap.get(page.id);
        if (!node) continue;

        const parent = pageMap.get(node.parentId || rootPage.id);
        if (parent && parent.id !== node.id) {
            parent.children.push(node);
        }
    }

    // Sort children alphabetically
    function sortChildren(node: PageTreeNode): void {
        node.children.sort((a, b) => a.title.localeCompare(b.title));
        node.children.forEach(sortChildren);
    }
    sortChildren(rootNode);

    return rootNode;
}

/** Build page hierarchy tree using CQL (fast) or recursive (fallback) */
export async function buildPageTree(
    rootPageId: string,
    onStatus?: StatusCallback
): Promise<PageTreeNode> {
    onStatus?.('Loading page tree...');

    try {
        // Try CQL-based approach first (much faster)
        const [rootPage, descendants] = await Promise.all([
            fetchPage(rootPageId),
            fetchAllDescendants(rootPageId),
        ]);

        onStatus?.(`Found ${descendants.length + 1} pages`);

        if (DEBUG) {
            console.log(`[Tree] CQL found ${descendants.length} descendants`);
        }

        return buildTreeFromDescendants(
            { id: rootPage.id, title: rootPage.title },
            descendants
        );
    } catch (error) {
        // Fallback to recursive approach if CQL fails
        console.warn('[Tree] CQL search failed, falling back to recursive:', error);
        onStatus?.('Scanning pages (slow mode)...');
        return buildPageTreeRecursive(rootPageId, onStatus);
    }
}

/** Build page hierarchy tree with parallel fetching (legacy recursive approach) */
async function buildPageTreeRecursive(
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
