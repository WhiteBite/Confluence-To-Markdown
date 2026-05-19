/**
 * Event listeners setup for export modal
 * @module ui/modal/handlers/events
 */

import type { PageTreeNode, ExportPreset } from '@/api/types';
import type { ModalCallbacks, ModalAction, ModalContext, ModalState } from '../types';
import { loadSettings, saveSettings, loadObsidianSettings, saveObsidianSettings, applyPreset } from '@/storage/storage';
import { t, toggleLocale } from '../../i18n';
import type { Translations } from '../../i18n';
import {
    saveCurrentSettings,
    updateObsidianSettingsUI,
    updateCopyButtonState,
    updateDiagramOptionsVisibility,
    setRootNode,
    getCurrentSettings,
    setCurrentSettings,
    getCurrentObsidianSettings,
    setCurrentObsidianSettings,
} from './settings';
import { getSelectedIds, updateSelectionCount, filterTree, applyFilter } from './tree';
import { shakeElement, isInputFocused, togglePanel, handleToggleTheme } from './interaction';

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
// Event Handlers Setup
// ============================================================================

/**
 * Setup all event listeners for the modal
 * @returns Cleanup function to remove all listeners
 */
export function setupEventListeners(deps: HandlerDependencies): () => void {
    const { element, callbacks, setState, close, updateTree, updateStats } = deps;

    // Store cleanup functions
    const cleanups: (() => void)[] = [];

    // -------------------------------------------------------------------------
    // Format Pills & Scope Toggle Handlers
    // -------------------------------------------------------------------------
    const handleFormatPillClick = (e: Event) => {
        const target = e.target as HTMLElement;
        const pill = target.closest('.md-pill[data-format]') as HTMLElement;
        if (!pill) return;

        const format = pill.dataset.format as 'single' | 'obsidian' | 'backup';
        const currentObsidianSettings = getCurrentObsidianSettings();

        // Update pill active states
        element.querySelectorAll('.md-pill[data-format]').forEach(btn => {
            btn.classList.toggle('active', btn === pill);
        });

        if (format === 'backup') {
            // Backup mode: hide most config, show minimal
            currentObsidianSettings.exportFormat = 'single'; // internally use single for storage
            const contentCard = element.querySelector('#md-content-card') as HTMLElement;
            const diagramsCard = element.querySelector('#md-diagrams-card') as HTMLElement;
            const obsidianSection = element.querySelector('#md-obsidian-options') as HTMLElement;
            if (contentCard) contentCard.style.display = 'none';
            if (diagramsCard) diagramsCard.style.display = 'none';
            if (obsidianSection) obsidianSection.style.display = 'none';

            // Update download button to indicate backup
            const downloadBtn = element.querySelector('#md-download-btn') as HTMLButtonElement;
            if (downloadBtn) {
                downloadBtn.setAttribute('data-action', 'backup');
            }
        } else {
            // Normal mode: show all config
            currentObsidianSettings.exportFormat = format;
            const contentCard = element.querySelector('#md-content-card') as HTMLElement;
            const diagramsCard = element.querySelector('#md-diagrams-card') as HTMLElement;
            const obsidianSection = element.querySelector('#md-obsidian-options') as HTMLElement;
            if (contentCard) contentCard.style.display = '';
            if (diagramsCard) diagramsCard.style.display = '';
            if (obsidianSection) obsidianSection.style.display = format === 'obsidian' ? 'block' : 'none';

            // Restore download button action
            const downloadBtn = element.querySelector('#md-download-btn') as HTMLButtonElement;
            if (downloadBtn) {
                downloadBtn.setAttribute('data-action', 'download');
            }
        }

        // Update hidden select for compatibility
        const platformSelect = element.querySelector('#setting-platform') as HTMLSelectElement;
        if (platformSelect) {
            platformSelect.value = currentObsidianSettings.exportFormat;
        }

        updateCopyButtonState(element);
        saveObsidianSettings(currentObsidianSettings);
    };

    element.addEventListener('click', handleFormatPillClick);
    cleanups.push(() => element.removeEventListener('click', handleFormatPillClick));

    // Scope toggle (Page / Space)
    const handleScopeToggle = async (e: Event) => {
        const target = e.target as HTMLElement;
        const scopeBtn = target.closest('.md-scope-btn[data-scope]') as HTMLElement;
        if (!scopeBtn) return;
        if (scopeBtn.classList.contains('active')) return;

        const scope = scopeBtn.dataset.scope as 'page' | 'space';

        // Update active state
        element.querySelectorAll('.md-scope-btn').forEach(btn => {
            btn.classList.toggle('active', btn === scopeBtn);
        });

        // Call scope change callback
        if (callbacks.onScopeChange) {
            scopeBtn.classList.add('loading');
            try {
                const newTree = await callbacks.onScopeChange(scope);
                if (newTree) {
                    setRootNode(newTree);
                    updateTree(newTree);
                    updateSelectionCount(element);
                    updateStats();
                }
            } finally {
                scopeBtn.classList.remove('loading');
            }
        }
    };

    element.addEventListener('click', handleScopeToggle);
    cleanups.push(() => element.removeEventListener('click', handleScopeToggle));

    // -------------------------------------------------------------------------
    // Action Button Handler
    // -------------------------------------------------------------------------
    const handleActionClick = async (e: Event) => {
        const target = e.target as HTMLElement;
        const btn = target.closest('[data-action]') as HTMLButtonElement;
        if (!btn) return;

        const action = btn.dataset.action;
        if (!action) return;

        if (action === 'cancel') {
            close();
            return;
        }

        // Ignore if THIS button is already processing
        if (btn.hasAttribute('data-processing')) {
            return;
        }

        // Export actions
        if (action === 'download' || action === 'copy' || action === 'pdf' || action === 'backup') {
            const selectedIds = getSelectedIds(element);
            if (selectedIds.length === 0) {
                shakeElement(element.querySelector('.md-selection-count'));
                return;
            }

            saveCurrentSettings(element);
            setState('processing');

            // Mark this specific button as processing — others stay clickable
            const originalHtml = btn.innerHTML;
            btn.setAttribute('data-processing', 'true');
            btn.disabled = true;
            btn.innerHTML = `<span style="opacity:0.8">⏳ ${t('processing')}...</span>`;

            // Disable checkboxes only (selection must not change during export)
            element.querySelectorAll<HTMLInputElement>('.md-tree-checkbox').forEach((cb) => {
                cb.disabled = true;
            });

            // Show progress section
            const progressSection = element.querySelector('#md-progress-section') as HTMLElement;
            if (progressSection) {
                progressSection.style.display = 'block';
            }

            // Debug: log export format decision
            const currentObsidianSettings = getCurrentObsidianSettings();
            const currentSettings = getCurrentSettings();
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

            try {
                // Let the callback handle the action
                await callbacks.onAction(modalAction, ctx);

                // Brief success flash on the button
                if (document.body.contains(element) && document.body.contains(btn)) {
                    btn.innerHTML = `<span style="color:var(--md-success)">✅ ${action === 'copy' ? 'Copied!' : 'Done!'}</span>`;
                    await new Promise((r) => setTimeout(r, 800));
                }
            } catch (error) {
                console.error('[Modal] Action failed:', error);
                // Briefly show error on the button
                btn.innerHTML = `<span style="color:var(--md-danger)">❌ ${t('exportError')}</span>`;
                await new Promise((r) => setTimeout(r, 1500));
            } finally {
                // ALWAYS restore UI — even if callback threw or modal was closed
                btn.removeAttribute('data-processing');
                btn.disabled = false;

                if (document.body.contains(element)) {
                    btn.innerHTML = originalHtml;

                    // Re-enable checkboxes
                    element.querySelectorAll<HTMLInputElement>('.md-tree-checkbox').forEach((cb) => {
                        cb.disabled = false;
                    });

                    // If no other button is still processing, return to ready & hide progress
                    const stillProcessing = element.querySelector('[data-processing]');
                    if (!stillProcessing) {
                        setState('ready');
                        if (progressSection) {
                            progressSection.style.display = 'none';
                        }
                    }
                }
            }
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
            setCurrentSettings(loadSettings());
            setCurrentObsidianSettings(loadObsidianSettings());
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
        const currentObsidianSettings = getCurrentObsidianSettings();

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
            setCurrentObsidianSettings(applyPreset(presetName));
            updateObsidianSettingsUI(element);
            saveObsidianSettings(getCurrentObsidianSettings());
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
            const currentObsidianSettings = getCurrentObsidianSettings();
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
        const currentSettings = getCurrentSettings();
        const currentObsidianSettings = getCurrentObsidianSettings();
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
        } else if (target.id === 'setting-all-attachments') {
            currentObsidianSettings.exportAllAttachments = target.checked;
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
// Localization
// ============================================================================

/**
 * Update all localized text in the modal UI
 */
export function updateLocalizedText(element: HTMLElement): void {
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
    const checkboxLabels: Record<string, keyof Translations> = {
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
        if (label) label.textContent = t(key as keyof Translations);
    });

    // Footer buttons
    const resetBtn = element.querySelector('[data-action="reset-defaults"]');
    if (resetBtn) {
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
