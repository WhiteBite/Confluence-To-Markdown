import type { PageTreeNode } from '@/api/types';
import type { ExportSettings } from '@/storage/types';
import { loadSettings, saveSettings } from '@/storage/storage';

// SVG Icons
const ICONS = {
    chevron: `<svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`,
    folder: `<svg viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>`,
    page: `<svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`,
    download: `<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`,
    copy: `<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`,
    refresh: `<svg viewBox="0 0 24 24"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`,
    settings: `<svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>`,
    check: `<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`,
    search: `<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`,
    close: `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
};

export interface ModalResult {
    selectedIds: string[];
    cancelled: boolean;
    action: 'download' | 'copy' | 'pdf' | 'cancel';
    settings: ExportSettings;
}

export interface ModalOptions {
    onRefresh: () => Promise<PageTreeNode>;
}

let modalElement: HTMLElement | null = null;
let currentSettings: ExportSettings;
let resolveModal: ((result: ModalResult) => void) | null = null;

/** Close modal with cancel result */
function cancelModal(): void {
    if (modalElement && resolveModal) {
        modalElement.remove();
        modalElement = null;
        resolveModal({ selectedIds: [], cancelled: true, action: 'cancel', settings: currentSettings });
        resolveModal = null;
    }
}

/** Show page selector modal */
export function showPageSelectorModal(
    rootNode: PageTreeNode,
    rootTitle: string,
    options: ModalOptions
): Promise<ModalResult> {
    return new Promise((resolve) => {
        resolveModal = resolve;
        currentSettings = loadSettings();

        const modal = document.createElement('div');
        modal.id = 'md-export-modal';
        modalElement = modal;

        const totalPages = countNodes(rootNode);

        modal.innerHTML = `
      <div id="md-export-modal-content" class="md-modal-content">
        <div class="md-modal-header">
          <div class="md-header-row">
            <div class="md-header-title">
              <h3>Export to Markdown</h3>
              <button class="md-btn-icon" data-action="refresh" title="Refresh page tree (re-scan)">
                ${ICONS.refresh}
              </button>
            </div>
            <button class="md-btn-icon md-close-btn" data-action="cancel" title="Close (Esc)">
              ${ICONS.close}
            </button>
          </div>
          <p class="subtitle">
            ${ICONS.folder.replace('<svg', '<svg class="icon"')}
            <span>${escapeHtml(rootTitle)}</span>
            <span class="md-page-count">${totalPages} pages</span>
          </p>
        </div>
        
        <!-- Search -->
        <div class="md-search-bar">
          <span class="md-search-icon">${ICONS.search}</span>
          <input type="text" id="md-search-input" placeholder="Search pages..." autocomplete="off">
          <button class="md-search-clear" id="md-search-clear" style="display:none">${ICONS.close}</button>
        </div>
        
        <div class="md-controls">
          <button class="md-btn md-btn-secondary md-btn-sm" data-action="expand" title="Expand all branches">Expand</button>
          <button class="md-btn md-btn-secondary md-btn-sm" data-action="collapse" title="Collapse all branches">Collapse</button>
          <div class="md-controls-divider"></div>
          <button class="md-btn md-btn-secondary md-btn-sm" data-action="select-all" title="Select all pages">All</button>
          <button class="md-btn md-btn-secondary md-btn-sm" data-action="deselect-all" title="Deselect all pages">None</button>
          <button class="md-btn md-btn-secondary md-btn-sm" data-action="invert" title="Invert selection">Invert</button>
          <span class="md-selection-count" id="md-selection-count">0 selected</span>
        </div>
        
        <div class="md-tree-container" id="md-tree-container">
          <div class="md-tree" id="md-tree-root">${buildTreeHtml([rootNode])}</div>
        </div>
        
        <!-- Settings Panel -->
        <div class="md-settings-panel">
          <button class="md-settings-toggle" data-action="toggle-settings">
            ${ICONS.settings}
            <span>Export Settings</span>
            <span class="md-chevron">${ICONS.chevron}</span>
          </button>
          <div class="md-settings-content" id="md-settings-content" style="display: none;">
            <label class="md-checkbox-label">
              <input type="checkbox" id="setting-images" ${currentSettings.includeImages ? 'checked' : ''}>
              <span>Include images</span>
            </label>
            <label class="md-checkbox-label">
              <input type="checkbox" id="setting-metadata" ${currentSettings.includeMetadata ? 'checked' : ''}>
              <span>Include metadata (author, date)</span>
            </label>
            <label class="md-checkbox-label">
              <input type="checkbox" id="setting-comments" ${currentSettings.includeComments ? 'checked' : ''}>
              <span>Include user comments</span>
            </label>
            <label class="md-checkbox-label">
              <input type="checkbox" id="setting-links" ${currentSettings.includeSourceLinks ? 'checked' : ''}>
              <span>Include source links</span>
            </label>
          </div>
        </div>
        
        <div class="md-progress-section" id="md-progress-section" style="display: none;">
          <div class="md-progress-label">
            <span id="md-progress-text">Preparing...</span>
            <span id="md-progress-count"></span>
          </div>
          <div class="md-progress-bar">
            <div class="md-progress-fill" id="md-progress-fill"></div>
          </div>
        </div>
        
        <!-- Toast notification -->
        <div class="md-toast" id="md-toast" style="display: none;">
          ${ICONS.check}
          <span>Copied to clipboard!</span>
        </div>
        
        <div class="md-modal-footer">
          <div class="md-footer-left">
            <span class="md-hint">Esc to close</span>
          </div>
          <div class="md-footer-right">
            <button class="md-btn md-btn-secondary" data-action="copy" id="md-copy-btn" title="Copy Markdown to clipboard">
              ${ICONS.copy}
              <span>Copy</span>
            </button>
            <button class="md-btn md-btn-secondary" data-action="pdf" id="md-pdf-btn" title="Open print preview for PDF">
              <span>📄 PDF</span>
            </button>
            <button class="md-btn md-btn-primary" data-action="download" id="md-download-btn" title="Download as .md file">
              ${ICONS.download}
              <span>Download</span>
              <span class="md-btn-badge" id="md-download-badge">0</span>
            </button>
          </div>
        </div>
      </div>
    `;

        document.body.appendChild(modal);
        updateSelectionCount(modal);

        // Focus search input
        setTimeout(() => {
            const searchInput = modal.querySelector('#md-search-input') as HTMLInputElement;
            searchInput?.focus();
        }, 100);

        // ESC key handler
        const escHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                cancelModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        // Backdrop click handler
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                cancelModal();
                document.removeEventListener('keydown', escHandler);
            }
        });

        // Search functionality
        const searchInput = modal.querySelector('#md-search-input') as HTMLInputElement;
        const searchClear = modal.querySelector('#md-search-clear') as HTMLElement;

        searchInput?.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            searchClear.style.display = query ? 'flex' : 'none';
            filterTree(modal, query);
        });

        searchClear?.addEventListener('click', () => {
            searchInput.value = '';
            searchClear.style.display = 'none';
            filterTree(modal, '');
            searchInput.focus();
        });

        // Event delegation for buttons
        modal.addEventListener('click', async (e) => {
            const target = e.target as HTMLElement;
            const btn = target.closest('[data-action]') as HTMLElement;
            if (!btn) return;

            const action = btn.dataset.action;

            if (action === 'cancel') {
                cancelModal();
                document.removeEventListener('keydown', escHandler);
                return;
            }

            if (action === 'download' || action === 'copy' || action === 'pdf') {
                const selectedIds = getSelectedIds(modal);
                if (selectedIds.length === 0) {
                    shakeElement(modal.querySelector('.md-selection-count'));
                    return;
                }
                saveCurrentSettings(modal);
                disableModalInteraction(modal);
                document.removeEventListener('keydown', escHandler);
                resolve({
                    selectedIds,
                    cancelled: false,
                    action: action as 'download' | 'copy' | 'pdf',
                    settings: currentSettings,
                });
                return;
            }

            if (action === 'refresh') {
                const refreshBtn = btn;
                refreshBtn.classList.add('spinning');
                try {
                    const newTree = await options.onRefresh();
                    const treeRoot = modal.querySelector('#md-tree-root');
                    if (treeRoot) {
                        treeRoot.innerHTML = buildTreeHtml([newTree]);
                    }
                    // Update page count
                    const pageCount = modal.querySelector('.md-page-count');
                    if (pageCount) {
                        pageCount.textContent = `${countNodes(newTree)} pages`;
                    }
                    updateSelectionCount(modal);
                } finally {
                    refreshBtn.classList.remove('spinning');
                }
                return;
            }

            if (action === 'toggle-settings') {
                const content = modal.querySelector('#md-settings-content') as HTMLElement;
                const chevron = btn.querySelector('.md-chevron') as HTMLElement;
                if (content) {
                    const isHidden = content.style.display === 'none';
                    content.style.display = isHidden ? 'block' : 'none';
                    chevron?.classList.toggle('expanded', isHidden);
                }
                return;
            }

            if (action === 'expand') {
                modal.querySelectorAll('.md-tree ul').forEach((ul) => ul.classList.remove('collapsed'));
                modal.querySelectorAll('.md-tree-toggler').forEach((t) => t.classList.add('expanded'));
                return;
            }

            if (action === 'collapse') {
                modal.querySelectorAll('.md-tree ul ul').forEach((ul) => ul.classList.add('collapsed'));
                modal.querySelectorAll('.md-tree-toggler').forEach((t) => {
                    if (!t.classList.contains('empty')) t.classList.remove('expanded');
                });
                return;
            }

            if (action === 'select-all') {
                modal.querySelectorAll<HTMLInputElement>('.md-tree-checkbox').forEach((cb) => {
                    if (!cb.closest('li')?.classList.contains('hidden')) cb.checked = true;
                });
                updateSelectionCount(modal);
                return;
            }

            if (action === 'deselect-all') {
                modal.querySelectorAll<HTMLInputElement>('.md-tree-checkbox').forEach((cb) => (cb.checked = false));
                updateSelectionCount(modal);
                return;
            }

            if (action === 'invert') {
                modal.querySelectorAll<HTMLInputElement>('.md-tree-checkbox').forEach((cb) => {
                    if (!cb.closest('li')?.classList.contains('hidden')) cb.checked = !cb.checked;
                });
                updateSelectionCount(modal);
                return;
            }
        });

        // Tree item click handling
        modal.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;

            if (target.closest('.md-tree-toggler')) {
                const toggler = target.closest('.md-tree-toggler') as HTMLElement;
                if (toggler.classList.contains('empty')) return;

                const li = toggler.closest('li');
                const childUl = li?.querySelector(':scope > ul');
                if (childUl) {
                    childUl.classList.toggle('collapsed');
                    toggler.classList.toggle('expanded');
                }
                return;
            }

            const treeItem = target.closest('.md-tree-item') as HTMLElement;
            if (treeItem && !target.closest('.md-tree-checkbox') && !target.closest('.md-tree-toggler')) {
                const checkbox = treeItem.querySelector<HTMLInputElement>('.md-tree-checkbox');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        });

        // Checkbox change - cascade to children
        modal.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            if (!target.classList.contains('md-tree-checkbox')) return;

            const isChecked = target.checked;
            const li = target.closest('li');

            li?.querySelectorAll<HTMLInputElement>(':scope > ul .md-tree-checkbox').forEach((cb) => {
                cb.checked = isChecked;
            });

            if (isChecked) {
                let parent = li?.parentElement?.closest('li');
                while (parent) {
                    const parentCb = parent.querySelector<HTMLInputElement>(':scope > .md-tree-item .md-tree-checkbox');
                    if (parentCb) parentCb.checked = true;
                    parent = parent.parentElement?.closest('li');
                }
            }

            updateSelectionCount(modal);
        });
    });
}

/** Filter tree by search query */
function filterTree(modal: HTMLElement, query: string): void {
    const items = modal.querySelectorAll('.md-tree li');

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

/** Shake element animation */
function shakeElement(el: Element | null): void {
    if (!el) return;
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 500);
}

/** Count total nodes in tree */
function countNodes(node: PageTreeNode): number {
    let count = 1;
    for (const child of node.children) {
        count += countNodes(child);
    }
    return count;
}


/** Update progress bar in modal */
export function updateModalProgress(completed: number, total: number, phase: string): void {
    if (!modalElement) return;

    const section = modalElement.querySelector('#md-progress-section') as HTMLElement;
    const text = modalElement.querySelector('#md-progress-text') as HTMLElement;
    const count = modalElement.querySelector('#md-progress-count') as HTMLElement;
    const fill = modalElement.querySelector('#md-progress-fill') as HTMLElement;

    if (!section || !text || !fill) return;

    section.style.display = 'block';

    const phaseLabels: Record<string, string> = {
        tree: 'Scanning page tree...',
        content: 'Loading page content...',
        convert: 'Converting to Markdown...',
    };

    text.textContent = phaseLabels[phase] || phase;

    if (total > 0) {
        count.textContent = `${completed}/${total}`;
        const percent = Math.round((completed / total) * 100);
        fill.style.width = `${percent}%`;
        fill.classList.remove('indeterminate');
    } else {
        count.textContent = '';
        fill.classList.add('indeterminate');
    }
}

/** Show toast notification */
export function showToast(message?: string): void {
    if (!modalElement) return;

    const toast = modalElement.querySelector('#md-toast') as HTMLElement;
    if (!toast) return;

    if (message) {
        const span = toast.querySelector('span');
        if (span) span.textContent = message;
    }

    toast.style.display = 'flex';
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.style.display = 'none';
        }, 300);
    }, 2000);
}

/** Close modal */
export function closeModal(): void {
    if (modalElement) {
        modalElement.remove();
        modalElement = null;
        resolveModal = null;
    }
}

/** Re-enable modal after operation */
export function enableModal(): void {
    if (!modalElement) return;

    const downloadBtn = modalElement.querySelector('#md-download-btn') as HTMLButtonElement;
    const copyBtn = modalElement.querySelector('#md-copy-btn') as HTMLButtonElement;
    const pdfBtn = modalElement.querySelector('#md-pdf-btn') as HTMLButtonElement;

    if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = `${ICONS.download}<span>Download</span><span class="md-btn-badge" id="md-download-badge">0</span>`;
    }

    if (copyBtn) {
        copyBtn.disabled = false;
        copyBtn.innerHTML = `${ICONS.copy}<span>Copy</span>`;
    }

    if (pdfBtn) {
        pdfBtn.disabled = false;
    }

    modalElement.querySelectorAll<HTMLButtonElement>('.md-controls button').forEach((btn) => {
        btn.disabled = false;
    });

    modalElement.querySelectorAll<HTMLInputElement>('.md-tree-checkbox').forEach((cb) => {
        cb.disabled = false;
    });

    const progressSection = modalElement.querySelector('#md-progress-section') as HTMLElement;
    if (progressSection) {
        progressSection.style.display = 'none';
    }

    updateSelectionCount(modalElement);
}

/** Save current settings from modal */
function saveCurrentSettings(modal: HTMLElement): void {
    currentSettings = {
        includeImages: (modal.querySelector('#setting-images') as HTMLInputElement)?.checked ?? true,
        includeMetadata: (modal.querySelector('#setting-metadata') as HTMLInputElement)?.checked ?? true,
        includeComments: (modal.querySelector('#setting-comments') as HTMLInputElement)?.checked ?? false,
        includeSourceLinks: (modal.querySelector('#setting-links') as HTMLInputElement)?.checked ?? true,
    };
    saveSettings(currentSettings);
}

/** Disable modal interaction during export */
function disableModalInteraction(modal: HTMLElement): void {
    const downloadBtn = modal.querySelector('#md-download-btn') as HTMLButtonElement;
    const copyBtn = modal.querySelector('#md-copy-btn') as HTMLButtonElement;
    const pdfBtn = modal.querySelector('#md-pdf-btn') as HTMLButtonElement;

    if (downloadBtn) {
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = `<span>Processing...</span>`;
    }

    if (copyBtn) copyBtn.disabled = true;
    if (pdfBtn) pdfBtn.disabled = true;

    modal.querySelectorAll<HTMLButtonElement>('.md-controls button').forEach((btn) => {
        btn.disabled = true;
    });

    modal.querySelectorAll<HTMLInputElement>('.md-tree-checkbox').forEach((cb) => {
        cb.disabled = true;
    });
}

/** Build tree HTML recursively */
function buildTreeHtml(nodes: PageTreeNode[], level = 0): string {
    let html = `<ul${level === 0 ? '' : ''}>`;

    for (const node of nodes) {
        const hasChildren = node.children.length > 0;
        const childCount = hasChildren ? countNodes(node) - 1 : 0;
        const errorClass = node.error ? ' error' : '';
        const togglerClass = hasChildren ? 'md-tree-toggler expanded' : 'md-tree-toggler empty';
        const iconClass = hasChildren ? 'md-tree-icon folder' : 'md-tree-icon page';
        const icon = hasChildren ? ICONS.folder : ICONS.page;

        html += `<li data-page-id="${node.id}" data-level="${level}">`;
        html += `<div class="md-tree-item" data-level="${level}">`;
        html += `<span class="${togglerClass}">${ICONS.chevron}</span>`;
        html += `<input type="checkbox" class="md-tree-checkbox" data-page-id="${node.id}" checked>`;
        html += `<span class="${iconClass}">${icon}</span>`;
        html += `<span class="md-tree-label${errorClass}">${escapeHtml(node.title)}</span>`;
        if (hasChildren) {
            html += `<span class="md-child-count">${childCount}</span>`;
        }
        if (node.error) {
            html += `<span class="md-error-badge">Error</span>`;
        }
        html += `</div>`;

        if (hasChildren) {
            html += buildTreeHtml(node.children, level + 1);
        }

        html += '</li>';
    }

    html += '</ul>';
    return html;
}

/** Get selected page IDs from modal */
function getSelectedIds(modal: HTMLElement): string[] {
    const ids: string[] = [];
    modal.querySelectorAll<HTMLInputElement>('.md-tree-checkbox:checked').forEach((cb) => {
        const li = cb.closest('li');
        if (cb.dataset.pageId && !li?.classList.contains('hidden')) {
            ids.push(cb.dataset.pageId);
        }
    });
    return ids;
}

/** Update selection counter */
function updateSelectionCount(modal: HTMLElement): void {
    const checkboxes = modal.querySelectorAll<HTMLInputElement>('.md-tree-checkbox:checked');
    let count = 0;
    checkboxes.forEach((cb) => {
        if (!cb.closest('li')?.classList.contains('hidden')) count++;
    });

    const counter = modal.querySelector('#md-selection-count');
    if (counter) {
        counter.textContent = `${count} selected`;
    }

    const badge = modal.querySelector('#md-download-badge');
    if (badge) {
        badge.textContent = String(count);
        badge.classList.toggle('has-count', count > 0);
    }
}

/** Escape HTML special characters */
function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
