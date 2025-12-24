/**
 * Modal View Layer - HTML/CSS rendering
 * Two-column layout redesign
 * @module ui/modal/view
 */

import type { PageTreeNode } from '@/api/types';
import type { ModalState } from './types';
import { t, getLocale, type Translations } from '../i18n';

// ============================================================================
// SVG Icons
// ============================================================================

export const ICONS = {
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
  obsidian: `<svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
  sun: `<svg viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 000-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>`,
  moon: `<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>`,
  expand: `<svg viewBox="0 0 24 24"><path d="M12 5.83L15.17 9l1.41-1.41L12 3 7.41 7.59 8.83 9 12 5.83zm0 12.34L8.83 15l-1.41 1.41L12 21l4.59-4.59L15.17 15 12 18.17z"/></svg>`,
  collapse: `<svg viewBox="0 0 24 24"><path d="M7.41 18.59L8.83 20 12 16.83 15.17 20l1.41-1.41L12 14l-4.59 4.59zm9.18-13.18L15.17 4 12 7.17 8.83 4 7.41 5.41 12 10l4.59-4.59z"/></svg>`,
  reset: `<svg viewBox="0 0 24 24"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>`,
  language: `<svg viewBox="0 0 24 24"><path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>`,
};

// ============================================================================
// Helper Functions
// ============================================================================

/** Escape HTML special characters */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/** Count total nodes in tree */
export function countNodes(node: PageTreeNode): number {
  let count = 1;
  for (const child of node.children) {
    count += countNodes(child);
  }
  return count;
}


// ============================================================================
// Tree Rendering
// ============================================================================

/** Build tree HTML recursively */
export function renderTree(nodes: PageTreeNode[], level = 0): string {
  let html = `<ul${level === 0 ? '' : ''}>`;

  for (const node of nodes) {
    const hasChildren = node.children.length > 0;
    const childCount = hasChildren ? countNodes(node) - 1 : 0;
    const errorClass = node.error ? ' error' : '';
    const togglerClass = hasChildren ? 'md-tree-toggler expanded' : 'md-tree-toggler empty';

    const iconClass = 'md-tree-icon page';
    const icon = ICONS.page;

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
      html += renderTree(node.children, level + 1);
    }

    html += '</li>';
  }

  html += '</ul>';
  return html;
}


// ============================================================================
// Modal HTML Rendering - Types
// ============================================================================

/** Render options for modal */
export interface RenderModalOptions {
  readonly rootNode: PageTreeNode;
  readonly rootTitle: string;
  readonly theme: 'light' | 'dark';
  readonly settings: {
    readonly includeImages: boolean;
    readonly includeMetadata: boolean;
    readonly includeComments: boolean;
    readonly includeSourceLinks: boolean;
  };
  readonly obsidianSettings: {
    readonly exportFormat: 'single' | 'obsidian';
    readonly folderStructure: 'flat' | 'hierarchical';
    readonly linkStyle: 'markdown' | 'wikilink';
    readonly useObsidianCallouts: boolean;
    readonly includeFrontmatter: boolean;
    readonly exportDiagrams: boolean;
    readonly diagramExportMode: 'copy-as-is' | 'convert' | 'svg-preview';
    readonly diagramTargetFormat: 'mermaid' | 'drawio-xml';
    readonly embedDiagramsAsCode: boolean;
    readonly includeDiagramSource: boolean;
    readonly includeDiagramPreview: boolean;
    readonly diagramPreviewScale: 1 | 2 | 3;
    readonly downloadAttachments: boolean;
  };
}


// ============================================================================
// Main Modal Render Function - Two Column Layout
// ============================================================================

/** Render the complete modal HTML with two-column layout */
export function renderModal(options: RenderModalOptions): string {
  const { rootNode, rootTitle, theme, settings, obsidianSettings } = options;

  return `
    <div id="md-export-modal-content" class="md-modal-content">
      ${renderHeader(rootTitle, theme)}
      <div class="md-modal-body">
        ${renderSourcePanel(rootNode)}
        ${renderConfigPanel(settings, obsidianSettings)}
      </div>
      ${renderProgressSection()}
      ${renderToast()}
      ${renderFooter()}
    </div>
  `;
}


// ============================================================================
// Header - Compact with Icon Buttons
// ============================================================================

/** Render compact header with icon-only actions */
function renderHeader(rootTitle: string, theme: 'light' | 'dark'): string {
  const locale = getLocale();
  return `
    <div class="md-modal-header">
      <div class="md-header-row">
        <h3 class="md-header-title">${t('title')}</h3>
        <div class="md-header-actions">
          <button class="md-btn-lang" data-action="toggle-locale" title="EN / RU">
            ${locale.toUpperCase()}
          </button>
          <button class="md-btn-icon" data-action="toggle-theme" title="${t('toggleTheme')}">
            ${theme === 'dark' ? ICONS.sun : ICONS.moon}
          </button>
          <button class="md-btn-icon" data-action="refresh" title="${t('refreshTree')}">
            ${ICONS.refresh}
          </button>
          <button class="md-btn-icon md-close-btn" data-action="cancel" title="${t('close')} (Esc)">
            ${ICONS.close}
          </button>
        </div>
      </div>
      <p class="md-header-subtitle">
        ${ICONS.folder.replace('<svg', '<svg class="icon"')}
        <span>${escapeHtml(rootTitle)}</span>
      </p>
    </div>
  `;
}


// ============================================================================
// Left Column - Source Panel
// ============================================================================

/** Render source panel (left column) with tree, search, filters */
function renderSourcePanel(rootNode: PageTreeNode): string {
  return `
    <div class="md-source-panel">
      <!-- Search Bar -->
      <div class="md-search-bar">
        <span class="md-search-icon">${ICONS.search}</span>
        <input type="text" id="md-search-input" placeholder="${t('searchPlaceholder')}" autocomplete="off">
        <button class="md-search-clear" id="md-search-clear" style="display:none">${ICONS.close}</button>
      </div>
      
      <!-- Filter Tabs + Tree Controls -->
      <div class="md-source-toolbar">
        <div class="md-filter-tabs">
          <button class="md-filter-tab active" data-filter="all">${t('filterAll')}</button>
          <button class="md-filter-tab" data-filter="selected">${t('filterSelected')}</button>
          <button class="md-filter-tab" data-filter="errors">${t('filterErrors')}</button>
        </div>
        <div class="md-tree-controls">
          <button class="md-btn-icon-sm" data-action="expand" title="${t('expandAll')}">
            ${ICONS.expand}
          </button>
          <button class="md-btn-icon-sm" data-action="collapse" title="${t('collapseAll')}">
            ${ICONS.collapse}
          </button>
        </div>
      </div>
      
      <!-- Tree Container -->
      <div class="md-tree-container" id="md-tree-container">
        <div class="md-tree" id="md-tree-root">${renderTree([rootNode])}</div>
      </div>
      
      <!-- Status Bar -->
      ${renderStatusBar()}
    </div>
  `;
}

/** Render compact status bar at bottom of source panel */
function renderStatusBar(): string {
  return `
    <div class="md-status-bar">
      <span class="md-status-item">
        <span id="stat-pages">0</span> ${t('page')}
      </span>
      <span class="md-status-divider">•</span>
      <span class="md-status-item">
        <span id="stat-images">0</span> ${t('images')}
      </span>
      <span class="md-status-divider">•</span>
      <span class="md-status-item">
        <span id="stat-diagrams">0</span> ${t('diagrams')}
      </span>
      <span class="md-status-divider">•</span>
      <span class="md-status-item">
        <span class="md-status-approx">~</span><span id="stat-size">0.0</span> MB
      </span>
    </div>
  `;
}


// ============================================================================
// Right Column - Config Panel
// ============================================================================

/** Render config panel (right column) with all settings */
function renderConfigPanel(
  settings: RenderModalOptions['settings'],
  obsidianSettings: RenderModalOptions['obsidianSettings']
): string {
  return `
    <div class="md-config-panel">
      ${renderPlatformSelect(obsidianSettings)}
      ${renderDiagramsSection(obsidianSettings)}
      ${renderContentSettings(settings, obsidianSettings)}
    </div>
  `;
}

/** Render platform/format selector dropdown */
function renderPlatformSelect(obsidianSettings: RenderModalOptions['obsidianSettings']): string {
  const platforms = [
    { value: 'obsidian', label: t('presetObsidian'), desc: t('presetObsidianDesc') },
    { value: 'single', label: t('presetSingle'), desc: t('presetSingleDesc') },
    { value: 'github', label: t('presetGithub'), desc: t('presetGithubDesc') },
  ];

  const current = obsidianSettings.exportFormat;
  const currentPlatform = platforms.find(p => p.value === current) || platforms[0];

  return `
    <div class="md-config-section">
      <label class="md-config-label">${t('exportPreset')}</label>
      <div class="md-select-wrapper">
        <select id="setting-platform" class="md-select" data-setting="platform">
          ${platforms.map(p => `
            <option value="${p.value}" ${p.value === current ? 'selected' : ''}>
              ${p.label}
            </option>
          `).join('')}
        </select>
      </div>
      <p class="md-config-hint" id="platform-hint">${currentPlatform.desc}</p>
    </div>
  `;
}


/** Render simplified diagrams section */
function renderDiagramsSection(obsidianSettings: RenderModalOptions['obsidianSettings']): string {
  const exportModes = [
    { value: 'copy-as-is', label: t('diagramCopyAsIs'), icon: '📋', desc: t('diagramCopyAsIsDesc') },
    { value: 'convert', label: t('diagramConvert'), icon: '🔄', desc: t('diagramConvertDesc') },
    { value: 'svg-preview', label: t('diagramSvgSource'), icon: '🖼️', desc: t('diagramSvgSourceDesc') },
  ];

  const targetFormats = [
    { value: 'mermaid', label: 'Mermaid' },
    { value: 'drawio-xml', label: 'Draw.io XML' },
  ];

  // Determine which checkboxes should be disabled based on mode
  const mode = obsidianSettings.diagramExportMode;
  const sourceDisabled = mode === 'copy-as-is'; // copy-as-is always includes source
  const previewDisabled = mode === 'copy-as-is'; // copy-as-is has no preview
  const embedDisabled = mode === 'svg-preview'; // svg-preview is always embedded

  return `
    <div class="md-config-section">
      <div class="md-section-header">
        <span class="md-section-icon">🎨</span>
        <span class="md-section-title">${t('diagramsTitle')}</span>
        <label class="md-toggle-switch">
          <input type="checkbox" id="setting-diagrams" ${obsidianSettings.exportDiagrams ? 'checked' : ''}>
          <span class="md-toggle-slider"></span>
        </label>
      </div>
      
      <div class="md-diagrams-options ${obsidianSettings.exportDiagrams ? '' : 'disabled'}" id="md-diagrams-options">
        <!-- Export Mode Cards -->
        <div class="md-card-select" id="diagram-export-mode">
          ${exportModes.map(m => `
            <button class="md-card-option ${obsidianSettings.diagramExportMode === m.value ? 'active' : ''}" 
                    data-value="${m.value}" data-setting="diagram-export-mode" title="${m.desc}">
              <span class="md-card-icon">${m.icon}</span>
              <span class="md-card-label">${m.label}</span>
            </button>
          `).join('')}
        </div>
        
        <!-- Target Format (shown only for convert mode) -->
        <div class="md-inline-option" id="convert-format-options" 
             style="display: ${obsidianSettings.diagramExportMode === 'convert' ? 'flex' : 'none'};">
          <span class="md-option-label">${t('diagramFormat')}:</span>
          <div class="md-toggle-group">
            ${targetFormats.map(fmt => `
              <button class="md-toggle-btn ${obsidianSettings.diagramTargetFormat === fmt.value ? 'active' : ''}"
                      data-value="${fmt.value}" data-setting="diagram-format">
                ${fmt.label}
              </button>
            `).join('')}
          </div>
        </div>
        
        <!-- Diagram Options Grid with conditional disable -->
        <div class="md-options-grid md-options-2col">
          <label class="md-checkbox-compact ${sourceDisabled ? 'disabled' : ''}">
            <input type="checkbox" id="setting-diagram-source" 
                   ${obsidianSettings.includeDiagramSource || sourceDisabled ? 'checked' : ''} 
                   ${sourceDisabled ? 'disabled' : ''}>
            <span>${t('includeSource')}</span>
          </label>
          <label class="md-checkbox-compact ${previewDisabled ? 'disabled' : ''}">
            <input type="checkbox" id="setting-diagram-preview" 
                   ${obsidianSettings.includeDiagramPreview && !previewDisabled ? 'checked' : ''} 
                   ${previewDisabled ? 'disabled' : ''}>
            <span>${t('includePreview')}</span>
          </label>
          <label class="md-checkbox-compact ${embedDisabled ? 'disabled' : ''}">
            <input type="checkbox" id="setting-embed-diagrams" 
                   ${obsidianSettings.embedDiagramsAsCode || embedDisabled ? 'checked' : ''} 
                   ${embedDisabled ? 'disabled' : ''}>
            <span>${t('embedAsCode')}</span>
          </label>
        </div>
      </div>
    </div>
  `;
}


/** Render content settings as checkbox grid */
function renderContentSettings(
  settings: RenderModalOptions['settings'],
  obsidianSettings: RenderModalOptions['obsidianSettings']
): string {
  return `
    <div class="md-config-section">
      <div class="md-section-header">
        <span class="md-section-icon">${ICONS.settings.replace('<svg', '<svg class="icon"')}</span>
        <span class="md-section-title">${t('contentTitle')}</span>
      </div>
      
      <div class="md-options-grid md-options-2col">
        <label class="md-checkbox-compact">
          <input type="checkbox" id="setting-images" ${settings.includeImages ? 'checked' : ''}>
          <span>${t('optionImages')}</span>
        </label>
        <label class="md-checkbox-compact">
          <input type="checkbox" id="setting-attachments" ${obsidianSettings.downloadAttachments ? 'checked' : ''}>
          <span>${t('optionAttachments')}</span>
        </label>
        <label class="md-checkbox-compact">
          <input type="checkbox" id="setting-metadata" ${settings.includeMetadata ? 'checked' : ''}>
          <span>${t('optionMetadata')}</span>
        </label>
        <label class="md-checkbox-compact">
          <input type="checkbox" id="setting-comments" ${settings.includeComments ? 'checked' : ''}>
          <span>${t('optionComments')}</span>
        </label>
        <label class="md-checkbox-compact">
          <input type="checkbox" id="setting-links" ${settings.includeSourceLinks ? 'checked' : ''}>
          <span>${t('optionSourceLinks')}</span>
        </label>
        <label class="md-checkbox-compact">
          <input type="checkbox" id="setting-frontmatter" ${obsidianSettings.includeFrontmatter ? 'checked' : ''}>
          <span>${t('optionFrontmatter')}</span>
        </label>
      </div>
      
      <!-- Obsidian-specific options -->
      <div class="md-obsidian-options" id="md-obsidian-options" 
           style="display: ${obsidianSettings.exportFormat === 'obsidian' ? 'block' : 'none'};">
        <div class="md-options-grid md-options-2col">
          <label class="md-checkbox-compact">
            <input type="checkbox" id="setting-hierarchical" ${obsidianSettings.folderStructure === 'hierarchical' ? 'checked' : ''}>
            <span>${t('optionHierarchical')}</span>
          </label>
          <label class="md-checkbox-compact">
            <input type="checkbox" id="setting-wikilinks" ${obsidianSettings.linkStyle === 'wikilink' ? 'checked' : ''}>
            <span>${t('optionWikilinks')}</span>
          </label>
          <label class="md-checkbox-compact">
            <input type="checkbox" id="setting-callouts" ${obsidianSettings.useObsidianCallouts ? 'checked' : ''}>
            <span>${t('optionCallouts')}</span>
          </label>
        </div>
      </div>
    </div>
  `;
}


// ============================================================================
// Progress, Toast, Footer
// ============================================================================

/** Render progress section */
function renderProgressSection(): string {
  return `
    <div class="md-progress-section" id="md-progress-section" style="display: none;">
      <div class="md-progress-label">
        <span id="md-progress-text">${t('progressPreparing')}</span>
        <span id="md-progress-count"></span>
      </div>
      <div class="md-progress-bar">
        <div class="md-progress-fill" id="md-progress-fill"></div>
      </div>
      <div class="md-progress-current" id="md-progress-current" style="display: none;">
        <span class="md-progress-page-icon">📄</span>
        <span class="md-progress-page-name" id="md-progress-page-name"></span>
      </div>
    </div>
  `;
}

/** Render toast notification */
function renderToast(): string {
  return `
    <div class="md-toast" id="md-toast" style="display: none;">
      ${ICONS.check}
      <span>${t('copiedToClipboard')}</span>
    </div>
  `;
}

/** Render simplified footer */
function renderFooter(): string {
  return `
    <div class="md-modal-footer">
      <div class="md-footer-left">
        <button class="md-btn-text" data-action="reset-defaults" title="${t('resetDefaults')}">
          ${ICONS.reset.replace('<svg', '<svg class="icon"')}
          ${t('resetDefaults')}
        </button>
      </div>
      <div class="md-footer-right">
        <button class="md-btn md-btn-secondary" data-action="copy" id="md-copy-btn" title="${t('copy')}">
          ${ICONS.copy}
          <span>${t('copy')}</span>
        </button>
        <button class="md-btn md-btn-secondary" data-action="pdf" id="md-pdf-btn" title="${t('pdf')}">
          <span>${t('pdf')}</span>
        </button>
        <button class="md-btn md-btn-primary" data-action="download" id="md-download-btn" title="${t('download')}">
          ${ICONS.download}
          <span>${t('download')}</span>
          <span class="md-btn-badge" id="md-download-badge">0</span>
        </button>
      </div>
    </div>
  `;
}


// ============================================================================
// UI Update Functions
// ============================================================================

/** Get phase label for progress display */
function getPhaseLabel(phase: string): string {
  const labels: Record<string, keyof Translations> = {
    tree: 'progressScanning',
    content: 'progressLoading',
    convert: 'progressConverting',
    vault: 'progressCreatingVault',
    attachments: 'progressAttachments',
    diagrams: 'progressDiagrams',
  };
  const key = labels[phase];
  if (key) return t(key);
  return phase;
}

/** Update UI based on state */
export function updateModalUI(element: HTMLElement, state: ModalState): void {
  const downloadBtn = element.querySelector('#md-download-btn') as HTMLButtonElement;
  const copyBtn = element.querySelector('#md-copy-btn') as HTMLButtonElement;
  const pdfBtn = element.querySelector('#md-pdf-btn') as HTMLButtonElement;

  const isProcessing = state === 'processing';

  // Disable/enable buttons
  if (downloadBtn) {
    downloadBtn.disabled = isProcessing;
    if (isProcessing) {
      downloadBtn.innerHTML = '<span>Processing...</span>';
    } else {
      downloadBtn.innerHTML = `${ICONS.download}<span>Download</span><span class="md-btn-badge" id="md-download-badge">0</span>`;
    }
  }

  if (copyBtn) copyBtn.disabled = isProcessing;
  if (pdfBtn) pdfBtn.disabled = isProcessing;

  // Disable tree checkboxes during processing
  element.querySelectorAll<HTMLInputElement>('.md-tree-checkbox').forEach(cb => {
    cb.disabled = isProcessing;
  });

  // Disable control buttons
  element.querySelectorAll<HTMLButtonElement>('.md-tree-controls button').forEach(btn => {
    btn.disabled = isProcessing;
  });
}

/** Show progress bar */
export function showProgress(
  element: HTMLElement,
  phase: string,
  current: number,
  total: number,
  currentPage?: string
): void {
  const section = element.querySelector('#md-progress-section') as HTMLElement;
  const text = element.querySelector('#md-progress-text') as HTMLElement;
  const count = element.querySelector('#md-progress-count') as HTMLElement;
  const fill = element.querySelector('#md-progress-fill') as HTMLElement;
  const currentEl = element.querySelector('#md-progress-current') as HTMLElement;
  const pageNameEl = element.querySelector('#md-progress-page-name') as HTMLElement;

  if (!section || !text || !fill) return;

  section.style.display = 'block';
  text.textContent = getPhaseLabel(phase);

  if (total > 0) {
    count.textContent = `${current}/${total}`;
    const percent = Math.round((current / total) * 100);
    fill.style.width = `${percent}%`;
    fill.classList.remove('indeterminate');
  } else {
    count.textContent = '';
    fill.classList.add('indeterminate');
  }

  // Show current page being processed
  if (currentPage && currentEl && pageNameEl) {
    currentEl.style.display = 'flex';
    pageNameEl.textContent = currentPage;
  } else if (currentEl) {
    currentEl.style.display = 'none';
  }
}

/** Hide progress bar */
export function hideProgress(element: HTMLElement): void {
  const section = element.querySelector('#md-progress-section') as HTMLElement;
  if (section) section.style.display = 'none';
}


/** Show toast notification */
export function showToast(element: HTMLElement, message: string): void {
  const toast = element.querySelector('#md-toast') as HTMLElement;
  if (!toast) return;

  const span = toast.querySelector('span');
  if (span) span.textContent = message;

  toast.style.display = 'flex';
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.style.display = 'none';
    }, 300);
  }, 2000);
}

/** Update selection count */
export function updateSelectionCount(element: HTMLElement): void {
  const checkboxes = element.querySelectorAll<HTMLInputElement>('.md-tree-checkbox:checked');
  let count = 0;
  checkboxes.forEach((cb) => {
    if (!cb.closest('li')?.classList.contains('hidden')) count++;
  });

  // Update badge on download button
  const badge = element.querySelector('#md-download-badge');
  if (badge) {
    badge.textContent = String(count);
    badge.classList.toggle('has-count', count > 0);
  }

  // Update pages stat
  const pagesStat = element.querySelector('#stat-pages');
  if (pagesStat) {
    pagesStat.textContent = String(count);
  }
}

/** Get selected page IDs */
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

/** Update stats display */
export function updateStats(
  element: HTMLElement,
  stats: { pages: number; images: number; diagrams: number; sizeMB: number }
): void {
  const pagesEl = element.querySelector('#stat-pages');
  const imagesEl = element.querySelector('#stat-images');
  const diagramsEl = element.querySelector('#stat-diagrams');
  const sizeEl = element.querySelector('#stat-size');

  if (pagesEl) pagesEl.textContent = String(stats.pages);
  if (imagesEl) imagesEl.textContent = String(stats.images);
  if (diagramsEl) diagramsEl.textContent = String(stats.diagrams);
  if (sizeEl) sizeEl.textContent = stats.sizeMB.toFixed(1);
}
