/**
 * Event handlers module for export modal
 * @module ui/modal/handlers
 */

import type { PageTreeNode, ObsidianExportSettings, ExportPreset } from '@/api/types';
import type { ExportSettings } from '@/storage/types';
import type { ModalCallbacks, ModalAction, ModalContext, ModalState } from './types';
import { loadSettings, saveSettings, loadObsidianSettings, saveObsidianSettings, applyPreset } from '@/storage/storage';
import { t, toggleLocale, getLocale } from '../i18n';

// ============================================================================
// Types
// ============================================================================

/** Dependencies required by event handlers */
export interface HandlerDependencies {
    /** Modal root element */
    readonly element: HTMLElement;
    /** Root node of the page tree */
    readonly rootNode: PageTreeNode;
    /** Callbacks for modal interactions */
    readonly callbacks: ModalCallbacks;
    /** Get current modal state */
    getState: () => ModalState;
    /** Set modal state */
    setState: (state: ModalState) => void;
    /** Close the modal */
    close: () => void;
    /** Update tree display */
    updateTree: (node: PageTreeNode) => void;
    /** Update stats display */
    updateStats: () => void;
}

// ============================================================================
// Module State
// ============================================================================

/** Current export settings */
let currentSettings: ExportSettings;

/** Current Obsidian export settings */
let currentObsidianSettings: ObsidianExportSettings;

/** Current root node reference */
let currentRootNode: PageTreeNode | null = null;

// ============================================================================
// Settings Management
// ============================================================================

/**
 * Initialize settings from storage
 */
export function initSettings(rootNode: PageTreeNode): void {
    currentSettings = loadSettings();
    currentObsidianSettings = loadObsidianSettings();
    currentRootNode = rootNode;
}

/**
 * Get current settings
 */
export function getSettings(): { settings: ExportSettings; obsidianSettings: ObsidianExportSettings } {
    return { settings: currentSettings, obsidianSettings: currentObsidianSettings };
}

/**
 * Get current root node
 */
export function getRootNode(): PageTreeNode | null {
    return currentRootNode;
}

/**
 * Set current root node
 */
export function setRootNode(node: PageTreeNode): void {
    currentRootNode = node;
}

/**
 * Save current settings from modal UI
 */
export function saveCurrentSettings(element: HTMLElement): void {
    currentSettings = {
        includeImages: (element.querySelector('#setting-images') as HTMLInputElement)?.checked ?? true,
        includeMetadata: (element.querySelector('#setting-metadata') as HTMLInputElement)?.checked ?? true,
        includeComments: (element.querySelector('#setting-comments') as HTMLInputElement)?.checked ?? false,
        includeSourceLinks: (element.querySelector('#setting-links') as HTMLInputElement)?.checked ?? true,
    };
    saveSettings(currentSettings);

    // Sync Obsidian settings with base settings
    currentObsidianSettings.includeImages = currentSettings.includeImages;
    currentObsidianSettings.includeMetadata = currentSettings.includeMetadata;
    currentObsidianSettings.includeComments = currentSettings.includeComments;
    currentObsidianSettings.includeSourceLinks = currentSettings.includeSourceLinks;
    saveObsidianSettings(currentObsidianSettings);
}

// ============================================================================
// Helper Functions
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
 * Shake element animation for validation feedback
 */
function shakeElement(el: Element | null): void {
    if (!el) return;
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 500);
}

/**
 * Check if an input element is focused
 */
function isInputFocused(): boolean {
    const active = document.activeElement;
    return active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA';
}

// ============================================================================
// UI Update Functions
// ============================================================================

/**
 * Update Obsidian settings UI from current settings
 */
