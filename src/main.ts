import './ui/styles.css';
import { buildPageTree, buildSpaceTree } from '@/core/tree-processor';
import { fetchPagesContent } from '@/core/content-loader';
import { buildMarkdownDocument, downloadMarkdown, copyToClipboard } from '@/core/exporter';
import { exportToPdf } from '@/core/pdf-exporter';
import { createObsidianVault, downloadVaultZip } from '@/core/obsidian-exporter';
import {
    createExportModal,
    closeModal,
} from '@/ui/modal';
import type { ModalAction, ModalContext, ModalController } from '@/ui/modal';
import { createButton, createStatus, updateStatus, setButtonLoading } from '@/ui/components';
import { getCurrentPageId, getErrorMessage, getSpaceKey } from '@/utils/helpers';
import { ctmLog, ctmError } from '@/utils/logger';
import { getCachedTree, setCachedTree, clearCachedTree } from '@/storage/storage';
import type { PageTreeNode } from '@/api/types';
import { isHubConfigured } from '@/storage/hub-settings';
import { showHubModal } from '@/ui/hub-modal';
import { showHubSettingsPanel } from '@/ui/hub-settings-panel';

let exportButton: HTMLButtonElement | null = null;

// ============================================================================
// Debug Logging
// ============================================================================

/** Log structured error with context for debugging */
function logError(error: unknown, context: string, extra?: Record<string, unknown>): void {
    const version = (typeof GM_info !== 'undefined' ? GM_info?.script?.version : 'dev') ?? 'unknown';
    const timestamp = new Date().toISOString();
    const err = error instanceof Error ? error : new Error(String(error));

    const payload = {
        timestamp,
        version,
        context,
        message: err.message,
        stack: err.stack,
        ...(extra || {}),
    };

    // Always log to console
    ctmError(`[CTM] ERROR in ${context}:`, payload);

    // On Tampermonkey, also store last errors for troubleshooting
    if (typeof GM_setValue !== 'undefined') {
        try {
            const history = JSON.parse(GM_getValue?.('export_error_history', '[]') ?? '[]');
            history.unshift(payload);
            if (history.length > 10) history.pop();
            GM_setValue?.('export_error_history', JSON.stringify(history));
        } catch {
            // ignore storage errors
        }
    }
}

// ============================================================================
// Action Handlers
// ============================================================================

/**
 * Handle copy action
 */
async function handleCopy(
    controller: ModalController | undefined,
    ctx: ModalContext,
    rootTree: PageTreeNode,
    rootTitle: string
): Promise<void> {
    ctmLog('[CTM] handleCopy ENTER — hasController:', !!controller, 'selectedIds:', ctx.selectedIds.length);
    try {
        if (controller?.showProgress) {
            controller.showProgress('content', 0, ctx.selectedIds.length);
        }

        const pagesContent = await fetchPagesContent(
            ctx.selectedIds,
            ctx.settings,
            (completed, total, phase) => {
                if (controller?.showProgress) {
                    controller.showProgress(phase, completed, total);
                }
            }
        );

        if (controller?.showProgress) {
            controller.showProgress('convert', 0, 0);
        }

        let diagramFormat: 'mermaid' | 'drawio-xml' | 'wikilink' = 'wikilink';
        if (ctx.obsidianSettings.diagramExportMode === 'convert') {
            diagramFormat = ctx.obsidianSettings.diagramTargetFormat;
        }

        const result = await buildMarkdownDocument(
            pagesContent,
            rootTree,
            rootTitle,
            ctx.settings,
            diagramFormat,
            ctx.obsidianSettings.diagramExportMode
        );

        ctmLog('[CTM] handleCopy: built markdown, pageCount:', result.pageCount, '— attempting clipboard copy');
        const success = await copyToClipboard(result);
        ctmLog('[CTM] handleCopy: copyToClipboard returned:', success);

        if (success) {
            if (controller?.showToast) {
                controller.showToast('Copied to clipboard!');
            } else {
                ctmLog('[CTM] handleCopy: no controller.showToast, skipping toast');
            }
            updateStatus(`Copied ${result.pageCount} pages`);
        } else {
            throw new Error('Failed to copy to clipboard');
        }
    } catch (error) {
        logError(error, 'handleCopy', { pageCount: ctx.selectedIds.length, hasController: !!controller });
        if (controller?.showToast) {
            try {
                controller.showToast('Copy failed!');
            } catch (toastError) {
                ctmError('[CTM] handleCopy: even showToast failed:', toastError);
            }
        }
        throw error;
    }
}

/**
 * Handle download action
 */
