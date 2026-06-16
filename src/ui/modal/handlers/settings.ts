/**
 * Settings management for export modal
 * @module ui/modal/handlers/settings
 */

import type { PageTreeNode, ObsidianExportSettings } from '@/api/types';
import type { ExportSettings } from '@/storage/types';
import { loadSettings, saveSettings, loadObsidianSettings, saveObsidianSettings } from '@/storage/storage';
import { t } from '../../i18n';
import { getSelectedIds } from './tree';

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

    // Update attachment filter input
    const filterInput = element.querySelector('#setting-attachment-filter') as HTMLInputElement;
    if (filterInput) filterInput.value = currentObsidianSettings.attachmentFilter;

    // Update category chip + extension chip checkboxes
    import('@/core/attachment-filter').then(({ parseAttachmentFilter, detectCategoriesFromFilter }) => {
        const filterSet = parseAttachmentFilter(currentObsidianSettings.attachmentFilter);
        const isAll = filterSet.has('*');
        const activeCats = detectCategoriesFromFilter(filterSet);

        element.querySelectorAll<HTMLInputElement>('.md-chip input[data-category]').forEach(cb => {
            const cat = cb.getAttribute('data-category') || '';
            cb.checked = isAll || activeCats.includes(cat);
            cb.closest('.md-chip')?.classList.toggle('active', cb.checked);
        });

        // Sync popular extension chips
        element.querySelectorAll<HTMLInputElement>('.md-chip-ext input[data-extension]').forEach(cb => {
            const ext = cb.getAttribute('data-extension') || '';
            cb.checked = isAll || filterSet.has(ext);
            cb.closest('.md-chip')?.classList.toggle('active', cb.checked);
        });

        const allChip = element.querySelector('#setting-attachments-all') as HTMLInputElement;
        if (allChip) {
            allChip.checked = isAll;
            allChip.closest('.md-chip')?.classList.toggle('active', isAll);
        }
    });

    // Show/hide attachment filter card based on format
    const attachmentCard = element.querySelector('#md-attachment-filter-card') as HTMLElement;
    if (attachmentCard) {
        attachmentCard.style.display = currentObsidianSettings.exportFormat === 'obsidian' ? 'block' : 'none';
    }

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
export function updateDiagramOptionsVisibility(element: HTMLElement): void {
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

// ============================================================================
// Internal helpers used by events.ts
// ============================================================================

/**
 * Get mutable reference to currentSettings (for events.ts settings change handler)
 */
export function getCurrentSettings(): ExportSettings {
    return currentSettings;
}

/**
 * Set currentSettings directly (for events.ts settings change handler)
 */
export function setCurrentSettings(settings: ExportSettings): void {
    currentSettings = settings;
}

/**
 * Get mutable reference to currentObsidianSettings (for events.ts)
 */
export function getCurrentObsidianSettings(): ObsidianExportSettings {
    return currentObsidianSettings;
}

/**
 * Set currentObsidianSettings directly (for events.ts)
 */
export function setCurrentObsidianSettings(settings: ObsidianExportSettings): void {
    currentObsidianSettings = settings;
}
