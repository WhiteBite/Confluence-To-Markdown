/** Delay execution */
export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Get current page ID from URL or AJS.Meta */
export function getCurrentPageId(): string | null {
    // Try URL query param first
    const params = new URLSearchParams(window.location.search);
    const pageId = params.get('pageId');
    if (pageId) return pageId;

    // Fallback to AJS.Meta (works on /display/SPACEKEY/PageTitle URLs)
    if (typeof window !== 'undefined' && (window as any).AJS?.Meta) {
        const metaPageId = (window as any).AJS.Meta.get('page-id');
        if (metaPageId) return String(metaPageId);
    }

    return null;
}

/** Get current space key from URL or AJS.Meta */
export function getSpaceKey(): string | null {
    // Try URL query param
    const params = new URLSearchParams(window.location.search);
    const spaceKey = params.get('spaceKey');
    if (spaceKey) return spaceKey;

    // Try URL path /display/SPACEKEY/...
    const pathMatch = window.location.pathname.match(/\/display\/([^/]+)/);
    if (pathMatch) return pathMatch[1];

    // Fallback to AJS.Meta
    if (typeof window !== 'undefined' && (window as any).AJS?.Meta) {
        const metaSpaceKey = (window as any).AJS.Meta.get('space-key');
        if (metaSpaceKey) return metaSpaceKey;
    }

    return null;
}

/** Safe error message extraction */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Unknown error';
}
