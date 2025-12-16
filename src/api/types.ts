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