async function handleDownload(
    controller: ModalController | undefined,
    ctx: ModalContext,
    rootTree: PageTreeNode,
    rootTitle: string
): Promise<void> {
    ctmLog('[CTM] handleDownload ENTER — hasController:', !!controller, 'selectedIds:', ctx.selectedIds.length);
    if (controller?.showProgress) {
        controller.showProgress('content', 0, ctx.selectedIds.length);
    }

    const pagesContent = await fetchPagesContent(
        ctx.selectedIds,
        ctx.settings,
        (completed, total, phase) => {
            if (controller?.showProgress) {
                controller.showProgress(phase, completed, total);
            }
        }
    );

    if (controller?.showProgress) {
        controller.showProgress('convert', 0, 0);
    }

    let diagramFormat: 'mermaid' | 'drawio-xml' | 'wikilink' = 'wikilink';
    if (ctx.obsidianSettings.diagramExportMode === 'convert') {
        diagramFormat = ctx.obsidianSettings.diagramTargetFormat;
    }

    const result = await buildMarkdownDocument(
        pagesContent,
        rootTree,
        rootTitle,
        ctx.settings,
        diagramFormat,
        ctx.obsidianSettings.diagramExportMode
    );

    downloadMarkdown(result);
    updateStatus(`Downloaded ${result.pageCount} pages`);
}

/**
 * Handle Obsidian vault export
 */
async function handleObsidian(
    controller: ModalController | undefined,
    ctx: ModalContext,
    rootTree: PageTreeNode,
    rootTitle: string
): Promise<void> {
    ctmLog('[CTM] handleObsidian ENTER — hasController:', !!controller, 'selectedIds:', ctx.selectedIds.length);
    if (controller?.showProgress) {
        controller.showProgress('content', 0, ctx.selectedIds.length);
    }

    const pagesContent = await fetchPagesContent(
        ctx.selectedIds,
        ctx.settings,
        (completed, total, phase) => {
            if (controller?.showProgress) {
                controller.showProgress(phase, completed, total);
            }
        }
    );

    if (controller?.showProgress) {
        controller.showProgress('vault', 0, 0);
    }

    const vaultResult = await createObsidianVault(
        pagesContent,
        rootTree,
        rootTitle,
        ctx.obsidianSettings,
        (phase, current, total) => {
            if (controller?.showProgress) {
                controller.showProgress(phase, current, total);
            }
        }
    );

    downloadVaultZip(vaultResult);
    updateStatus(`Downloaded vault: ${vaultResult.pageCount} pages, ${vaultResult.diagramCount} diagrams`);
}

/**
 * Handle PDF export
 */
async function handlePdf(
    controller: ModalController | undefined,
    ctx: ModalContext,
    rootTree: PageTreeNode,
    rootTitle: string
): Promise<void> {
    ctmLog('[CTM] handlePdf ENTER — hasController:', !!controller, 'selectedIds:', ctx.selectedIds.length);
    if (controller?.showProgress) {
        controller.showProgress('content', 0, ctx.selectedIds.length);
    }

    const pagesContent = await fetchPagesContent(
        ctx.selectedIds,
        ctx.settings,
        (completed, total, phase) => {
            if (controller?.showProgress) {
                controller.showProgress(phase, completed, total);
            }
        }
    );

    exportToPdf(pagesContent, rootTree, rootTitle, ctx.settings);
    updateStatus(`PDF preview opened for ${pagesContent.length} pages`);
}

// ============================================================================
// Main Export Process
// ============================================================================

