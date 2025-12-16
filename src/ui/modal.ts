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

/** Show page selector modal */
export function showPageSelectorModal(
    rootNode: PageTreeNode,
    rootTitle: string,
    options: ModalOptions
): Promise<ModalResult> {
    return new Promise((resolve) => {
        currentSettings = loadSettings();

        const modal = document.createElement('div');
        modal.id = 'md-export-modal';
        modalElement = modal;

        modal.innerHTML = `
      <div id="md-export-modal-content">
        <div class="md-modal-header">
          <div class="md-header-title">
            <h3>Export to Markdown</h3>
            <button class="md-btn-icon" data-action="refresh" title="Refresh page tree">
              ${ICONS.refresh}
            </button>
          </div>
          <p class="subtitle">
            ${ICONS.folder.replace('<svg', '<svg class="icon"')}
            <span>${escapeHtml(rootTitle)}</span>
          </p>
        </div>
        
        <div class="md-controls">
          <button class="md-btn md-btn-secondary md-btn-sm" data-action="expand">Expand All</button>
          <button class="md-btn md-btn-secondary md-btn-sm" data-action="collapse">Collapse All</button>
          <button class="md-btn md-btn-secondary md-btn-sm" data-action="select-all">Select All</button>
          <button class="md-btn md-btn-secondary md-btn-sm" data-action="deselect-all">Deselect All</button>
          <span class="md-selection-count" id="md-selection-count">0 selected</span>
        </div>
        
        <div class="md-tree-container">
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
            <button class="md-btn md-btn-link" data-action="cancel">Cancel</button>
          </div>
          <div class="md-footer-right">
            <button class="md-btn md-btn-secondary" data-action="copy" id="md-copy-btn">
              ${ICONS.copy}
              <span>Copy</span>
            </button>
            <button class="md-btn md-btn-secondary" data-action="pdf" id="md-pdf-btn">
              <span>📄 PDF</span>
            </button>
            <button class="md-btn md-btn-primary" data-action="download" id="md-download-btn">
              ${ICONS.download}
              <span>Download MD</span>
            </button>
          </div>
        </div>
      </div>
    `;

        document.body.appendChild(modal);
        updateSelectionCount(modal);

        // Event delegation for buttons
        modal.addEventListener('click', async (e) => {
            const target = e.target as HTMLElement;
            const btn = target.closest('[data-action]') as HTMLElement;
            if (!btn) return;

            const action = btn.dataset.action;

            if (action === 'cancel') {
                modal.remove();
                modalElement = null;
                resolve({ selectedIds: [], cancelled: true, action: 'cancel', settings: currentSettings });
                return;
            }

            if (action === 'download' || action === 'copy' || action === 'pdf') {
                const selectedIds = getSelectedIds(modal);
                if (selectedIds.length === 0) {
                    alert('Please select at least one page.');
                    return;
                }
                saveCurrentSettings(modal);
                disableModalInteraction(modal);
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
                modal.querySelectorAll<HTMLInputElement>('.md-tree-checkbox').forEach((cb) => (cb.checked = true));
                updateSelectionCount(modal);
                return;
            }

            if (action === 'deselect-all') {
                modal.querySelectorAll<HTMLInputElement>('.md-tree-checkbox').forEach((cb) => (cb.checked = false));
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
            if (treeItem && !target.closest('.md-tree-checkbox')) {
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
    }
}

/** Re-enable modal after operation */
export function enableModal(): void {
    if (!modalElement) return;

    const downloadBtn = modalElement.querySelector('#md-download-btn') as HTMLButtonElement;
    const copyBtn = modalElement.querySelector('#md-copy-btn') as HTMLButtonElement;

    if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = `${ICONS.download}<span>Download</span>`;
    }

    if (copyBtn) {
        copyBtn.disabled = false;
        copyBtn.innerHTML = `${ICONS.copy}<span>Copy to Clipboard</span>`;
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

    if (downloadBtn) {
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = `<span>Processing...</span>`;
    }

    if (copyBtn) {
        copyBtn.disabled = true;
    }

    modal.querySelectorAll<HTMLButtonElement>('.md-controls button').forEach((btn) => {
        btn.disabled = true;
    });

    modal.querySelectorAll<HTMLInputElement>('.md-tree-checkbox').forEach((cb) => {
        cb.disabled = true;
    });
}

/** Build tree HTML recursively */
function buildTreeHtml(nodes: PageTreeNode[]): string {
    let html = '<ul>';

    for (const node of nodes) {
        const hasChildren = node.children.length > 0;
        const errorClass = node.error ? ' error' : '';
        const togglerClass = hasChildren ? 'md-tree-toggler expanded' : 'md-tree-toggler empty';
        const iconClass = hasChildren ? 'md-tree-icon folder' : 'md-tree-icon page';
        const icon = hasChildren ? ICONS.folder : ICONS.page;

        html += `<li data-page-id="${node.id}">`;
        html += `<div class="md-tree-item">`;
        html += `<span class="${togglerClass}">${ICONS.chevron}</span>`;
        html += `<input type="checkbox" class="md-tree-checkbox" data-page-id="${node.id}" checked>`;
        html += `<span class="${iconClass}">${icon}</span>`;
        html += `<span class="md-tree-label${errorClass}">${escapeHtml(node.title)}${node.error ? ' (Error)' : ''}</span>`;
        html += `</div>`;

        if (hasChildren) {
            html += buildTreeHtml(node.children);
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
        if (cb.dataset.pageId) {
            ids.push(cb.dataset.pageId);
        }
    });
    return ids;
}

/** Update selection counter */
function updateSelectionCount(modal: HTMLElement): void {
    const count = modal.querySelectorAll('.md-tree-checkbox:checked').length;
    const counter = modal.querySelector('#md-selection-count');
    if (counter) {
        counter.textContent = `${count} selected`;
    }
}

/** Escape HTML special characters */
function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
