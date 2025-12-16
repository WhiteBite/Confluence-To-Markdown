import './ui/styles.css';
import { buildPageTree } from '@/core/tree-processor';
import { fetchPagesContent } from '@/core/content-loader';
import { buildMarkdownDocument, downloadMarkdown, copyToClipboard } from '@/core/exporter';
import { exportToPdf } from '@/core/pdf-exporter';
import {
    showPageSelectorModal,
    updateModalProgress,
    closeModal,
    showToast,
    enableModal,
} from '@/ui/modal';
import { createButton, createStatus, updateStatus, setButtonLoading } from '@/ui/components';
import { getCurrentPageId, getErrorMessage } from '@/utils/helpers';
import { getCachedTree, setCachedTree, clearCachedTree } from '@/storage/storage';
import type { PageTreeNode } from '@/api/types';

let exportButton: HTMLButtonElement | null = null;

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

        // Show modal with refresh callback
        const { selectedIds, cancelled, action, settings } = await showPageSelectorModal(
            rootTree,
            rootTitle,
            {
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
            }
        );

        if (cancelled) {
            updateStatus('Cancelled');
            return;
        }

        if (selectedIds.length === 0) {
            closeModal();
            updateStatus('No pages selected');
            return;
        }

        // Fetch content with progress
        updateModalProgress(0, selectedIds.length, 'content');

        const pagesContent = await fetchPagesContent(selectedIds, settings, (completed, total, phase) => {
            updateModalProgress(completed, total, phase);
        });

        // Build Markdown
        updateModalProgress(0, 0, 'convert');
        const result = buildMarkdownDocument(pagesContent, rootTree, rootTitle, settings);

        // Handle action
        if (action === 'copy') {
            const success = await copyToClipboard(result);
            if (success) {
                showToast('Copied to clipboard!');
                enableModal();
                updateStatus(`Copied ${result.pageCount} pages`);
            } else {
                alert('Failed to copy to clipboard');
                enableModal();
            }
        } else if (action === 'pdf') {
            exportToPdf(pagesContent, rootTree, rootTitle, settings);
            closeModal();
            updateStatus(`PDF preview opened for ${result.pageCount} pages`);
        } else {
            downloadMarkdown(result);
            closeModal();
            updateStatus(`Downloaded ${result.pageCount} pages`);
        }
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
