/**
 * Confluence to Markdown — userscript / extension entry point.
 *
 * Wiring layer only:
 *   - bootstrap()       → injects buttons, watches SPA navigation
 *   - startExport()     → page-level export flow (with modal)
 *   - startSpaceExport()→ space-level export flow (with modal, NOOP if needed)
 *   - startHubLink()    → opens hub linking modal
 *
 * Heavy lifting lives in:
 *   - core/action-runner.ts   — unified copy/download/obsidian/pdf
 *   - ui/bootstrap.ts          — button injection + retry + SPA observer
 *   - utils/error-reporter.ts  — structured error logging + GM_setValue history
 */

import './ui/styles.css';

import { buildPageTree, buildSpaceTree } from '@/core/tree-processor';
import { runExportAction } from '@/core/action-runner';

import {
    createExportModal,
    closeModal,
    NOOP_CONTROLLER,
} from '@/ui/modal';
import type { ModalAction, ModalContext, ModalController } from '@/ui/modal';
import { updateStatus, setButtonLoading } from '@/ui/components';
import { bootstrap } from '@/ui/bootstrap';
import { showHubModal } from '@/ui/hub-modal';
import { showHubSettingsPanel } from '@/ui/hub-settings-panel';
import { showImportModal } from '@/ui/import-modal';

import { getCurrentPageId, getErrorMessage, getSpaceKey } from '@/utils/helpers';
import { ctmLog } from '@/utils/logger';
import { logError } from '@/utils/error-reporter';

import { getCachedTree, setCachedTree, clearCachedTree } from '@/storage/storage';
import type { PageTreeNode } from '@/api/types';

// ============================================================================
// Page export
// ============================================================================

async function startExport(): Promise<void> {
    const pageButton = document.getElementById('md-export-trigger') as HTMLButtonElement | null;
    if (!pageButton || pageButton.disabled) return;

    const pageId = getCurrentPageId();
    if (!pageId) {
        alert('Could not find current page ID!');
        return;
    }

    setButtonLoading(pageButton, true, 'Export to Markdown');
    ctmLog('startExport called, pageId:', pageId);

    try {
        const { rootTree, rootTitle } = await loadOrBuildPageTree(pageId);
        if (!rootTree) return; // already alerted

        // Mutable refs so onRefresh can swap them out without recreating the modal.
        let currentTree = rootTree;
        let currentTitle = rootTitle;

        const controller = createExportModal({
            rootNode: currentTree,
            rootTitle: currentTitle,
            callbacks: {
                onAction: async (action, ctx) => {
                    await dispatchAction(action, ctx, controller, currentTree, currentTitle, {
                        contextLabel: 'pageExport',
                        contextExtra: { pageId },
                        closeOnSuccess: action !== 'copy',
                    });
                },
                onRefresh: async () => {
                    updateStatus('Refreshing tree...');
                    clearCachedTree(pageId);
                    const newTree = await buildPageTree(pageId, updateStatus);
                    if (newTree && !newTree.error) {
                        setCachedTree(pageId, newTree.title, newTree);
                        currentTree = newTree;
                        currentTitle = newTree.title;
                    }
                    updateStatus('Tree refreshed');
                    return newTree;
                },
                onClose: () => updateStatus('Closed'),
            },
        });
    } catch (error) {
        logError(error, 'startExport', { pageId });
        closeModal();
        alert(`Export failed: ${getErrorMessage(error)}`);
        updateStatus(`Error: ${getErrorMessage(error)}`);
    } finally {
        setButtonLoading(pageButton, false, 'Export to Markdown');
    }
}

async function loadOrBuildPageTree(
    pageId: string
): Promise<{ rootTree: PageTreeNode | null; rootTitle: string }> {
    const cached = getCachedTree(pageId);
    if (cached) {
        updateStatus('Loaded from cache');
        return { rootTree: cached.tree, rootTitle: cached.rootTitle };
    }

    updateStatus('Scanning page tree...');
    const rootTree = await buildPageTree(pageId, updateStatus);
    if (!rootTree || rootTree.error) {
        alert('Failed to load page hierarchy.');
        updateStatus('Error: Could not load hierarchy');
        return { rootTree: null, rootTitle: '' };
    }

    setCachedTree(pageId, rootTree.title, rootTree);
    updateStatus('Tree cached');
    return { rootTree, rootTitle: rootTree.title };
}

// ============================================================================
// Space export
// ============================================================================

