/**
 * Modal module exports
 * @module ui/modal
 */

// Types
export type {
    ModalState,
    ModalAction,
    ModalContext,
    ModalCallbacks,
    ModalController,
    CreateModalOptions,
    ProgressInfo,
    ToastType,
    ToastOptions,
    StateChangeEvent,
    StateChangeListener,
} from './types';

// State machine
export { ModalStateMachine, createModalStateMachine } from './state';

// Controller (main API)
export {
    createExportModal,
    closeModal,
    updateModalProgress,
    showToastLegacy as showToast,
    enableModal,
} from './controller';

// Handlers (for advanced usage)
export type { HandlerDependencies } from './handlers';
export {
    initSettings,
    getSettings,
    getRootNode,
    setRootNode,
    saveCurrentSettings,
    getSelectedIds,
    updateSelectionCount,
    countNodes,
    updateObsidianSettingsUI,
    filterTree,
    disableModalInteraction,
    enableModalInteraction,
    setupEventListeners,
} from './handlers';

// View layer (for customization)
export {
    ICONS,
    escapeHtml,
    renderTree,
    renderModal,
    updateModalUI,
    showProgress,
    hideProgress,
    showToast as showToastView,
    updateSelectionCount as updateSelectionCountView,
    getSelectedIds as getSelectedIdsView,
    updateStats,
} from './view';
export type { RenderModalOptions } from './view';

// ============================================================================
// NOOP_CONTROLLER — for headless flows (e.g., Space export without modal)
// ============================================================================

import type { ModalController } from './types';

/**
 * No-op ModalController. Use when running an export action without a visible
 * modal (e.g., space export, hub-direct push). All methods are safe no-ops so
 * the action-runner can always call `controller?.showProgress(...)` etc.
 *
 * NOTE: `getState()` returns `'idle'` — callers checking state should treat
 * this controller as a placeholder, not a real state source.
 */
export const NOOP_CONTROLLER: ModalController = {
    show: () => {},
    close: () => {},
    setState: () => {},
    getState: () => 'idle',
    showProgress: () => {},
    hideProgress: () => {},
    showToast: () => {},
    updateTree: () => {},
};
