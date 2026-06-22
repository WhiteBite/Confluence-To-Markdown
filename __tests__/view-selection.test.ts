/**
 * Tests for getSelectedIds, getVisibleSelectedIds, and updateSelectionCount.
 *
 * Core bug regression: getSelectedIds must return ALL checked pages regardless
 * of whether their <li> element has the "hidden" class. The "hidden" class is
 * applied by search/filter and should only affect UI display, not the export set.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi } from 'vitest';

// Mock modules with side effects / DOM globals that aren't relevant to these functions
vi.mock('@/ui/i18n', () => ({
    t: (key: string) => key,
    getLocale: () => 'en',
    toggleLocale: () => 'en',
}));

vi.mock('@/core/attachment-filter', () => ({
    POPULAR_EXTENSIONS: [],
    parseAttachmentFilter: () => new Set<string>(),
}));

import { getSelectedIds, getVisibleSelectedIds, updateSelectionCount } from '@/ui/modal/view';

// ============================================================================
// DOM helpers
// ============================================================================

interface PageSpec {
    id: string;
    checked: boolean;
    hidden?: boolean;
}

/** Build a minimal tree DOM for testing selection functions */
function buildTreeDOM(pages: PageSpec[]): HTMLElement {
    const container = document.createElement('div');
    const ul = document.createElement('ul');
    ul.className = 'md-tree';

    for (const page of pages) {
        const li = document.createElement('li');
        if (page.hidden) li.classList.add('hidden');

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'md-tree-checkbox';
        cb.dataset.pageId = page.id;
        cb.checked = page.checked;

        li.appendChild(cb);
        ul.appendChild(li);
    }

    container.appendChild(ul);
    return container;
}

/** Build a minimal modal DOM for testing updateSelectionCount */
function buildModalDOM(pages: PageSpec[], searchValue = '', activeFilter = 'all'): HTMLElement {
    const modal = document.createElement('div');

    // Tree
    modal.appendChild(buildTreeDOM(pages));

    // Search input
    const searchInput = document.createElement('input');
    searchInput.id = 'md-search-input';
    searchInput.value = searchValue;
    modal.appendChild(searchInput);

    // Filter tabs
    for (const f of ['all', 'selected', 'errors']) {
        const btn = document.createElement('button');
        btn.className = 'md-filter-tab';
        btn.dataset.filter = f;
        if (f === activeFilter) btn.classList.add('active');
        modal.appendChild(btn);
    }

    // Download badge
    const badge = document.createElement('span');
    badge.id = 'md-download-badge';
    modal.appendChild(badge);

    // Selection hint
    const hint = document.createElement('span');
    hint.id = 'md-selection-hint';
    modal.appendChild(hint);

    // Action buttons
    for (const action of ['copy', 'download', 'pdf']) {
        const btn = document.createElement('button');
        btn.dataset.action = action;
        modal.appendChild(btn);
    }

    // Stat pages (in a parent element for label updates)
    const statParent = document.createElement('span');
    statParent.className = 'md-status-item';
    const statSpan = document.createElement('span');
    statSpan.id = 'stat-pages';
    statParent.appendChild(statSpan);
    modal.appendChild(statParent);

    return modal;
}

// ============================================================================
// getSelectedIds
// ============================================================================

describe('getSelectedIds', () => {
    it('returns all checked page IDs regardless of hidden state', () => {
        const dom = buildTreeDOM([
            { id: 'p1', checked: true },
            { id: 'p2', checked: true, hidden: true },
            { id: 'p3', checked: false },
        ]);

        expect(getSelectedIds(dom)).toEqual(['p1', 'p2']);
    });

    it('includes hidden checked items (core bug regression)', () => {
        const dom = buildTreeDOM([
            { id: 'h1', checked: true, hidden: true },
            { id: 'h2', checked: true, hidden: true },
        ]);

        const ids = getSelectedIds(dom);
        expect(ids).toHaveLength(2);
        expect(ids).toContain('h1');
        expect(ids).toContain('h2');
    });

    it('returns empty array when nothing is checked', () => {
        const dom = buildTreeDOM([
            { id: 'p1', checked: false },
            { id: 'p2', checked: false, hidden: true },
        ]);

        expect(getSelectedIds(dom)).toEqual([]);
    });

    it('returns empty array for empty tree', () => {
        const dom = buildTreeDOM([]);
        expect(getSelectedIds(dom)).toEqual([]);
    });
});

// ============================================================================
// getVisibleSelectedIds
// ============================================================================

