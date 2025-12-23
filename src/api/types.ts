/** Confluence page basic info */
export interface ConfluencePage {
    id: string;
    title: string;
    type: string;
    status: string;
    _links?: {
        webui?: string;
        self?: string;
    };
}

/** Ancestor info from API */
export interface ConfluenceAncestor {
    id: string;
    title: string;
    type: string;
}

/** Page with expanded body content */
export interface ConfluencePageWithContent extends ConfluencePage {
    body: {
        view: {
            value: string;
            representation: string;
        };
    };
    version?: {
        number: number;
        when: string;
    };
    ancestors?: ConfluenceAncestor[];
}

/** Paginated API response */
export interface ConfluencePaginatedResponse<T> {
    results: T[];
    start: number;
    limit: number;
    size: number;
    _links?: {
        next?: string;
    };
}

/** Internal page tree node */
export interface PageTreeNode {
    id: string;
    title: string;
    level: number;
    parentId: string | null;
    children: PageTreeNode[];
    error?: boolean;
}

/** Version info */
export interface ConfluenceVersion {
    number: number;
    when: string;
    by?: {
        displayName?: string;
        email?: string;
    };
}

/** Page data with fetched content */
export interface PageContentData {
    id: string;
    title: string;
    htmlContent: string;
    ancestors: ConfluenceAncestor[];
    version?: ConfluenceVersion;
    error: boolean;
}

/** Export result */
export interface ExportResult {
    markdown: string;
    pageCount: number;
    title: string;
}

/** Attachment info from API */
export interface AttachmentInfo {
    id: string;
    title: string;
    filename: string;
    mediaType: string;
    fileSize: number;
    downloadUrl: string;
    pageId: string;
}

/** Diagram attachment with source and preview */
export interface DiagramAttachment extends AttachmentInfo {
    diagramType: 'drawio' | 'gliffy' | 'unknown';
    diagramName: string;
    renderUrl: string;
}

/** Exported diagram with blobs */
export interface ExportedDiagram {
    name: string;
    pageId: string;
    source: Blob | null;
    preview: Blob | null;
    type: 'drawio' | 'gliffy';
}

/** Exported attachment */
export interface ExportedAttachment {
    filename: string;
    pageId: string;
    blob: Blob;
    type: 'image' | 'diagram-preview' | 'diagram-source' | 'file';
}

/** Obsidian export settings */
export interface ObsidianExportSettings {
    // Format
    exportFormat: 'single' | 'obsidian';
    folderStructure: 'hierarchical' | 'flat';

    // Links
    linkStyle: 'wikilink' | 'markdown';
    resolveInternalLinks: boolean;

    // Frontmatter
    includeFrontmatter: boolean;
    includeConfluenceMetadata: boolean;

    // Diagrams
    exportDiagrams: boolean;
    includeDiagramSource: boolean;
    includeDiagramPreview: boolean;
    diagramPreviewScale: 1 | 2 | 3;
    /** Convert diagrams to target format */
    convertDiagrams: boolean;
    /** Target format for diagram conversion */
    diagramTargetFormat: 'mermaid' | 'drawio-xml' | 'wikilink';
    /** Embed diagrams as code blocks in markdown */
    embedDiagramsAsCode: boolean;

    // Attachments
    downloadAttachments: boolean;
    maxAttachmentSizeMB: number;

    // Content
    useObsidianCallouts: boolean;

    // Existing settings
    includeImages: boolean;
    includeMetadata: boolean;
    includeComments: boolean;
    includeSourceLinks: boolean;
}

/** Export preset type */
export type ExportPreset = 'quick' | 'full' | 'documentation' | 'sync';

/** Obsidian vault export result */
export interface ObsidianExportResult {
    zipBlob: Blob;
    pageCount: number;
    attachmentCount: number;
    diagramCount: number;
    totalSize: number;
    title: string;
}