export function updateObsidianSettingsUI(element: HTMLElement): void {
    const setChecked = (id: string, checked: boolean) => {
        const el = element.querySelector(`#${id}`) as HTMLInputElement;
        if (el) el.checked = checked;
    };

    setChecked('setting-hierarchical', currentObsidianSettings.folderStructure === 'hierarchical');
    setChecked('setting-wikilinks', currentObsidianSettings.linkStyle === 'wikilink');
    setChecked('setting-callouts', currentObsidianSettings.useObsidianCallouts);
    setChecked('setting-frontmatter', currentObsidianSettings.includeFrontmatter);
    setChecked('setting-diagrams', currentObsidianSettings.exportDiagrams);
    setChecked('setting-embed-diagrams', currentObsidianSettings.embedDiagramsAsCode);
    setChecked('setting-diagram-source', currentObsidianSettings.includeDiagramSource);
    setChecked('setting-diagram-preview', currentObsidianSettings.includeDiagramPreview);
    setChecked('setting-attachments', currentObsidianSettings.downloadAttachments);
    setChecked('setting-images', currentObsidianSettings.includeImages);
    setChecked('setting-links', currentObsidianSettings.includeSourceLinks);
    setChecked('setting-metadata', currentObsidianSettings.includeMetadata);
    setChecked('setting-comments', currentObsidianSettings.includeComments);

    // Update radio buttons (old style)
    const scaleRadio = element.querySelector(
        `input[name="diagram-scale"][value="${currentObsidianSettings.diagramPreviewScale}"]`
    ) as HTMLInputElement;
    if (scaleRadio) scaleRadio.checked = true;

    const formatRadio = element.querySelector(
        `input[name="diagram-format"][value="${currentObsidianSettings.diagramTargetFormat}"]`
    ) as HTMLInputElement;
    if (formatRadio) formatRadio.checked = true;

    const exportModeRadio = element.querySelector(
        `input[name="diagram-export-mode"][value="${currentObsidianSettings.diagramExportMode}"]`
    ) as HTMLInputElement;
    if (exportModeRadio) exportModeRadio.checked = true;

    // Update card-select buttons (new style - diagram export mode)
    element.querySelectorAll('.md-card-option[data-setting="diagram-export-mode"]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-value') === currentObsidianSettings.diagramExportMode);
    });

    // Update toggle-group buttons (new style - diagram format)
    element.querySelectorAll('.md-toggle-btn[data-setting="diagram-format"]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-value') === currentObsidianSettings.diagramTargetFormat);
    });

    // Show/hide convert options based on export mode
    updateDiagramOptionsVisibility(element);

    // Update format buttons (old style)
    element.querySelectorAll('.md-preset-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-preset') === currentObsidianSettings.exportFormat);
    });

    // Update platform select (new style)
    const platformSelect = element.querySelector('#setting-platform') as HTMLSelectElement;
    if (platformSelect) {
        platformSelect.value = currentObsidianSettings.exportFormat;
    }

    // Show/hide Obsidian options
    const obsidianOptions = element.querySelector('#md-obsidian-options') as HTMLElement;
    if (obsidianOptions) {
        obsidianOptions.style.display = currentObsidianSettings.exportFormat === 'obsidian' ? 'block' : 'none';
    }
}

/**
 * Update diagram options visibility based on export mode
 */
function updateDiagramOptionsVisibility(element: HTMLElement): void {
    const mode = currentObsidianSettings.diagramExportMode;
    const isDiagramsEnabled = currentObsidianSettings.exportDiagrams;

    // Show/hide diagrams options container with disabled state
    const diagramsOptions = element.querySelector('#md-diagrams-options') as HTMLElement;
    if (diagramsOptions) {
        diagramsOptions.classList.toggle('disabled', !isDiagramsEnabled);
    }

    // Show/hide convert-specific options
    const isConvertMode = mode === 'convert';
    const convertOptions = element.querySelector('#convert-format-options') as HTMLElement;
    const embedOption = element.querySelector('#embed-diagrams-option') as HTMLElement;
    const convertWarning = element.querySelector('#md-convert-warning') as HTMLElement;

    if (convertOptions) convertOptions.style.display = isConvertMode ? 'flex' : 'none';
    if (embedOption) embedOption.style.display = isConvertMode ? 'block' : 'none';
    if (convertWarning) convertWarning.style.display = isConvertMode ? 'block' : 'none';

    // Update checkbox states based on diagram export mode
    updateDiagramCheckboxStates(element, mode);
}

/**
 * Update diagram checkbox enabled/disabled states based on export mode
 */
function updateDiagramCheckboxStates(element: HTMLElement, mode: string): void {
    const sourceCheckbox = element.querySelector('#setting-diagram-source') as HTMLInputElement;
    const previewCheckbox = element.querySelector('#setting-diagram-preview') as HTMLInputElement;
    const embedCheckbox = element.querySelector('#setting-embed-diagrams') as HTMLInputElement;

    const sourceLabel = sourceCheckbox?.closest('.md-checkbox-compact');
    const previewLabel = previewCheckbox?.closest('.md-checkbox-compact');
    const embedLabel = embedCheckbox?.closest('.md-checkbox-compact');

    // copy-as-is: source always on, preview disabled
    // convert: all options available
    // svg-preview: embed always on

    if (mode === 'copy-as-is') {
        if (sourceCheckbox) { sourceCheckbox.checked = true; sourceCheckbox.disabled = true; }
        if (previewCheckbox) { previewCheckbox.checked = false; previewCheckbox.disabled = true; }
        if (embedCheckbox) { embedCheckbox.disabled = false; }
        sourceLabel?.classList.add('disabled');
        previewLabel?.classList.add('disabled');
        embedLabel?.classList.remove('disabled');
    } else if (mode === 'svg-preview') {
        if (sourceCheckbox) { sourceCheckbox.disabled = false; }
        if (previewCheckbox) { previewCheckbox.disabled = false; }
        if (embedCheckbox) { embedCheckbox.checked = true; embedCheckbox.disabled = true; }
        sourceLabel?.classList.remove('disabled');
        previewLabel?.classList.remove('disabled');
        embedLabel?.classList.add('disabled');
    } else {
        // convert mode - all enabled
        if (sourceCheckbox) sourceCheckbox.disabled = false;
        if (previewCheckbox) previewCheckbox.disabled = false;
        if (embedCheckbox) embedCheckbox.disabled = false;
        sourceLabel?.classList.remove('disabled');
        previewLabel?.classList.remove('disabled');
        embedLabel?.classList.remove('disabled');
    }
}