describe('getVisibleSelectedIds', () => {
    it('excludes checked items inside hidden list elements', () => {
        const dom = buildTreeDOM([
            { id: 'p1', checked: true },
            { id: 'p2', checked: true, hidden: true },
            { id: 'p3', checked: false },
        ]);

        expect(getVisibleSelectedIds(dom)).toEqual(['p1']);
    });

    it('returns empty array when all checked items are hidden', () => {
        const dom = buildTreeDOM([
            { id: 'p1', checked: true, hidden: true },
            { id: 'p2', checked: true, hidden: true },
        ]);

        expect(getVisibleSelectedIds(dom)).toEqual([]);
    });

    it('returns all checked items when nothing is hidden', () => {
        const dom = buildTreeDOM([
            { id: 'p1', checked: true },
            { id: 'p2', checked: true },
            { id: 'p3', checked: false },
        ]);

        expect(getVisibleSelectedIds(dom)).toEqual(['p1', 'p2']);
    });
});

// ============================================================================
// getSelectedIds vs getVisibleSelectedIds
// ============================================================================

describe('getSelectedIds vs getVisibleSelectedIds', () => {
    it('both return identical results when no items are hidden', () => {
        const dom = buildTreeDOM([
            { id: 'a', checked: true },
            { id: 'b', checked: true },
            { id: 'c', checked: false },
        ]);

        expect(getSelectedIds(dom)).toEqual(getVisibleSelectedIds(dom));
    });

    it('getSelectedIds returns more items when hidden checked items exist', () => {
        const dom = buildTreeDOM([
            { id: 'visible', checked: true },
            { id: 'hidden-selected', checked: true, hidden: true },
        ]);

        expect(getSelectedIds(dom)).toHaveLength(2);
        expect(getVisibleSelectedIds(dom)).toHaveLength(1);
    });
});

// ============================================================================
// updateSelectionCount
// ============================================================================

describe('updateSelectionCount', () => {
    it('shows warning when search is active and hidden checked items exist', () => {
        const modal = buildModalDOM(
            [
                { id: 'p1', checked: true },
                { id: 'p2', checked: true, hidden: true },
            ],
            'foo', // search active
            'all',
        );

        updateSelectionCount(modal);

        const hint = modal.querySelector('#md-selection-hint') as HTMLElement;
        expect(hint.textContent).toContain('⚠️');
        expect(hint.textContent).toContain('2'); // total selected count
        expect(hint.classList.contains('md-hint-warning')).toBe(true);
    });

    it('shows warning when filter tab is active (not "all") and hidden checked items exist', () => {
        const modal = buildModalDOM(
            [
                { id: 'p1', checked: true },
                { id: 'p2', checked: true, hidden: true },
            ],
            '', // no search
            'selected', // filter tab active → items are hidden
        );

        updateSelectionCount(modal);

        const hint = modal.querySelector('#md-selection-hint') as HTMLElement;
        expect(hint.textContent).toContain('⚠️');
        expect(hint.classList.contains('md-hint-warning')).toBe(true);
    });

    it('does not show warning when search is active but all checked items are visible', () => {
        const modal = buildModalDOM(
            [
                { id: 'p1', checked: true },
                { id: 'p2', checked: true },
            ],
            'foo', // search active but nothing is hidden
            'all',
        );

        updateSelectionCount(modal);

        const hint = modal.querySelector('#md-selection-hint') as HTMLElement;
        expect(hint.textContent).not.toContain('⚠️');
        expect(hint.classList.contains('md-hint-warning')).toBe(false);
    });

    it('download badge shows total selected including hidden items', () => {
        const modal = buildModalDOM(
            [
                { id: 'p1', checked: true },
                { id: 'p2', checked: true, hidden: true },
                { id: 'p3', checked: false },
            ],
            'search',
            'all',
        );

        updateSelectionCount(modal);

        const badge = modal.querySelector('#md-download-badge') as HTMLElement;
        expect(badge.textContent).toBe('2');
    });

    it('action buttons are enabled when only hidden items are checked', () => {
        const modal = buildModalDOM(
            [{ id: 'p1', checked: true, hidden: true }],
            'foo',
            'all',
        );

        updateSelectionCount(modal);

        const downloadBtn = modal.querySelector('[data-action="download"]') as HTMLButtonElement;
        expect(downloadBtn.disabled).toBe(false);
    });

    it('action buttons are disabled when nothing is checked', () => {
        const modal = buildModalDOM(
            [
                { id: 'p1', checked: false },
                { id: 'p2', checked: false },
            ],
            '',
            'all',
        );

        updateSelectionCount(modal);

        const downloadBtn = modal.querySelector('[data-action="download"]') as HTMLButtonElement;
        expect(downloadBtn.disabled).toBe(true);
    });

    it('stat-pages shows visible selected count (not total)', () => {
        const modal = buildModalDOM(
            [
                { id: 'p1', checked: true },
                { id: 'p2', checked: true, hidden: true },
            ],
            'search',
            'all',
        );

        updateSelectionCount(modal);

        // Only p1 is visible; p2 is hidden
        const statPages = modal.querySelector('#stat-pages') as HTMLElement;
        expect(statPages.textContent).toBe('1');
    });
});
