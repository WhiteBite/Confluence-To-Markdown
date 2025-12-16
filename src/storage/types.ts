import type { PageTreeNode } from '@/api/types';

/** Export settings */
export interface ExportSettings {
    includeImages: boolean;
    includeMetadata: boolean;
    includeComments: boolean;
    includeSourceLinks: boolean;
}

/** Default settings */
export const DEFAULT_SETTINGS: ExportSettings = {
    includeImages: true,
    includeMetadata: true,
    includeComments: false,
    includeSourceLinks: true,
};

/** Cached tree structure */
export interface CachedTree {
    rootId: string;
    rootTitle: string;
    tree: PageTreeNode;
    timestamp: number;
}

/** Storage keys */
export const STORAGE_KEYS = {
    SETTINGS: 'md_export_settings',
    TREE_PREFIX: 'md_tree_cache_',
} as const;

/** Cache TTL - 24 hours */
export const CACHE_TTL = 24 * 60 * 60 * 1000;