/** Main export process */
async function startExport(): Promise<void> {
    if (!exportButton || exportButton.disabled) return;

    const pageId = getCurrentPageId();
    if (!pageId) {
        alert('Could not find current page ID!');
        return;
    }

    setButtonLoading(exportButton, true, 'Export to Markdown');
    ctmLog('[CTM] startExport called, pageId:', pageId);

    try {
        // Check cache first
        let rootTree: PageTreeNode;
        let rootTitle: string;

        const cached = getCachedTree(pageId);
        if (cached) {
            rootTree = cached.tree;
            rootTitle = cached.rootTitle;
            updateStatus('Loaded from cache');
        } else {
            updateStatus('Scanning page tree...');
            rootTree = await buildPageTree(pageId, updateStatus);

            if (!rootTree || rootTree.error) {
                alert('Failed to load page hierarchy.');
                updateStatus('Error: Could not load hierarchy');
                return;
            }

            rootTitle = rootTree.title;
            setCachedTree(pageId, rootTitle, rootTree);
            updateStatus('Tree cached');
        }

        // Create modal with callback-based API
        const controller = createExportModal({
            rootNode: rootTree,
            rootTitle,
            callbacks: {
                onAction: async (action: ModalAction, ctx: ModalContext) => {
                    try {
                        if (!controller) {
                            ctmError('[CTM] CRITICAL: controller is undefined in onAction!');
                            alert('Internal error: controller not initialized');
                            return;
                        }
                        ctmLog('[CTM] Controller has showProgress:', !!controller.showProgress);
                        ctmLog('[CTM] Received action:', action);
                        ctmLog('[CTM] ctx.obsidianSettings.exportFormat:', ctx.obsidianSettings.exportFormat);

                        switch (action) {
                            case 'copy':
                                await handleCopy(controller, ctx, rootTree, rootTitle);
                                // Stay open for more actions
                                controller.setState('ready');
                                break;

                            case 'download':
                                await handleDownload(controller, ctx, rootTree, rootTitle);
                                controller.close();
                                break;

                            case 'obsidian':
                                await handleObsidian(controller, ctx, rootTree, rootTitle);
                                controller.close();
                                break;

                            case 'pdf':
                                await handlePdf(controller, ctx, rootTree, rootTitle);
                                controller.close();
                                break;
                        }
                    } catch (error) {
                        logError(error, `pageExport:${action}`, { pageId });
                        alert(`Export failed: ${getErrorMessage(error)}`);
                        controller?.setState('ready');
                    }
                },

                onRefresh: async () => {
                    updateStatus('Refreshing tree...');
                    clearCachedTree(pageId);
                    const newTree = await buildPageTree(pageId, updateStatus);
                    if (newTree && !newTree.error) {
                        setCachedTree(pageId, newTree.title, newTree);
                        rootTree = newTree;
                        rootTitle = newTree.title;
                    }
                    updateStatus('Tree refreshed');
                    return newTree;
                },

                onClose: () => {
                    updateStatus('Closed');
                },
            },
        });

    } catch (error) {
        logError(error, 'startExport', { pageId });
        closeModal();
        alert(`Export failed: ${getErrorMessage(error)}`);
        updateStatus(`Error: ${getErrorMessage(error)}`);
    } finally {
        if (exportButton) {
            setButtonLoading(exportButton, false, 'Export to Markdown');
        }
    }
}

/** Export entire space */
async function startSpaceExport(): Promise<void> {
    if (!spaceExportButton || spaceExportButton.disabled) return;

    const spaceKey = getSpaceKey();
    if (!spaceKey) {
        alert('Could not find space key!');
        return;
    }

    const spaceName = getSpaceName();
    setButtonLoading(spaceExportButton, true, 'Export Space');
    ctmLog('[CTM] startSpaceExport called, spaceKey:', spaceKey, 'spaceName:', spaceName);

    try {
        updateStatus('Loading space...');
        const rootTree = await buildSpaceTree(spaceKey, updateStatus);

        if (!rootTree || rootTree.error) {
            alert('Failed to load space hierarchy.');
            updateStatus('Error: Could not load space');
            return;
        }

        // Cache by space key
        setCachedTree(spaceKey, spaceName, rootTree);

        // Create modal for space export
        createExportModal({
            rootNode: rootTree,
            rootTitle: spaceName,
            callbacks: {
                onAction: async (action: ModalAction, ctx: ModalContext) => {
                    ctmLog('[CTM] spaceExport onAction START — action:', action, 'selectedIds:', ctx.selectedIds.length);
                    try {
                        switch (action) {
                            case 'copy':
                                await handleCopy(undefined, ctx, rootTree, spaceName);
                                ctmLog('[CTM] spaceExport onAction copy DONE');
                                break;

                            case 'download':
                                await handleDownload(undefined, ctx, rootTree, spaceName);
                                ctmLog('[CTM] spaceExport onAction download DONE');
                                break;

                            case 'obsidian':
                                await handleObsidian(undefined, ctx, rootTree, spaceName);
                                ctmLog('[CTM] spaceExport onAction obsidian DONE');
                                break;

                            case 'pdf':
                                await handlePdf(undefined, ctx, rootTree, spaceName);
                                ctmLog('[CTM] spaceExport onAction pdf DONE');
                                break;
                        }
                        ctmLog('[CTM] spaceExport onAction END — action:', action);
                    } catch (error) {
                        ctmError('[CTM] spaceExport onAction ERROR — action:', action, 'error:', error);
                        logError(error, `spaceExport:${action}`, { spaceKey, spaceName });
                        alert(`Export failed: ${getErrorMessage(error)}`);
                    } finally {
                        // Space export has no controller to reset modal state —
                        // we must re-enable interaction manually so buttons work again
                        ctmLog('[CTM] spaceExport onAction finally — re-enabling modal interaction');
                        const modalEl = document.getElementById('md-export-modal');
                        if (modalEl) {
                            import('@/ui/modal/handlers').then(({ enableModalInteraction }) => {
                                enableModalInteraction(modalEl, { download: '', copy: '' });
                            }).catch((e) => ctmError('[CTM] Failed to re-enable modal:', e));
                        }
                    }
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

                onClose: () => {
                    updateStatus('Closed');
                },
            },
        });

    } catch (error) {
        logError(error, 'startSpaceExport', { spaceKey, spaceName });
        alert(`Space export failed: ${getErrorMessage(error)}`);
        updateStatus(`Error: ${getErrorMessage(error)}`);
    } finally {
        if (spaceExportButton) {
            setButtonLoading(spaceExportButton, false, 'Export Space');
        }
    }
}

// ============================================================================
// Hub Link Process
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
        spaceKey,
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

    const spaceKeyValue = getSpaceKey();
    return spaceKeyValue || 'Unknown';
}

