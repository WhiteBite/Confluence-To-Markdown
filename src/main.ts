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
}

/** Initialize script */
function init(): void {
    addExportButton();

    // Watch for SPA navigation
    let lastHref = location.href;
    const observer = new MutationObserver(() => {
        if (location.href !== lastHref) {
            lastHref = location.href;
            setTimeout(addExportButton, 500);
        } else if (
            !document.getElementById('md-export-trigger') &&
            document.getElementById('action-menu-link')
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
