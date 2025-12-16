import type { PageTreeNode } from '@/api/types';
import {
    type ExportSettings,
    type CachedTree,
    DEFAULT_SETTINGS,
    STORAGE_KEYS,
    CACHE_TTL,
} from './types';

/** Load export settings */
export function loadSettings(): ExportSettings {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (stored) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.warn('Failed to load settings:', e);
    }
    return { ...DEFAULT_SETTINGS };
}

/** Save export settings */
export function saveSettings(settings: ExportSettings): void {
    try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
        console.warn('Failed to save settings:', e);
    }
}

/** Get cached tree for a root page */
export function getCachedTree(rootId: string): CachedTree | null {
    try {
        const key = STORAGE_KEYS.TREE_PREFIX + rootId;
        const stored = localStorage.getItem(key);
        if (!stored) return null;

        const cached: CachedTree = JSON.parse(stored);

        // Check if cache is still valid
        if (Date.now() - cached.timestamp > CACHE_TTL) {
            localStorage.removeItem(key);
            return null;
        }

        return cached;
    } catch (e) {
        console.warn('Failed to load cached tree:', e);
        return null;
    }
}

/** Save tree to cache */
export function setCachedTree(rootId: string, rootTitle: string, tree: PageTreeNode): void {
    try {
        const key = STORAGE_KEYS.TREE_PREFIX + rootId;
        const cached: CachedTree = {
            rootId,
            rootTitle,
            tree,
            timestamp: Date.now(),
        };
        localStorage.setItem(key, JSON.stringify(cached));
    } catch (e) {
        console.warn('Failed to cache tree:', e);
    }
}

/** Clear cached tree for a root page */
export function clearCachedTree(rootId: string): void {
    try {
        const key = STORAGE_KEYS.TREE_PREFIX + rootId;
        localStorage.removeItem(key);
    } catch (e) {
        console.warn('Failed to clear cache:', e);
    }
}

/** Clear all cached trees */
export function clearAllCache(): void {
    try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(STORAGE_KEYS.TREE_PREFIX)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (e) {
        console.warn('Failed to clear cache:', e);
    }
}