// ============================================================================
// UI Setup
// ============================================================================

let spaceExportButton: HTMLButtonElement | null = null;

/** Add export button to page */
function addExportButton(): void {
    if (document.getElementById('md-export-trigger')) return;

    const pageId = getCurrentPageId();
    const spaceKey = getSpaceKey();

    const actionMenu = document.getElementById('action-menu-link');
    if (!actionMenu?.parentElement) return;

    let status: HTMLElement | null = null;

    // Page export button - needs pageId
    if (pageId) {
        exportButton = createButton('Export to Markdown', 'aui-button', startExport);
        exportButton.id = 'md-export-trigger';

        status = createStatus();
        actionMenu.parentElement.insertBefore(exportButton, actionMenu.nextSibling);
        actionMenu.parentElement.insertBefore(status, exportButton.nextSibling);
    }

    // Space export button - needs spaceKey
    if (spaceKey && !document.getElementById('md-space-export-trigger')) {
        spaceExportButton = createButton('Export Space', 'aui-button aui-button-secondary', startSpaceExport);
        spaceExportButton.id = 'md-space-export-trigger';
        spaceExportButton.style.marginLeft = '8px';

        const exportBtn = document.getElementById('md-export-trigger');
        if (exportBtn) {
            exportBtn.parentElement?.insertBefore(spaceExportButton, exportBtn.nextSibling);
        } else {
            actionMenu.parentElement.insertBefore(spaceExportButton, actionMenu.nextSibling);
        }
    }

    if (isHubConfigured() && !document.getElementById('md-hub-trigger')) {
        const hubButton = createButton('📡 Привязать к Hub', 'aui-button hub-button', startHubLink);
        hubButton.id = 'md-hub-trigger';
        actionMenu.parentElement.insertBefore(hubButton, status.nextSibling);
    }

    if (!document.getElementById('md-hub-settings-trigger')) {
        const settingsBtn = document.createElement('button');
        settingsBtn.id = 'md-hub-settings-trigger';
        settingsBtn.className = 'aui-button md-hub-settings-btn-inline';
        settingsBtn.title = 'Hub Settings';
        settingsBtn.textContent = '⚙️';
        settingsBtn.style.cssText = 'margin-left:4px;padding:0 6px;min-width:auto;font-size:0.85em;';
        settingsBtn.addEventListener('click', showHubSettingsPanel);
        actionMenu.parentElement.insertBefore(settingsBtn, (document.getElementById('md-hub-trigger') || status).nextSibling);
    }
}

/** Initialize script */
function init(): void {
    addExportButton();

    if (isHubConfigured()) {
        import('@/hub/sync-checker').then(({ checkForUpdates, updateBadge }) => {
            checkForUpdates().then(updateBadge);
        });
    }

    // Watch for SPA navigation
    let lastHref = location.href;
    const observer = new MutationObserver(() => {
        if (location.href !== lastHref) {
            lastHref = location.href;
            setTimeout(addExportButton, 500);
            if (isHubConfigured()) {
                import('@/hub/sync-checker').then(({ checkForUpdates, updateBadge }) => {
                    setTimeout(() => checkForUpdates().then(updateBadge), 1000);
                });
            }
        } else if (
            !document.getElementById('md-export-trigger') &&
            document.getElementById('action-menu-link')
        ) {
            setTimeout(addExportButton, 200);
        } else if (
            isHubConfigured() &&
            !document.getElementById('md-hub-trigger') &&
            document.getElementById('md-export-trigger')
        ) {
            setTimeout(addExportButton, 200);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

// Start
const SCRIPT_VERSION = (typeof GM_info !== 'undefined' ? GM_info?.script?.version : 'dev') ?? 'unknown';
ctmLog('[CTM] Confluence To Markdown v' + SCRIPT_VERSION + ' initialized');

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
