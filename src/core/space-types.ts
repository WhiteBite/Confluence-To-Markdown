/**
 * Space Sync Types — shared types for incremental space sync.
 *
 * CatalogEntry: lightweight page metadata from a space scan (no bodies).
 * SpaceState: persisted snapshot of the last sync (used for diffing).
 * TreePageFile: full page data written to the tree store.
 * SpaceDiff: result of diffing a catalog against a stored state.
 * SpaceSyncReport: result of applying a diff to a store.
 */

// ============================================================================
// Catalog
// ============================================================================

/** Lightweight page entry from a space catalog scan (no body content). */
export interface CatalogEntry {
    readonly id: string;
    readonly title: string;
    readonly version: number;
    readonly parentId: string | null;
    readonly labels?: readonly string[];
}

// ============================================================================
// State
// ============================================================================

/** Persisted state of a space sync — used as the diff baseline. */
export interface SpaceState {
    readonly format: 'onyx-sync/space-state';
    readonly version: 1;
    readonly space: string;
    readonly lastSync: string;
    readonly pages: Readonly<Record<string, {
        readonly title: string;
        readonly version: number;
        readonly parentId: string | null;
    }>>;
}

// ============================================================================
// Tree page file
// ============================================================================

/** Full page data written to / read from a TreeStore. */
export interface TreePageFile {
    readonly id: string;
    readonly title: string;
    readonly parentId: string | null;
    readonly version: number;
    readonly labels: readonly string[];
    readonly storage: string;
}

// ============================================================================
// Diff
// ============================================================================

/** A changed entry with its old version from the stored state. */
export interface ChangedEntry extends CatalogEntry {
    readonly oldVersion: number;
}

/** A removed entry — only known from the stored state. */
export interface RemovedEntry {
    readonly id: string;
    readonly title: string;
    readonly version: number;
}

/** Result of diffing a catalog against a stored state. */
export interface SpaceDiff {
    readonly added: readonly CatalogEntry[];
    readonly changed: readonly ChangedEntry[];
    readonly removed: readonly RemovedEntry[];
    readonly unchangedCount: number;
}

// ============================================================================
// Report
// ============================================================================

/** Result of applying a space sync. */
export interface SpaceSyncReport {
    readonly space: string;
    readonly scannedAt: string;
    readonly added: number;
    readonly changed: number;
    readonly removed: number;
    readonly unchangedCount: number;
    readonly failed: ReadonlyArray<{
        readonly id: string;
        readonly title: string;
        readonly error: string;
    }>;
    readonly written: number;
}

// ============================================================================
// Manifest
// ============================================================================

/** Manifest written to the tree store after a sync. */
export interface SpaceTreeManifest {
    readonly format: 'onyx-sync/space-tree';
    readonly version: 1;
    readonly space: string;
    readonly exportedAt: string;
    readonly pageCount: number;
}

// ============================================================================
// Delta (Download mode)
// ============================================================================

/** In-memory delta for Download mode. */
export interface SpaceDelta {
    readonly format: 'onyx-sync/space-delta';
    readonly version: 1;
    readonly space: string;
    readonly added: readonly TreePageFile[];
    readonly changed: readonly TreePageFile[];
    readonly removed: readonly string[];
    readonly state: SpaceState;
}
