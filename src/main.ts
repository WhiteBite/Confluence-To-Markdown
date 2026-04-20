import './ui/styles.css';
import { buildPageTree } from '@/core/tree-processor';
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
import { getCurrentPageId, getErrorMessage } from '@/utils/helpers';
import { getCachedTree, setCachedTree, clearCachedTree } from '@/storage/storage';
import type { PageTreeNode } from '@/api/types';
import { isHubConfigured } from '@/storage/hub-settings';
import { showHubModal } from '@/ui/hub-modal';
import { showHubSettingsPanel } from '@/ui/hub-settings-panel';

let exportButton: HTMLButtonElement | null = null;

// ============================================================================
// Action Handlers
// ============================================================================

/**
 * Handle copy action
 */
async function handleCopy(
    controller: ModalController,
    ctx: ModalContext,
    rootTree: PageTreeNode,
    rootTitle: string
): Promise<void> {
    try {
        console.log('[Main] Copy action started');
        controller.showProgress('content', 0, ctx.selectedIds.length);

        const pagesContent = await fetchPagesContent(
            ctx.selectedIds,
            ctx.settings,
            (completed, total, phase) => controller.showProgress(phase, completed, total)
        );

        controller.showProgress('convert', 0, 0);

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

        const success = await copyToClipboard(result);

        if (success) {
            controller.showToast('Copied to clipboard!');
            updateStatus(`Copied ${result.pageCount} pages`);
        } else {
            throw new Error('Failed to copy to clipboard');
        }
    } catch (error) {
        console.error('[Main] Copy failed:', error);
        controller.showToast('Copy failed!');
        throw error;
    }
}

/**
 * Handle download action
 */
async function handleDownload(
    controller: ModalController,
    ctx: ModalContext,
    rootTree: PageTreeNode,
    rootTitle: string
): Promise<void> {
    controller.showProgress('content', 0, ctx.selectedIds.length);

    const pagesContent = await fetchPagesContent(
        ctx.selectedIds,
        ctx.settings,
        (completed, total, phase) => controller.showProgress(phase, completed, total)
    );

    controller.showProgress('convert', 0, 0);

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
    controller: ModalController,
    ctx: ModalContext,
    rootTree: PageTreeNode,
    rootTitle: string
): Promise<void> {
    controller.showProgress('content', 0, ctx.selectedIds.length);

    const pagesContent = await fetchPagesContent(
        ctx.selectedIds,
        ctx.settings,
        (completed, total, phase) => controller.showProgress(phase, completed, total)
    );

    controller.showProgress('vault', 0, 0);

    const vaultResult = await createObsidianVault(
        pagesContent,
        rootTree,
        rootTitle,
        ctx.obsidianSettings,
        (phase, current, total) => controller.showProgress(phase, current, total)
    );

    downloadVaultZip(vaultResult);
    updateStatus(`Downloaded vault: ${vaultResult.pageCount} pages, ${vaultResult.diagramCount} diagrams`);
}

/**
 * Handle PDF export
 */
async function handlePdf(
    controller: ModalController,
    ctx: ModalContext,
    rootTree: PageTreeNode,
    rootTitle: string
): Promise<void> {
    controller.showProgress('content', 0, ctx.selectedIds.length);

    const pagesContent = await fetchPagesContent(
        ctx.selectedIds,
        ctx.settings,
        (completed, total, phase) => controller.showProgress(phase, completed, total)
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
        let controller: ModalController;

        controller = createExportModal({
            rootNode: rootTree,
            rootTitle,
            callbacks: {
                onAction: async (action: ModalAction, ctx: ModalContext) => {
                    try {
                        console.log('[Main] Received action:', action);
                        console.log('[Main] ctx.obsidianSettings.exportFormat:', ctx.obsidianSettings.exportFormat);

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
                        console.error(`[Main] ${action} failed:`, error);
                        alert(`Export failed: ${getErrorMessage(error)}`);
                        controller.setState('ready');
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
        console.error('Export error:', error);
        closeModal();
        alert(`Export failed: ${getErrorMessage(error)}`);
        updateStatus(`Error: ${getErrorMessage(error)}`);
    } finally {
        if (exportButton) {
            setButtonLoading(exportButton, false, 'Export to Markdown');
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

    let pageTree: PageTreeNode | null = null;
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

function getSpaceKey(): string {
    const meta = document.querySelector('meta[name="confluence-space-key"]');
    if (meta) return meta.getAttribute('content') || '';

    const spaceUrl = window.location.pathname.match(/\/display\/([^/]+)/);
    if (spaceUrl) return spaceUrl[1];

    const spaceParam = new URLSearchParams(window.location.search).get('spaceKey');
    if (spaceParam) return spaceParam;

    return '';
}

function getSpaceName(): string {
    const breadcrumb = document.querySelector('#breadcrumb-section a[data-space-key]');
    if (breadcrumb) return breadcrumb.textContent?.trim() || '';

    const spaceLink = document.querySelector('.space-name a, #space-name-link');
    if (spaceLink) return spaceLink.textContent?.trim() || '';

    const spaceKey = getSpaceKey();
    return spaceKey || 'Unknown';
}

// ============================================================================
// UI Setup
// ============================================================================

/** Add export button to page */
function addExportButton(): void {
    if (document.getElementById('md-export-trigger')) return;
    if (!getCurrentPageId()) return;

    const actionMenu = document.getElementById('action-menu-link');
    if (!actionMenu?.parentElement) return;

    exportButton = createButton('Export to Markdown', 'aui-button', startExport);
    exportButton.id = 'md-export-trigger';

    const status = createStatus();

    actionMenu.parentElement.insertBefore(exportButton, actionMenu.nextSibling);
    actionMenu.parentElement.insertBefore(status, exportButton.nextSibling);

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
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
