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