/**
 * Update Copy button state based on export format and selection
 */
export function updateCopyButtonState(element: HTMLElement): void {
    const copyBtn = element.querySelector('#md-copy-btn') as HTMLButtonElement;
    if (!copyBtn) return;

    const selectedCount = getSelectedIds(element).length;
    const format = currentObsidianSettings.exportFormat;

    // Copy is only available for single file mode with 1 page selected
    const canCopy = format === 'single' && selectedCount === 1;

    copyBtn.disabled = !canCopy;

    if (!canCopy && selectedCount > 0) {
        if (format !== 'single') {
            copyBtn.title = t('copyDisabledFormat');
        } else if (selectedCount > 1) {
            copyBtn.title = t('copyDisabledMultiple');
        }
    } else {
        copyBtn.title = t('copy');
    }
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
 * Disable modal interaction during export
 */
export function disableModalInteraction(element: HTMLElement): void {
    const downloadBtn = element.querySelector('#md-download-btn') as HTMLButtonElement;
    const copyBtn = element.querySelector('#md-copy-btn') as HTMLButtonElement;
    const pdfBtn = element.querySelector('#md-pdf-btn') as HTMLButtonElement;

    if (downloadBtn) {
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = `<span>Processing...</span>`;
    }

    if (copyBtn) copyBtn.disabled = true;
    if (pdfBtn) pdfBtn.disabled = true;

    element.querySelectorAll<HTMLButtonElement>('.md-controls button').forEach((btn) => {
        btn.disabled = true;
    });

    element.querySelectorAll<HTMLInputElement>('.md-tree-checkbox').forEach((cb) => {
        cb.disabled = true;
    });
}

/**
 * Enable modal interaction after export
 */
export function enableModalInteraction(element: HTMLElement, icons: { download: string; copy: string }): void {
    const downloadBtn = element.querySelector('#md-download-btn') as HTMLButtonElement;
    const copyBtn = element.querySelector('#md-copy-btn') as HTMLButtonElement;
    const pdfBtn = element.querySelector('#md-pdf-btn') as HTMLButtonElement;

    if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = `${icons.download}<span>Download</span><span class="md-btn-badge" id="md-download-badge">0</span>`;
    }

    if (copyBtn) {
        copyBtn.disabled = false;
        copyBtn.innerHTML = `${icons.copy}<span>Copy</span>`;
    }

    if (pdfBtn) {
        pdfBtn.disabled = false;
    }

    element.querySelectorAll<HTMLButtonElement>('.md-controls button').forEach((btn) => {
        btn.disabled = false;
    });

    element.querySelectorAll<HTMLInputElement>('.md-tree-checkbox').forEach((cb) => {
        cb.disabled = false;
    });

    // Hide progress section
    const progressSection = element.querySelector('#md-progress-section') as HTMLElement;
    if (progressSection) {
        progressSection.style.display = 'none';
    }

    updateSelectionCount(element);
}

// ============================================================================
// Event Handlers Setup
// ============================================================================

/**
 * Setup all event listeners for the modal
 * @returns Cleanup function to remove all listeners
 */
