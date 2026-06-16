/**
 * Modal Controller - Main entry point for export modal
 * @module ui/modal/controller
 */

import type { PageTreeNode } from '@/api/types';
import type {
    ModalController,
    CreateModalOptions,
    ModalState,
} from './types';
import { ModalStateMachine } from './state';
import { renderModal, renderTree, updateModalUI, showProgress, hideProgress, showToast, updateSelectionCount, countNodes, ICONS } from './view';
import type { RenderModalOptions } from './view';
import { setupEventListeners, initSettings, getSettings, setRootNode, enableModalInteraction } from './handlers';
import { calculateTreeStats } from '@/core/export-stats';

// ============================================================================
// Module State
// ============================================================================

/** Current modal element */
let modalElement: HTMLElement | null = null;

/** Current state machine */
let stateMachine: ModalStateMachine | null = null;

/** Cleanup function for event listeners */
let cleanupListeners: (() => void) | null = null;

/** Current theme */
let currentTheme: 'light' | 'dark' = 'light';

/** Current root node */
let currentRootNode: PageTreeNode | null = null;

// ============================================================================
// Helper Functions
// ============================================================================

/** Detect system theme preference */
function getSystemTheme(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Stats generation counter to prevent race conditions */
let statsGeneration = 0;

/** Update statistics display (uses cached sizes — call fetchPageSizes first) */
async function updateStats(element: HTMLElement, rootNode: PageTreeNode): Promise<void> {
    const gen = ++statsGeneration;
    const selectedIds = getSelectedIdsFromElement(element);
    const stats = calculateTreeStats(rootNode, new Set(selectedIds));
    const selectedCount = stats.selectedPages ?? 0;

    // Update pages count
    const pagesEl = element.querySelector('#stat-pages');
    if (pagesEl) pagesEl.textContent = String(selectedCount);

    // Use real sizes from cache (populated by fetchPageSizes on modal open)
    const { calculateSizeEstimate } = await import('@/core/size-estimator');

    // Check if this update is still current
    if (gen !== statsGeneration) return;

    const includeImages = (element.querySelector('#setting-images') as HTMLInputElement)?.checked ?? true;
    const attachmentFilter = (element.querySelector('#setting-attachment-filter') as HTMLInputElement)?.value ?? 'images,documents';

    // For Single MD format, attachments are NOT downloaded — don't count them in estimate
    const platformSelect = element.querySelector('#setting-platform') as HTMLSelectElement;
    const activePill = element.querySelector('.md-pill[data-format].active') as HTMLElement;
    const currentFormat = activePill?.dataset.format ?? platformSelect?.value ?? 'single';
    const isSingleFormat = currentFormat === 'single';

    const estimate = calculateSizeEstimate(selectedIds, {
        includeImages: isSingleFormat ? false : includeImages, // Single MD doesn't download images as files
        attachmentFilter: isSingleFormat ? '' : attachmentFilter,
    });

    // Check again after calculation
    if (gen !== statsGeneration) return;

    // Update images count (real from cache)
    const imagesEl = element.querySelector('#stat-images');
    if (imagesEl) imagesEl.textContent = String(estimate.imageCount);

    // Update diagrams count (real from cache)
    const diagramsEl = element.querySelector('#stat-diagrams');
    if (diagramsEl) diagramsEl.textContent = String(estimate.diagramCount);

    // Update size (real from cache)
    const sizeEl = element.querySelector('#stat-size');
    if (sizeEl) {
        const totalMB = estimate.totalMB;
        sizeEl.textContent = totalMB >= 0.1 ? totalMB.toFixed(1) : '< 0.1';

        // Show breakdown tooltip
        const breakdown = [
            `Text: ${estimate.textMB.toFixed(1)} MB`,
            includeImages ? `Images: ${estimate.imagesMB.toFixed(1)} MB` : null,
            attachmentFilter ? `Attachments: ${estimate.otherMB.toFixed(1)} MB` : null,
        ].filter(Boolean).join(' + ');
        sizeEl.parentElement?.setAttribute('title', breakdown);

        // Warn if large
        const warningEl = element.querySelector('#md-size-warning') as HTMLElement;
        if (warningEl) {
            if (totalMB > 100) {
                warningEl.style.display = 'block';
                warningEl.textContent = `⚠️ Large export (~${totalMB.toFixed(0)} MB). Consider disabling attachments or selecting fewer pages.`;
            } else if (totalMB > 50) {
                warningEl.style.display = 'block';
                warningEl.textContent = `ℹ️ Export size ~${totalMB.toFixed(0)} MB. This may take a while.`;
            } else {
                warningEl.style.display = 'none';
            }
        }
    }
}

/** Get selected IDs from element */
function getSelectedIdsFromElement(element: HTMLElement): string[] {
    const ids: string[] = [];
    element.querySelectorAll<HTMLInputElement>('.md-tree-checkbox:checked').forEach((cb) => {
        const li = cb.closest('li');
        if (cb.dataset.pageId && !li?.classList.contains('hidden')) {
            ids.push(cb.dataset.pageId);
        }
    });
    return ids;
}

/** Get all page IDs from tree (for pre-fetching sizes) */
function flattenTreeIds(node: PageTreeNode): string[] {
    const ids: string[] = [node.id];
    for (const child of node.children) {
        ids.push(...flattenTreeIds(child));
    }
    return ids;
}

// ============================================================================
// Main Factory Function
// ============================================================================

/**
 * Create and show the export modal
 * 
 * @param options - Modal creation options
 * @returns Modal controller for external control
 * 
 * @example
 * ```typescript
 * const modal = createExportModal({
 *   rootNode: pageTree,
 *   rootTitle: 'My Space',
 *   callbacks: {
 *     onAction: async (action, ctx) => {
 *       modal.setState('processing');
 *       modal.showProgress('content', 0, ctx.selectedIds.length);
 *       // ... do work ...
 *       modal.setState('ready');
 *       modal.showToast('Done!');
 *     },
 *     onRefresh: async () => newTree,
 *     onClose: () => console.log('Modal closed')
 *   }
 * });
 * ```
 */
export function createExportModal(options: CreateModalOptions): ModalController {
    const { rootNode, rootTitle, callbacks } = options;

    // Cleanup any existing modal
    if (modalElement) {
        cleanupListeners?.();
        modalElement.remove();
    }

    // Initialize state
    stateMachine = new ModalStateMachine();
    currentRootNode = rootNode;
    currentTheme = getSystemTheme();

    // Initialize settings
    initSettings(rootNode);
    const { settings, obsidianSettings } = getSettings();

    // Create modal element
    const modal = document.createElement('div');
    modal.id = 'md-export-modal';
    modal.setAttribute('data-theme', currentTheme);
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'md-modal-title');

    // Render modal HTML
    const renderOptions: RenderModalOptions = {
        rootNode,
        rootTitle,
        theme: currentTheme,
        settings,
        obsidianSettings: {
            ...obsidianSettings,
            // Ensure diagramTargetFormat is compatible with view types
            diagramTargetFormat: obsidianSettings.diagramTargetFormat === 'wikilink'
                ? 'mermaid'
                : obsidianSettings.diagramTargetFormat,
        },
    };
    modal.innerHTML = renderModal(renderOptions);

    modalElement = modal;

    // Create controller
    const controller: ModalController = {
        show: () => {
            if (modalElement && !document.body.contains(modalElement)) {
                document.body.appendChild(modalElement);
                stateMachine?.setState('ready');

                // Focus search input
                setTimeout(() => {
                    const searchInput = modalElement?.querySelector('#md-search-input') as HTMLInputElement;
                    searchInput?.focus();
                }, 100);
            }
        },

        close: () => {
            cleanupListeners?.();
            cleanupListeners = null;

            if (modalElement) {
                modalElement.remove();
                modalElement = null;
            }

            stateMachine?.reset();
            stateMachine = null;
            currentRootNode = null;

            callbacks.onClose?.();
        },

        setState: (state: ModalState) => {
            if (!stateMachine || !modalElement) return;

            const success = stateMachine.setState(state);
            if (success) {
                updateModalUI(modalElement, state);

                // Re-enable interaction when returning to ready state
                if (state === 'ready') {
                    enableModalInteraction(modalElement, { download: ICONS.download, copy: ICONS.copy });
                }
            }
        },

        getState: () => {
            return stateMachine?.getState() ?? 'idle';
        },

        showProgress: (phase: string, current: number, total: number) => {
            if (modalElement) {
                showProgress(modalElement, phase, current, total);
            }
        },

        hideProgress: () => {
            if (modalElement) {
                hideProgress(modalElement);
            }
        },

        showToast: (message: string) => {
            if (modalElement) {
                showToast(modalElement, message);
            }
        },

        updateTree: (node: PageTreeNode) => {
            if (!modalElement) return;

            currentRootNode = node;
            setRootNode(node);

            const treeRoot = modalElement.querySelector('#md-tree-root');
            if (treeRoot) {
                treeRoot.innerHTML = renderTree([node]);
            }

            const pageCount = modalElement.querySelector('.md-page-count');
            if (pageCount) {
                pageCount.textContent = `${countNodes(node)} pages`;
            }

            updateSelectionCount(modalElement);
            updateStats(modalElement, node);
        },
    };

    // Setup event listeners with dependencies
    cleanupListeners = setupEventListeners({
        element: modal,
        rootNode,
        callbacks,
        getState: () => stateMachine?.getState() ?? 'idle',
        setState: (state) => controller.setState(state),
        close: () => controller.close(),
        updateTree: (node) => controller.updateTree(node),
        updateStats: () => {
            if (modalElement && currentRootNode) {
                updateStats(modalElement, currentRootNode);
            }
        },
    });

    // Subscribe to state changes for UI updates
    stateMachine.subscribe((event) => {
        console.log(`[Modal] State: ${event.from} -> ${event.to}`);
    });

    // Show modal
    controller.show();

    // Initial UI updates
    updateSelectionCount(modal);
    updateStats(modal, rootNode);

    // Fetch real attachment sizes in background (populates cache for updateStats)
    const allPageIds = flattenTreeIds(rootNode);
    void import('@/core/size-estimator').then(({ fetchPageSizes }) => {
        fetchPageSizes(allPageIds).then(() => {
            if (modalElement && currentRootNode) {
                updateStats(modalElement, currentRootNode);
            }
        });
    });

    return controller;
}

// ============================================================================
// Legacy API Compatibility
// ============================================================================

/** 
 * Close the current modal (legacy API)
 * @deprecated Use controller.close() instead
 */
export function closeModal(): void {
    if (modalElement) {
        cleanupListeners?.();
        modalElement.remove();
        modalElement = null;
        stateMachine?.reset();
        stateMachine = null;
    }
}

/**
 * Update modal progress (legacy API)
 * @deprecated Use controller.showProgress() instead
 */
export function updateModalProgress(completed: number, total: number, phase: string, currentPage?: string): void {
    if (modalElement) {
        showProgress(modalElement, phase, completed, total, currentPage);
    }
}

/**
 * Show toast notification (legacy API)
 * @deprecated Use controller.showToast() instead
 */
export function showToastLegacy(message?: string): void {
    if (modalElement && message) {
        showToast(modalElement, message);
    }
}

/**
 * Enable modal after operation (legacy API)
 * @deprecated Use controller.setState('ready') instead
 */
export function enableModal(): void {
    if (modalElement && stateMachine) {
        stateMachine.setState('ready');
        enableModalInteraction(modalElement, { download: ICONS.download, copy: ICONS.copy });
    }
}
