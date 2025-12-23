import type { PageTreeNode, ObsidianExportSettings, ExportPreset } from '@/api/types';

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

/** Default Obsidian export settings */
export const DEFAULT_OBSIDIAN_SETTINGS: ObsidianExportSettings = {
    // Format
    exportFormat: 'single',
    folderStructure: 'hierarchical',

    // Links
    linkStyle: 'wikilink',
    resolveInternalLinks: true,

    // Frontmatter
    includeFrontmatter: true,
    includeConfluenceMetadata: true,

    // Diagrams
    exportDiagrams: true,
    includeDiagramSource: true,
    includeDiagramPreview: true,
    diagramPreviewScale: 2,
    convertDiagrams: true,
    diagramTargetFormat: 'wikilink',
    embedDiagramsAsCode: true,

    // Attachments
    downloadAttachments: true,
    maxAttachmentSizeMB: 50,

    // Content
    useObsidianCallouts: true,

    // Base settings
    includeImages: true,
    includeMetadata: true,
    includeComments: false,
    includeSourceLinks: true,
};

/** Export presets */
export const EXPORT_PRESETS: Record<ExportPreset, Partial<ObsidianExportSettings>> = {
    quick: {
        exportFormat: 'obsidian',
        folderStructure: 'flat',
        downloadAttachments: false,
        exportDiagrams: false,
        convertDiagrams: false,
        includeFrontmatter: false,
        linkStyle: 'markdown',
        useObsidianCallouts: false,
    },
    full: {
        exportFormat: 'obsidian',
        folderStructure: 'hierarchical',
        downloadAttachments: true,
        exportDiagrams: true,
        includeDiagramSource: true,
        includeDiagramPreview: true,
        convertDiagrams: true,
        diagramTargetFormat: 'wikilink',
        embedDiagramsAsCode: true,
        includeFrontmatter: true,
        includeConfluenceMetadata: true,
        linkStyle: 'wikilink',
        useObsidianCallouts: true,
    },
    documentation: {
        exportFormat: 'obsidian',
        folderStructure: 'flat',
        downloadAttachments: true,
        exportDiagrams: true,
        includeDiagramSource: false,
        includeDiagramPreview: true,
        convertDiagrams: true,
        diagramTargetFormat: 'mermaid',
        embedDiagramsAsCode: true,
        includeFrontmatter: false,
        linkStyle: 'markdown',
        useObsidianCallouts: false,
        includeSourceLinks: false,
    },
    sync: {
        exportFormat: 'obsidian',
        folderStructure: 'hierarchical',
        downloadAttachments: true,
        exportDiagrams: true,
        includeDiagramSource: true,
        convertDiagrams: false,
        diagramTargetFormat: 'wikilink',
        includeFrontmatter: true,
        includeConfluenceMetadata: true,
        linkStyle: 'wikilink',
        useObsidianCallouts: true,
    },
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
    OBSIDIAN_SETTINGS: 'md_obsidian_settings',
    TREE_PREFIX: 'md_tree_cache_',
} as const;

/** Cache TTL - 24 hours */
export const CACHE_TTL = 24 * 60 * 60 * 1000;