export function setupEventListeners(deps: HandlerDependencies): () => void {
    const { element, callbacks, getState, setState, close, updateTree, updateStats } = deps;

    // Store cleanup functions
    const cleanups: (() => void)[] = [];

    // -------------------------------------------------------------------------
    // Action Button Handler
    // -------------------------------------------------------------------------
    const handleActionClick = async (e: Event) => {
        const target = e.target as HTMLElement;
        const btn = target.closest('[data-action]') as HTMLElement;
        if (!btn) return;

        const action = btn.dataset.action;

        // Ignore clicks during processing
        if (getState() === 'processing') {
            console.log('[Modal] Ignoring click - processing in progress');
            return;
        }

        if (action === 'cancel') {
            close();
            return;
        }

        // Export actions
        if (action === 'download' || action === 'copy' || action === 'pdf') {
            const selectedIds = getSelectedIds(element);
            if (selectedIds.length === 0) {
                shakeElement(element.querySelector('.md-selection-count'));
                return;
            }

            saveCurrentSettings(element);
            setState('processing');
            disableModalInteraction(element);

            // Debug: log export format decision
            console.log('[Modal] Export action:', action);
            console.log('[Modal] exportFormat:', currentObsidianSettings.exportFormat);

            const isObsidian = currentObsidianSettings.exportFormat === 'obsidian' && action === 'download';
            const modalAction: ModalAction = isObsidian ? 'obsidian' : action as ModalAction;
            console.log('[Modal] isObsidian:', isObsidian, '→ modalAction:', modalAction);

            const ctx: ModalContext = {
                selectedIds,
                settings: currentSettings,
                obsidianSettings: currentObsidianSettings,
            };

            // Let the callback handle the action
            await callbacks.onAction(modalAction, ctx);
            return;
        }

        // Refresh tree
        if (action === 'refresh') {
            const refreshBtn = btn;
            refreshBtn.classList.add('spinning');
            try {
                const newTree = await callbacks.onRefresh();
                setRootNode(newTree);
                updateTree(newTree);
                updateSelectionCount(element);
                updateStats();
            } finally {
                refreshBtn.classList.remove('spinning');
            }
            return;
        }

        // Toggle theme
        if (action === 'toggle-theme') {
            handleToggleTheme(element, btn);
            return;
        }

        // Toggle locale (EN/RU)
        if (action === 'toggle-locale') {
            const newLocale = toggleLocale();
            // Update button text immediately
            btn.textContent = newLocale.toUpperCase();

            // Update all localized text in the UI
            updateLocalizedText(element);
            return;
        }

        // Toggle panels
        if (action === 'toggle-settings') {
            togglePanel(element, '#md-settings-content', btn);
            return;
        }

        if (action === 'toggle-format') {
            togglePanel(element, '#md-format-content', btn);
            return;
        }

        if (action === 'toggle-diagrams') {
            togglePanel(element, '#md-diagrams-content', btn);
            return;
        }

        // Tree controls
        if (action === 'expand') {
            element.querySelectorAll('.md-tree ul').forEach((ul) => ul.classList.remove('collapsed'));
            element.querySelectorAll('.md-tree-toggler').forEach((t) => t.classList.add('expanded'));
            return;
        }

        if (action === 'collapse') {
            element.querySelectorAll('.md-tree ul ul').forEach((ul) => ul.classList.add('collapsed'));
            element.querySelectorAll('.md-tree-toggler').forEach((t) => {
                if (!t.classList.contains('empty')) t.classList.remove('expanded');
            });
            return;
        }

        // Selection controls
        if (action === 'select-all') {
            element.querySelectorAll<HTMLInputElement>('.md-tree-checkbox').forEach((cb) => {
                if (!cb.closest('li')?.classList.contains('hidden')) cb.checked = true;
            });
            updateSelectionCount(element);
            updateStats();
            return;
        }

        if (action === 'deselect-all') {
            element.querySelectorAll<HTMLInputElement>('.md-tree-checkbox').forEach((cb) => {
                cb.checked = false;
            });
            updateSelectionCount(element);
            updateStats();
            return;
        }

        if (action === 'invert') {
            element.querySelectorAll<HTMLInputElement>('.md-tree-checkbox').forEach((cb) => {
                if (!cb.closest('li')?.classList.contains('hidden')) cb.checked = !cb.checked;
            });
            updateSelectionCount(element);
            updateStats();
            return;
        }

        // Reset to defaults
        if (action === 'reset-defaults') {
            currentSettings = loadSettings();
            currentObsidianSettings = loadObsidianSettings();
            updateObsidianSettingsUI(element);
            return;
        }
    };

    element.addEventListener('click', handleActionClick);
    cleanups.push(() => element.removeEventListener('click', handleActionClick));

    // -------------------------------------------------------------------------
    // Keyboard Shortcuts Handler
    // -------------------------------------------------------------------------
    const handleKeydown = (e: KeyboardEvent) => {
        // Escape - close
        if (e.key === 'Escape') {
            close();
            return;
        }

        // Ctrl+A - select all
        if (e.ctrlKey && e.key === 'a' && !isInputFocused()) {
            e.preventDefault();
            element.querySelectorAll<HTMLInputElement>('.md-tree-checkbox').forEach((cb) => {
                if (!cb.closest('li')?.classList.contains('hidden')) cb.checked = true;
            });
            updateSelectionCount(element);
            updateStats();
            return;
        }

        // Ctrl+D - download
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            const downloadBtn = element.querySelector('[data-action="download"]') as HTMLButtonElement;
            downloadBtn?.click();
            return;
        }

        // Ctrl+C - copy (when not in input)
        if (e.ctrlKey && e.key === 'c' && !isInputFocused()) {
            e.preventDefault();
            const copyBtn = element.querySelector('[data-action="copy"]') as HTMLButtonElement;
            copyBtn?.click();
            return;
        }
    };

    document.addEventListener('keydown', handleKeydown);
    cleanups.push(() => document.removeEventListener('keydown', handleKeydown));

    // -------------------------------------------------------------------------
    // Backdrop Click Handler
    // -------------------------------------------------------------------------
    const handleBackdropClick = (e: Event) => {
        if (e.target === element) {
            close();
        }
    };

    element.addEventListener('click', handleBackdropClick);
    cleanups.push(() => element.removeEventListener('click', handleBackdropClick));

    // -------------------------------------------------------------------------
    // Search Functionality
    // -------------------------------------------------------------------------
    const searchInput = element.querySelector('#md-search-input') as HTMLInputElement;
    const searchClear = element.querySelector('#md-search-clear') as HTMLElement;

    const handleSearchInput = () => {
        const query = searchInput.value.toLowerCase().trim();
        searchClear.style.display = query ? 'flex' : 'none';
        filterTree(element, query);
    };

    const handleSearchClear = () => {
        searchInput.value = '';
        searchClear.style.display = 'none';
        filterTree(element, '');
        searchInput.focus();
    };

    if (searchInput) {
        searchInput.addEventListener('input', handleSearchInput);
        cleanups.push(() => searchInput.removeEventListener('input', handleSearchInput));
    }

    if (searchClear) {
        searchClear.addEventListener('click', handleSearchClear);
        cleanups.push(() => searchClear.removeEventListener('click', handleSearchClear));
    }

    // -------------------------------------------------------------------------
    // Tree Item Click Handler
    // -------------------------------------------------------------------------
    const handleTreeItemClick = (e: Event) => {
        const target = e.target as HTMLElement;

        // Toggle tree branch
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

        // Click on tree item (not checkbox or toggler) toggles checkbox
        const treeItem = target.closest('.md-tree-item') as HTMLElement;
        if (treeItem && !target.closest('.md-tree-checkbox') && !target.closest('.md-tree-toggler')) {
            const checkbox = treeItem.querySelector<HTMLInputElement>('.md-tree-checkbox');
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    };

    element.addEventListener('click', handleTreeItemClick);
    cleanups.push(() => element.removeEventListener('click', handleTreeItemClick));

    // -------------------------------------------------------------------------
    // Checkbox Change Handler
    // -------------------------------------------------------------------------
    const handleCheckboxChange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (!target.classList.contains('md-tree-checkbox')) return;

        const isChecked = target.checked;
        const li = target.closest('li');

        // Shift+click = cascade to children
        if ((e as any).shiftKey && isChecked) {
            li?.querySelectorAll<HTMLInputElement>(':scope > ul .md-tree-checkbox').forEach((cb) => {
                cb.checked = true;
            });
        }

        // If unchecking, also uncheck children (to avoid orphan selections)
        if (!isChecked) {
            li?.querySelectorAll<HTMLInputElement>(':scope > ul .md-tree-checkbox').forEach((cb) => {
                cb.checked = false;
            });
        }

        updateSelectionCount(element);
        updateStats();
    };

    element.addEventListener('change', handleCheckboxChange);
    cleanups.push(() => element.removeEventListener('change', handleCheckboxChange));

    // Handle Shift+click on checkbox for cascade selection
    const handleShiftClick = (e: Event) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('md-tree-checkbox') && (e as MouseEvent).shiftKey) {
            (e as any).shiftKey = true;
        }
    };

    element.addEventListener('click', handleShiftClick, true);
    cleanups.push(() => element.removeEventListener('click', handleShiftClick, true));

    // -------------------------------------------------------------------------
    // Format Preset & Filter Handlers
    // -------------------------------------------------------------------------
    const handlePresetClick = (e: Event) => {
        const target = e.target as HTMLElement;

        // Format preset buttons (single/obsidian)
        const presetBtn = target.closest('[data-preset]') as HTMLElement;
        if (presetBtn) {
            const preset = presetBtn.dataset.preset as 'single' | 'obsidian';
            currentObsidianSettings.exportFormat = preset;

            // Update button states
            element.querySelectorAll('.md-preset-btn').forEach((btn) => {
                btn.classList.toggle('active', btn.getAttribute('data-preset') === preset);
            });

            // Show/hide Obsidian options
            const obsidianOptions = element.querySelector('#md-obsidian-options') as HTMLElement;
            if (obsidianOptions) {
                obsidianOptions.style.display = preset === 'obsidian' ? 'block' : 'none';
            }

            saveObsidianSettings(currentObsidianSettings);
            return;
        }

        // Apply preset buttons (quick/full/documentation)
        const applyPresetBtn = target.closest('[data-apply-preset]') as HTMLElement;
        if (applyPresetBtn) {
            const presetName = applyPresetBtn.dataset.applyPreset as ExportPreset;
            currentObsidianSettings = applyPreset(presetName);
            updateObsidianSettingsUI(element);
            saveObsidianSettings(currentObsidianSettings);
            return;
        }

        // Filter chips (old style)
        const filterChip = target.closest('[data-filter].md-filter-chip') as HTMLElement;
        if (filterChip) {
            const filter = filterChip.dataset.filter;

            // Update active state
            element.querySelectorAll('.md-filter-chip').forEach(chip => {
                chip.classList.toggle('active', chip === filterChip);
            });

            // Apply filter
            applyFilter(element, filter || 'all');
            updateSelectionCount(element);
            updateStats();
            return;
        }

        // Filter tabs (new style)
        const filterTab = target.closest('[data-filter].md-filter-tab') as HTMLElement;
        if (filterTab) {
            const filter = filterTab.dataset.filter;

            // Update active state
            element.querySelectorAll('.md-filter-tab').forEach(tab => {
                tab.classList.toggle('active', tab === filterTab);
            });

            // Apply filter
            applyFilter(element, filter || 'all');
            updateSelectionCount(element);
            updateStats();
            return;
        }

        // Card select buttons (diagram export mode)
        const cardOption = target.closest('.md-card-option[data-setting="diagram-export-mode"]') as HTMLElement;
        if (cardOption) {
            const value = cardOption.dataset.value as 'copy-as-is' | 'convert' | 'svg-preview';
            currentObsidianSettings.diagramExportMode = value;

            // Update active state
            element.querySelectorAll('.md-card-option[data-setting="diagram-export-mode"]').forEach(btn => {
                btn.classList.toggle('active', btn === cardOption);
            });

            updateDiagramOptionsVisibility(element);
            saveObsidianSettings(currentObsidianSettings);
            return;
        }

        // Toggle group buttons (diagram format)
        const toggleBtn = target.closest('.md-toggle-btn[data-setting="diagram-format"]') as HTMLElement;
        if (toggleBtn) {
            const value = toggleBtn.dataset.value as 'mermaid' | 'drawio-xml';
            currentObsidianSettings.diagramTargetFormat = value;

            // Update active state
            element.querySelectorAll('.md-toggle-btn[data-setting="diagram-format"]').forEach(btn => {
                btn.classList.toggle('active', btn === toggleBtn);
            });

            saveObsidianSettings(currentObsidianSettings);
            return;
        }

        // Platform select change
        const platformSelect = target.closest('#setting-platform') as HTMLSelectElement;
        if (platformSelect) {
            const value = platformSelect.value as 'single' | 'obsidian' | 'github';
            currentObsidianSettings.exportFormat = value === 'github' ? 'single' : value;

            // Show/hide Obsidian options
            const obsidianOptions = element.querySelector('#md-obsidian-options') as HTMLElement;
            if (obsidianOptions) {
                obsidianOptions.style.display = value === 'obsidian' ? 'block' : 'none';
            }

            // Update hint text
            const hintEl = element.querySelector('#platform-hint');
            if (hintEl) {
                const hints: Record<string, string> = {
                    obsidian: t('presetObsidianDesc'),
                    single: t('presetSingleDesc'),
                    github: t('presetGithubDesc'),
                };
                hintEl.textContent = hints[value] || '';
            }

            // Update Copy button state
            updateCopyButtonState(element);
            saveObsidianSettings(currentObsidianSettings);
            return;
        }
    };

    element.addEventListener('click', handlePresetClick);
    cleanups.push(() => element.removeEventListener('click', handlePresetClick));

    // Platform select change handler
    const platformSelect = element.querySelector('#setting-platform') as HTMLSelectElement;
    if (platformSelect) {
        const handlePlatformChange = () => {
            const value = platformSelect.value as 'single' | 'obsidian' | 'github';
            currentObsidianSettings.exportFormat = value === 'github' ? 'single' : value;

            // Show/hide Obsidian options
            const obsidianOptions = element.querySelector('#md-obsidian-options') as HTMLElement;
            if (obsidianOptions) {
                obsidianOptions.style.display = value === 'obsidian' ? 'block' : 'none';
            }

            // Update hint text
            const hintEl = element.querySelector('#platform-hint');
            if (hintEl) {
                const hints: Record<string, string> = {
                    obsidian: t('presetObsidianDesc'),
                    single: t('presetSingleDesc'),
                    github: t('presetGithubDesc'),
                };
                hintEl.textContent = hints[value] || '';
            }

            // Update Copy button state
            updateCopyButtonState(element);

            // Auto-save
            saveObsidianSettings(currentObsidianSettings);
        };
        platformSelect.addEventListener('change', handlePlatformChange);
        cleanups.push(() => platformSelect.removeEventListener('change', handlePlatformChange));
    }

    // -------------------------------------------------------------------------
    // Settings Change Handler
    // -------------------------------------------------------------------------
    const handleSettingsChange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        let settingsChanged = false;

        // Base settings (synced to both currentSettings and currentObsidianSettings)
        if (target.id === 'setting-images') {
            currentSettings.includeImages = target.checked;
            currentObsidianSettings.includeImages = target.checked;
            settingsChanged = true;
        } else if (target.id === 'setting-metadata') {
            currentSettings.includeMetadata = target.checked;
            currentObsidianSettings.includeMetadata = target.checked;
            settingsChanged = true;
        } else if (target.id === 'setting-comments') {
            currentSettings.includeComments = target.checked;
            currentObsidianSettings.includeComments = target.checked;
            settingsChanged = true;
        } else if (target.id === 'setting-links') {
            currentSettings.includeSourceLinks = target.checked;
            currentObsidianSettings.includeSourceLinks = target.checked;
            settingsChanged = true;
        }
        // Obsidian-specific settings
        else if (target.id === 'setting-hierarchical') {
            currentObsidianSettings.folderStructure = target.checked ? 'hierarchical' : 'flat';
            settingsChanged = true;
        } else if (target.id === 'setting-wikilinks') {
            currentObsidianSettings.linkStyle = target.checked ? 'wikilink' : 'markdown';
            settingsChanged = true;
        } else if (target.id === 'setting-callouts') {
            currentObsidianSettings.useObsidianCallouts = target.checked;
            settingsChanged = true;
        } else if (target.id === 'setting-frontmatter') {
            currentObsidianSettings.includeFrontmatter = target.checked;
            settingsChanged = true;
        } else if (target.id === 'setting-diagrams') {
            currentObsidianSettings.exportDiagrams = target.checked;
            updateDiagramOptionsVisibility(element);
            settingsChanged = true;
        } else if (target.id === 'setting-embed-diagrams') {
            currentObsidianSettings.embedDiagramsAsCode = target.checked;
            settingsChanged = true;
        } else if (target.id === 'setting-diagram-source') {
            currentObsidianSettings.includeDiagramSource = target.checked;
            settingsChanged = true;
        } else if (target.id === 'setting-diagram-preview') {
            currentObsidianSettings.includeDiagramPreview = target.checked;
            settingsChanged = true;
        } else if (target.id === 'setting-attachments') {
            currentObsidianSettings.downloadAttachments = target.checked;
            settingsChanged = true;
        } else if (target.name === 'diagram-scale') {
            currentObsidianSettings.diagramPreviewScale = parseInt(target.value) as 1 | 2 | 3;
            settingsChanged = true;
        } else if (target.name === 'diagram-format') {
            currentObsidianSettings.diagramTargetFormat = target.value as 'mermaid' | 'drawio-xml';
            settingsChanged = true;
        } else if (target.name === 'diagram-export-mode') {
            currentObsidianSettings.diagramExportMode = target.value as 'copy-as-is' | 'convert' | 'svg-preview';
            updateDiagramOptionsVisibility(element);
            settingsChanged = true;
        }

        // Auto-save settings to localStorage
        if (settingsChanged) {
            saveSettings(currentSettings);
            saveObsidianSettings(currentObsidianSettings);
        }
    };

    element.addEventListener('change', handleSettingsChange);
    cleanups.push(() => element.removeEventListener('change', handleSettingsChange));

    // -------------------------------------------------------------------------
    // Return Cleanup Function
    // -------------------------------------------------------------------------
    return () => {
        cleanups.forEach(fn => fn());
    };
}

