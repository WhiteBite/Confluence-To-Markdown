/**
 * Unified runner for export actions.
 *
 * One function replaces the previous four near-identical handlers
 * (handleCopy/handleDownload/handleObsidian/handlePdf). Common steps:
 *   1. Fetch page contents (with progress reporting)
 *   2. Compute diagram format from settings
 *   3. Dispatch to the action-specific finalizer (copy/download/vault/pdf)
 *
 * The runner does NOT show alerts or close modals. Callers (main.ts,
 * space-export, hub-link) decide UX based on the returned `ActionResult`.
 */

import { fetchPagesContent } from './content-loader';
import {
    buildMarkdownDocument,
    downloadMarkdown,
    copyToClipboard,
} from './exporter';
import { exportToPdf } from './pdf-exporter';
import { createObsidianVault, downloadVaultZip } from './obsidian-exporter';
import { createConfluenceBackup, downloadBackupZip } from './backup-exporter';

import type { ModalAction, ModalContext, ModalController } from '@/ui/modal';
import type { PageTreeNode } from '@/api/types';
import { getSpaceKey } from '@/utils/helpers';

export interface ActionRunnerDeps {
    /** Optional modal controller for progress/toast UI. May be undefined for headless flows. */
    controller?: ModalController;
    rootTree: PageTreeNode;
    rootTitle: string;
    /** Cancellation signal (propagated to fetch/download pipelines) */
    signal?: AbortSignal;
}

export interface ActionResult {
    /** Action that was executed */
    action: ModalAction;
    /** Number of pages processed */
    pageCount: number;
    /** Optional human-readable status (used by status bar / toast) */
    status: string;
}

/**
 * Run a single export action end-to-end.
 *
 * Errors propagate to the caller so it can decide how to surface them
 * (alert, toast, dialog). Progress is forwarded to `deps.controller` if present.
 */
export async function runExportAction(
    action: ModalAction,
    ctx: ModalContext,
    deps: ActionRunnerDeps
): Promise<ActionResult> {
    const { controller, rootTree, rootTitle, signal } = deps;

    // Backup has its own fetch pipeline — skip fetchPagesContent
    if (action === 'backup') {
        return finalizeBackup(controller, ctx, rootTree, rootTitle, signal);
    }

    // ── Phase 1: fetch page contents ─────────────────────────────
    controller?.showProgress?.('content', 0, ctx.selectedIds.length);

    const pagesContent = await fetchPagesContent(
        ctx.selectedIds,
        ctx.settings,
        (completed, total, phase) => {
            controller?.showProgress?.(phase, completed, total);
        },
        signal
    );

    // ── Phase 2: dispatch to action-specific finalizer ───────────
    switch (action) {
        case 'copy':
            return finalizeCopy(controller, ctx, pagesContent, rootTree, rootTitle);

        case 'download':
            return finalizeDownload(controller, ctx, pagesContent, rootTree, rootTitle);

        case 'obsidian':
            return finalizeObsidian(controller, ctx, pagesContent, rootTree, rootTitle, signal);

        case 'pdf':
            return finalizePdf(ctx, pagesContent, rootTree, rootTitle);

        default: {
            // Compile-time exhaustiveness check
            const _never: never = action;
            throw new Error(`Unknown action: ${String(_never)}`);
        }
    }
}

// ============================================================================
// Action finalizers
// ============================================================================

type PagesContent = Awaited<ReturnType<typeof fetchPagesContent>>;

/**
 * Map ObsidianExportSettings.diagramTargetFormat to single-file diagram format.
 * 'wikilink' is the default for "keep as-is".
 */
function deriveDiagramFormat(
    ctx: ModalContext
): 'mermaid' | 'drawio-xml' | 'wikilink' {
    if (ctx.obsidianSettings.diagramExportMode !== 'convert') return 'wikilink';
    return ctx.obsidianSettings.diagramTargetFormat;
}

async function finalizeCopy(
    controller: ModalController | undefined,
    ctx: ModalContext,
    pages: PagesContent,
    rootTree: PageTreeNode,
    rootTitle: string
): Promise<ActionResult> {
    controller?.showProgress?.('convert', 0, 0);

    const diagramFormat = deriveDiagramFormat(ctx);
    const result = await buildMarkdownDocument(
        pages,
        rootTree,
        rootTitle,
        ctx.settings,
        diagramFormat,
        ctx.obsidianSettings.diagramExportMode
    );

    const success = await copyToClipboard(result);
    if (!success) {
        throw new Error('Failed to copy to clipboard');
    }

    return {
        action: 'copy',
        pageCount: result.pageCount,
        status: `Copied ${result.pageCount} pages`,
    };
}

async function finalizeDownload(
    controller: ModalController | undefined,
    ctx: ModalContext,
    pages: PagesContent,
    rootTree: PageTreeNode,
    rootTitle: string
): Promise<ActionResult> {
    controller?.showProgress?.('convert', 0, 0);

    const diagramFormat = deriveDiagramFormat(ctx);
    const result = await buildMarkdownDocument(
        pages,
        rootTree,
        rootTitle,
        ctx.settings,
        diagramFormat,
        ctx.obsidianSettings.diagramExportMode
    );

    downloadMarkdown(result);
    return {
        action: 'download',
        pageCount: result.pageCount,
        status: `Downloaded ${result.pageCount} pages`,
    };
}

async function finalizeObsidian(
    controller: ModalController | undefined,
    ctx: ModalContext,
    pages: PagesContent,
    rootTree: PageTreeNode,
    rootTitle: string,
    signal?: AbortSignal
): Promise<ActionResult> {
    controller?.showProgress?.('vault', 0, 0);

    const vaultResult = await createObsidianVault(
        pages,
        rootTree,
        rootTitle,
        ctx.obsidianSettings,
        (phase, current, total) => {
            controller?.showProgress?.(phase, current, total);
        },
        signal
    );

    downloadVaultZip(vaultResult);
    return {
        action: 'obsidian',
        pageCount: vaultResult.pageCount,
        status: `Downloaded vault: ${vaultResult.pageCount} pages, ${vaultResult.diagramCount} diagrams`,
    };
}

async function finalizePdf(
    ctx: ModalContext,
    pages: PagesContent,
    rootTree: PageTreeNode,
    rootTitle: string
): Promise<ActionResult> {
    exportToPdf(pages, rootTree, rootTitle, ctx.settings);
    return {
        action: 'pdf',
        pageCount: pages.length,
        status: `PDF preview opened for ${pages.length} pages`,
    };
}

async function finalizeBackup(
    controller: ModalController | undefined,
    ctx: ModalContext,
    rootTree: PageTreeNode,
    rootTitle: string,
    signal?: AbortSignal
): Promise<ActionResult> {
    // Backup fetches body.storage directly (not body.view), so it doesn't use
    // the pre-fetched pagesContent. It has its own fetch pipeline.
    const spaceKey = getSpaceKey();

    const result = await createConfluenceBackup(
        ctx.selectedIds,
        rootTree,
        rootTitle,
        spaceKey,
        rootTitle,
        {
            includeAttachments: true,
            includeViewHtml: false,
        },
        (phase, current, total) => {
            controller?.showProgress?.(phase, current, total);
        },
        signal
    );

    downloadBackupZip(result);
    return {
        action: 'backup',
        pageCount: result.pageCount,
        status: `Backup downloaded: ${result.pageCount} pages, ${result.attachmentCount} attachments`,
    };
}
