/**
 * Event handlers module for export modal — re-exports
 * @module ui/modal/handlers
 */

export type { HandlerDependencies } from './handlers/events';
export { initSettings, getSettings, getRootNode, setRootNode, saveCurrentSettings, updateObsidianSettingsUI, updateCopyButtonState } from './handlers/settings';
export { getSelectedIds, updateSelectionCount, countNodes, filterTree } from './handlers/tree';
export { disableModalInteraction, enableModalInteraction } from './handlers/interaction';
export { setupEventListeners, updateLocalizedText } from './handlers/events';