async function startSpaceExport(): Promise<void> {
    const spaceButton = document.getElementById(
        'md-space-export-trigger'
    ) as HTMLButtonElement | null;
    if (!spaceButton || spaceButton.disabled) return;

    const spaceKey = getSpaceKey();
    if (!spaceKey) {
        alert('Could not find space key!');
        return;
    }

    const spaceName = getSpaceName();
    setButtonLoading(spaceButton, true, 'Export Space');
    ctmLog('startSpaceExport called, spaceKey:', spaceKey, 'spaceName:', spaceName);

    try {
        updateStatus('Loading space...');
        const rootTree = await buildSpaceTree(spaceKey, updateStatus);
        if (!rootTree || rootTree.error) {
            alert('Failed to load space hierarchy.');
            updateStatus('Error: Could not load space');
            return;
        }
        setCachedTree(spaceKey, spaceName, rootTree);

        const controller = createExportModal({
            rootNode: rootTree,
            rootTitle: spaceName,
            callbacks: {
                onAction: async (action, ctx) => {
                    await dispatchAction(action, ctx, controller, rootTree, spaceName, {
                        contextLabel: 'spaceExport',
                        contextExtra: { spaceKey, spaceName },
                        closeOnSuccess: action !== 'copy',
                    });
                },
                onRefresh: async () => {
                    updateStatus('Refreshing space...');
                    const newTree = await buildSpaceTree(spaceKey, updateStatus);
                    if (newTree && !newTree.error) {
                        setCachedTree(spaceKey, spaceName, newTree);
                    }
                    updateStatus('Space refreshed');
                    return newTree;
                },
                onClose: () => updateStatus('Closed'),
            },
        });
    } catch (error) {
        logError(error, 'startSpaceExport', { spaceKey, spaceName });
        alert(`Space export failed: ${getErrorMessage(error)}`);
        updateStatus(`Error: ${getErrorMessage(error)}`);
    } finally {
        setButtonLoading(spaceButton, false, 'Export Space');
    }
}

// ============================================================================
// Action dispatcher (shared between page-export and space-export)
// ============================================================================

interface DispatchOptions {
    contextLabel: string;
    contextExtra?: Record<string, unknown>;
    closeOnSuccess: boolean;
}

async function dispatchAction(
    action: ModalAction,
    ctx: ModalContext,
    controller: ModalController | undefined,
    rootTree: PageTreeNode,
    rootTitle: string,
    opts: DispatchOptions
): Promise<void> {
    const safeController = controller ?? NOOP_CONTROLLER;
    ctmLog(
        `${opts.contextLabel} dispatch:`,
        action,
        'selectedIds:',
        ctx.selectedIds.length
    );

    try {
        const result = await runExportAction(action, ctx, {
            controller: safeController,
            rootTree,
            rootTitle,
        });

        // Friendly status + toast feedback
        updateStatus(result.status);
        if (action === 'copy') {
            safeController.showToast?.('Copied to clipboard!');
        }

        if (opts.closeOnSuccess) {
            controller?.close();
        }
    } catch (error) {
        logError(error, `${opts.contextLabel}:${action}`, opts.contextExtra);
        const msg = getErrorMessage(error);
        if (controller) {
            // Inline error inside modal (better UX than alert)
            try {
                controller.showToast?.(`Export failed: ${msg}`);
            } catch {
                alert(`Export failed: ${msg}`);
            }
        } else {
            alert(`Export failed: ${msg}`);
        }
    }
}

// ============================================================================
// Hub link
// ============================================================================

async function startHubLink(): Promise<void> {
    const pageId = getCurrentPageId();
    if (!pageId) {
        alert('Не удалось определить текущую страницу!');
        return;
    }

    const spaceKey = getSpaceKey();
    const spaceName = getSpaceName();

    let pageTree: PageTreeNode | null;
    const cached = getCachedTree(pageId);
    if (cached) {
        pageTree = cached.tree;
    } else {
        try {
            updateStatus('Загрузка дерева...');
            pageTree = await buildPageTree(pageId, updateStatus);
            if (pageTree && !pageTree.error) {
                setCachedTree(pageId, pageTree.title, pageTree);
            }
        } catch {
            pageTree = null;
        }
    }

    showHubModal({
        pageId,
        spaceKey: spaceKey ?? '',
        spaceName,
        pageTree,
    });
    updateStatus('');
}

function getSpaceName(): string {
    const breadcrumb = document.querySelector('#breadcrumb-section a[data-space-key]');
    if (breadcrumb) return breadcrumb.textContent?.trim() || '';

    const spaceLink = document.querySelector('.space-name a, #space-name-link');
    if (spaceLink) return spaceLink.textContent?.trim() || '';

    return getSpaceKey() ?? 'Unknown';
}

// ============================================================================
// Import
// ============================================================================

function startImport(): void {
    ctmLog('startImport called');
    showImportModal();
}

// ============================================================================
// Boot
// ============================================================================

const SCRIPT_VERSION =
    (typeof GM_info !== 'undefined' ? GM_info?.script?.version : 'dev') ?? 'unknown';
ctmLog(`Confluence To Markdown v${SCRIPT_VERSION} initialized`);

bootstrap({
    onPageExport: startExport,
    onSpaceExport: startSpaceExport,
    onImport: startImport,
    onHubLink: startHubLink,
    onHubSettings: showHubSettingsPanel,
});
