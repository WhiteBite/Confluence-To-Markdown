/**
 * Tree management functions for export modal
 * @module ui/modal/handlers/tree
 */

import type { PageTreeNode } from '@/api/types';
import { updateCopyButtonState } from './settings';

// ============================================================================
// Tree Functions
// ============================================================================

/**
 * Get selected page IDs from modal
 */
export function getSelectedIds(element: HTMLElement): string[] {
    const ids: string[] = [];
    element.querySelectorAll<HTMLInputElement>('.md-tree-checkbox:checked').forEach((cb) => {
        const li = cb.closest('li');
        if (cb.dataset.pageId && !li?.classList.contains('hidden')) {
            ids.push(cb.dataset.pageId);
        }
    });
    return ids;
}

/**
 * Update selection counter display
 */
export function updateSelectionCount(element: HTMLElement): void {
    const checkboxes = element.querySelectorAll<HTMLInputElement>('.md-tree-checkbox:checked');
    let count = 0;
    checkboxes.forEach((cb) => {
        if (!cb.closest('li')?.classList.contains('hidden')) count++;
    });

    const counter = element.querySelector('#md-selection-count');
    if (counter) {
        counter.textContent = `${count} selected`;
    }

    const badge = element.querySelector('#md-download-badge');
    if (badge) {
        badge.textContent = String(count);
        badge.classList.toggle('has-count', count > 0);
    }

    // Update Copy button state
    updateCopyButtonState(element);
}

/**
 * Count total nodes in tree
 */
export function countNodes(node: PageTreeNode): number {
    let count = 1;
    for (const child of node.children) {
        count += countNodes(child);
    }
    return count;
}

/**
 * Filter tree by search query
 */
export function filterTree(element: HTMLElement, query: string): void {
    const items = element.querySelectorAll('.md-tree li');

    if (!query) {
        items.forEach((li) => {
            li.classList.remove('hidden', 'highlight');
        });
        return;
    }

    items.forEach((li) => {
        const label = li.querySelector('.md-tree-label')?.textContent?.toLowerCase() || '';
        const matches = label.includes(query);

        if (matches) {
            li.classList.remove('hidden');
            li.classList.add('highlight');
            // Show all parents
            let parent = li.parentElement?.closest('li');
            while (parent) {
                parent.classList.remove('hidden');
                const ul = parent.querySelector(':scope > ul');
                ul?.classList.remove('collapsed');
                parent.querySelector('.md-tree-toggler')?.classList.add('expanded');
                parent = parent.parentElement?.closest('li');
            }
        } else {
            li.classList.add('hidden');
            li.classList.remove('highlight');
        }
    });

    // Show items that have visible children
    items.forEach((li) => {
        if (li.classList.contains('hidden')) {
            const hasVisibleChild = li.querySelector('li:not(.hidden)');
            if (hasVisibleChild) {
                li.classList.remove('hidden');
            }
        }
    });
}

/**
 * Apply filter to tree items
 */
export function applyFilter(element: HTMLElement, filter: string): void {
    const items = element.querySelectorAll('.md-tree li');
    items.forEach(li => {
        const hasError = li.querySelector('.md-error-badge') !== null;
        const checkbox = li.querySelector<HTMLInputElement>('.md-tree-checkbox');
        const isSelected = checkbox?.checked ?? false;

        if (filter === 'all') {
            li.classList.remove('hidden');
        } else if (filter === 'errors') {
            li.classList.toggle('hidden', !hasError);
            // Show parents of error items
            if (hasError) {
                let parent = li.parentElement?.closest('li');
                while (parent) {
                    parent.classList.remove('hidden');
                    parent = parent.parentElement?.closest('li');
                }
            }
        } else if (filter === 'selected') {
            li.classList.toggle('hidden', !isSelected);
            // Show parents of selected items
            if (isSelected) {
                let parent = li.parentElement?.closest('li');
                while (parent) {
                    parent.classList.remove('hidden');
                    parent = parent.parentElement?.closest('li');
                }
            }
        }
    });
}
