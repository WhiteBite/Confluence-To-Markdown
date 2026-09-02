/**
 * Tree I/O — storage abstraction for incremental space sync.
 *
 * TreeStore interface with two implementations:
 *   - MemoryTreeStore: in-memory Maps (for tests + Download mode)
 *   - FsTreeStore: File System Access API (for Folder mode)
 *
 * Pages stored as `pages/<id>.json`, state as `state.json`,
 * manifest as `manifest.json`.
 */

import type { SpaceState, SpaceTreeManifest, TreePageFile } from './space-types';

// ============================================================================
// Minimal File System Access API types (not in lib.dom)
// ============================================================================

declare global {
    interface Window {
        showDirectoryPicker?: (
            options?: { mode?: 'read' | 'readwrite' }
        ) => Promise<FileSystemDirectoryHandle>;
    }

    interface FileSystemDirectoryHandle {
        getFileHandle(
            name: string,
            options?: { create?: boolean }
        ): Promise<FileSystemFileHandle>;
        getDirectoryHandle(
            name: string,
            options?: { create?: boolean }
        ): Promise<FileSystemDirectoryHandle>;
        removeEntry(name: string): Promise<void>;
        keys(): AsyncIterableIterator<string>;
    }

    interface FileSystemFileHandle {
        getFile(): Promise<File>;
        createWritable(): Promise<FileSystemWritableFileStream>;
    }

    interface FileSystemWritableFileStream {
        write(data: string | BufferSource | Blob): Promise<void>;
        close(): Promise<void>;
    }
}

// ============================================================================
// TreeStore interface
// ============================================================================

/** Storage abstraction for space sync. */
export interface TreeStore {
    readState(): Promise<SpaceState | null>;
    writeState(state: SpaceState): Promise<void>;
    listPages(): Promise<string[]>;
    readPage(id: string): Promise<TreePageFile | null>;
    writePage(page: TreePageFile): Promise<void>;
    deletePage(id: string): Promise<void>;
    writeManifest(manifest: SpaceTreeManifest): Promise<void>;
}

// ============================================================================
// MemoryTreeStore
// ============================================================================

/** In-memory TreeStore — for tests and Download mode. */
export class MemoryTreeStore implements TreeStore {
    private state: SpaceState | null = null;
    private readonly pages = new Map<string, TreePageFile>();
    private manifest: SpaceTreeManifest | null = null;

    async readState(): Promise<SpaceState | null> {
        return this.state;
    }

    async writeState(state: SpaceState): Promise<void> {
        this.state = state;
    }

    async listPages(): Promise<string[]> {
        return Array.from(this.pages.keys());
    }

    async readPage(id: string): Promise<TreePageFile | null> {
        return this.pages.get(id) ?? null;
    }

    async writePage(page: TreePageFile): Promise<void> {
        this.pages.set(page.id, page);
    }

    async deletePage(id: string): Promise<void> {
        this.pages.delete(id);
    }

    async writeManifest(manifest: SpaceTreeManifest): Promise<void> {
        this.manifest = manifest;
    }

    /** @internal Exposed for delta building in Download mode. */
    getManifest(): SpaceTreeManifest | null {
        return this.manifest;
    }
}

// ============================================================================
// FsTreeStore
// ============================================================================

/**
 * File System Access API TreeStore.
 *
 * Pages stored as `pages/<id>.json`, state as `state.json`,
 * manifest as `manifest.json` in the picked directory.
 */
export class FsTreeStore implements TreeStore {
    private readonly dirHandle: FileSystemDirectoryHandle;

    constructor(dirHandle: FileSystemDirectoryHandle) {
        this.dirHandle = dirHandle;
    }

    private async getPagesDir(): Promise<FileSystemDirectoryHandle> {
        return this.dirHandle.getDirectoryHandle('pages', { create: true });
    }

    async readState(): Promise<SpaceState | null> {
        try {
            const fh = await this.dirHandle.getFileHandle('state.json');
            const file = await fh.getFile();
            const text = await file.text();
            return JSON.parse(text) as SpaceState;
        } catch {
            return null;
        }
    }

    async writeState(state: SpaceState): Promise<void> {
        const fh = await this.dirHandle.getFileHandle('state.json', { create: true });
        const writable = await fh.createWritable();
        await writable.write(JSON.stringify(state, null, 2));
        await writable.close();
    }

    async listPages(): Promise<string[]> {
        try {
            const pagesDir = await this.getPagesDir();
            const ids: string[] = [];
            for await (const name of pagesDir.keys()) {
                if (name.endsWith('.json')) {
                    ids.push(name.slice(0, -5));
                }
            }
            return ids;
        } catch {
            return [];
        }
    }

    async readPage(id: string): Promise<TreePageFile | null> {
        try {
            const pagesDir = await this.getPagesDir();
            const fh = await pagesDir.getFileHandle(`${id}.json`);
            const file = await fh.getFile();
            const text = await file.text();
            return JSON.parse(text) as TreePageFile;
        } catch {
            return null;
        }
    }

    async writePage(page: TreePageFile): Promise<void> {
        const pagesDir = await this.getPagesDir();
        const fh = await pagesDir.getFileHandle(`${page.id}.json`, { create: true });
        const writable = await fh.createWritable();
        await writable.write(JSON.stringify(page, null, 2));
        await writable.close();
    }

    async deletePage(id: string): Promise<void> {
        try {
            const pagesDir = await this.getPagesDir();
            await pagesDir.removeEntry(`${id}.json`);
        } catch {
            // page doesn't exist — no-op
        }
    }

    async writeManifest(manifest: SpaceTreeManifest): Promise<void> {
        const fh = await this.dirHandle.getFileHandle('manifest.json', { create: true });
        const writable = await fh.createWritable();
        await writable.write(JSON.stringify(manifest, null, 2));
        await writable.close();
    }
}

// ============================================================================
// Directory picker
// ============================================================================

/**
 * Open a directory picker dialog.
 * Returns null if the API is unavailable or the user cancels.
 */
export async function pickDirectory(): Promise<FileSystemDirectoryHandle | null> {
    if (typeof window.showDirectoryPicker !== 'function') return null;
    try {
        return await window.showDirectoryPicker({ mode: 'readwrite' });
    } catch {
        return null;
    }
}