// ============================================================================
// Private Helper Functions
// ============================================================================

/**
 * Toggle a collapsible panel
 */
function togglePanel(element: HTMLElement, contentSelector: string, btn: HTMLElement): void {
    const content = element.querySelector(contentSelector) as HTMLElement;
    const chevron = btn.querySelector('.md-chevron') as HTMLElement;
    if (content) {
        const isHidden = content.style.display === 'none';
        content.style.display = isHidden ? 'block' : 'none';
        chevron?.classList.toggle('expanded', isHidden);
    }
}

/**
 * Handle theme toggle
 */
function handleToggleTheme(element: HTMLElement, btn: HTMLElement): void {
    const currentTheme = element.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    element.setAttribute('data-theme', newTheme);

    // Update button icon (sun for dark mode, moon for light mode)
    const sunIcon = `<svg viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 000-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>`;
    const moonIcon = `<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>`;
    btn.innerHTML = newTheme === 'dark' ? sunIcon : moonIcon;
}

/**
 * Update all localized text in the modal UI
 */
function updateLocalizedText(element: HTMLElement): void {
    // Header
    const title = element.querySelector('.md-header-title');
    if (title) title.textContent = t('title');

    // Search placeholder
    const searchInput = element.querySelector('#md-search-input') as HTMLInputElement;
    if (searchInput) searchInput.placeholder = t('searchPlaceholder');

    // Filter tabs
    const filterTabs = element.querySelectorAll('.md-filter-tab');
    filterTabs.forEach(tab => {
        const filter = tab.getAttribute('data-filter');
        if (filter === 'all') tab.textContent = t('filterAll');
        else if (filter === 'selected') tab.textContent = t('filterSelected');
        else if (filter === 'errors') tab.textContent = t('filterErrors');
    });

    // Tree controls tooltips
    const expandBtn = element.querySelector('[data-action="expand"]');
    const collapseBtn = element.querySelector('[data-action="collapse"]');
    if (expandBtn) expandBtn.setAttribute('title', t('expandAll'));
    if (collapseBtn) collapseBtn.setAttribute('title', t('collapseAll'));

    // Config panel labels
    const exportPresetLabel = element.querySelector('.md-config-label');
    if (exportPresetLabel) exportPresetLabel.textContent = t('exportPreset');

    // Platform select options
    const platformSelect = element.querySelector('#setting-platform') as HTMLSelectElement;
    if (platformSelect) {
        const options = platformSelect.querySelectorAll('option');
        options.forEach(opt => {
            if (opt.value === 'obsidian') opt.textContent = t('presetObsidian');
            else if (opt.value === 'single') opt.textContent = t('presetSingle');
            else if (opt.value === 'github') opt.textContent = t('presetGithub');
        });
    }

    // Diagrams section
    const diagramsTitle = element.querySelector('.md-section-title');
    if (diagramsTitle) diagramsTitle.textContent = t('diagramsTitle');

    // Diagram mode cards
    const cardOptions = element.querySelectorAll('.md-card-option[data-setting="diagram-export-mode"]');
    cardOptions.forEach(card => {
        const value = card.getAttribute('data-value');
        const label = card.querySelector('.md-card-label');
        if (label) {
            if (value === 'copy-as-is') label.textContent = t('diagramCopyAsIs');
            else if (value === 'convert') label.textContent = t('diagramConvert');
            else if (value === 'svg-preview') label.textContent = t('diagramSvgSource');
        }
    });

    // Content checkboxes
    const checkboxLabels: Record<string, keyof typeof import('../i18n').Translations.prototype> = {
        'setting-images': 'optionImages',
        'setting-attachments': 'optionAttachments',
        'setting-metadata': 'optionMetadata',
        'setting-comments': 'optionComments',
        'setting-links': 'optionSourceLinks',
        'setting-frontmatter': 'optionFrontmatter',
        'setting-hierarchical': 'optionHierarchical',
        'setting-wikilinks': 'optionWikilinks',
        'setting-callouts': 'optionCallouts',
        'setting-diagram-source': 'includeSource',
        'setting-diagram-preview': 'includePreview',
        'setting-embed-diagrams': 'embedAsCode',
    };

    Object.entries(checkboxLabels).forEach(([id, key]) => {
        const checkbox = element.querySelector(`#${id}`);
        const label = checkbox?.closest('.md-checkbox-compact')?.querySelector('span');
        if (label) label.textContent = t(key as keyof import('../i18n').Translations);
    });

    // Footer buttons
    const resetBtn = element.querySelector('[data-action="reset-defaults"]');
    if (resetBtn) {
        const span = resetBtn.querySelector('span') || resetBtn;
        if (resetBtn.textContent?.includes('Reset')) {
            resetBtn.innerHTML = resetBtn.innerHTML.replace(/Reset to defaults|Сбросить настройки/, t('resetDefaults'));
        }
    }

    const copyBtn = element.querySelector('#md-copy-btn span');
    if (copyBtn) copyBtn.textContent = t('copy');

    const pdfBtn = element.querySelector('#md-pdf-btn span');
    if (pdfBtn) pdfBtn.textContent = t('pdf');

    const downloadBtn = element.querySelector('#md-download-btn span:not(.md-btn-badge)');
    if (downloadBtn) downloadBtn.textContent = t('download');

    // Header action tooltips
    const themeBtn = element.querySelector('[data-action="toggle-theme"]');
    const refreshBtn = element.querySelector('[data-action="refresh"]');
    const closeBtn = element.querySelector('[data-action="cancel"]');
    if (themeBtn) themeBtn.setAttribute('title', t('toggleTheme'));
    if (refreshBtn) refreshBtn.setAttribute('title', t('refreshTree'));
    if (closeBtn) closeBtn.setAttribute('title', `${t('close')} (Esc)`);

    // Update Copy button state with localized tooltip
    updateCopyButtonState(element);
}

/**
 * Apply filter to tree items
 */
function applyFilter(element: HTMLElement, filter: string): void {
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
