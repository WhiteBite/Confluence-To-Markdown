/**
 * Modal types for export modal
 * @module ui/modal/types
 */

import type { PageTreeNode, ObsidianExportSettings } from '@/api/types';
import type { ExportSettings } from '@/storage/types';

// ============================================================================
// Modal States
// ============================================================================

/** Modal state machine states */
export type ModalState = 'idle' | 'ready' | 'processing' | 'error';

// ============================================================================
// Action Types
// ============================================================================

/** Available modal actions */
export type ModalAction = 'copy' | 'download' | 'obsidian' | 'pdf';

// ============================================================================
// Context & Callbacks
// ============================================================================

/** Context passed to action callbacks */
export interface ModalContext {
    /** Selected page IDs */
    readonly selectedIds: string[];
    /** Current export settings */
    readonly settings: ExportSettings;
    /** Current Obsidian export settings */
    readonly obsidianSettings: ObsidianExportSettings;
}

/** Callbacks interface for modal interactions */
export interface ModalCallbacks {
    /** Called when user triggers an export action */
    onAction: (action: ModalAction, ctx: ModalContext) => Promise<void>;
    /** Called when user requests tree refresh */
    onRefresh: () => Promise<PageTreeNode>;
    /** Called when modal is closed (optional) */
    onClose?: () => void;
}

// ============================================================================
// Controller Interface
// ============================================================================

/** Controller interface returned by createExportModal */
export interface ModalController {
    /** Show the modal */
    show(): void;
    /** Close the modal */
    close(): void;
    /** Set modal state */
    setState(state: ModalState): void;
    /** Get current modal state */
    getState(): ModalState;
    /** Show progress indicator */
    showProgress(phase: string, current: number, total: number): void;
    /** Hide progress indicator */
    hideProgress(): void;
    /** Show toast notification */
    showToast(message: string): void;
    /** Update the page tree */
    updateTree(node: PageTreeNode): void;
}

// ============================================================================
// Creation Options
// ============================================================================

/** Options for creating the export modal */
export interface CreateModalOptions {
    /** Root node of the page tree */
    readonly rootNode: PageTreeNode;
    /** Title for the root (space name) */
    readonly rootTitle: string;
    /** Callbacks for modal interactions */
    readonly callbacks: ModalCallbacks;
}

// ============================================================================
// Progress Types
// ============================================================================

/** Progress information for export operations */
export interface ProgressInfo {
    /** Current phase description */
    readonly phase: string;
    /** Current item index (1-based) */
    readonly current: number;
    /** Total items count */
    readonly total: number;
    /** Optional current page name */
    readonly pageName?: string;
}

// ============================================================================
// Toast Types
// ============================================================================

/** Toast notification types */
export type ToastType = 'success' | 'error' | 'info';

/** Toast notification options */
export interface ToastOptions {
    /** Message to display */
    readonly message: string;
    /** Toast type (affects styling) */
    readonly type?: ToastType;
    /** Duration in milliseconds (default: 3000) */
    readonly duration?: number;
}

// ============================================================================
// State Change Event
// ============================================================================

/** State change event payload */
export interface StateChangeEvent {
    /** Previous state */
    readonly from: ModalState;
    /** New state */
    readonly to: ModalState;
    /** Timestamp of the change */
    readonly timestamp: number;
}

/** State change listener function */
export type StateChangeListener = (event: StateChangeEvent) => void;
