import { ctmLog } from './logger';

/** Delay execution */
export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Get current page ID from URL or AJS.Meta */
export function getCurrentPageId(): string | null {
    // Try URL query param first
    const params = new URLSearchParams(window.location.search);
    const pageId = params.get('pageId');
    if (pageId) {
        ctmLog('[CTM] getCurrentPageId from URL param:', pageId);
        return pageId;
    }

    // Try URL path /wiki/spaces/SPACE/pages/123/PageTitle (Confluence Cloud)
    const pathPageMatch = window.location.pathname.match(/\/pages\/(\d+)/);
    if (pathPageMatch) {
        ctmLog('[CTM] getCurrentPageId from URL path:', pathPageMatch[1]);
        return pathPageMatch[1];
    }

    // Fallback to AJS.Meta (works on /display/SPACEKEY/PageTitle URLs)
    if (typeof window !== 'undefined' && (window as any).AJS?.Meta) {
        const metaPageId = (window as any).AJS.Meta.get('page-id');
        if (metaPageId) {
            ctmLog('[CTM] getCurrentPageId from AJS.Meta:', metaPageId);
            return String(metaPageId);
        }
    }

    ctmLog('[CTM] getCurrentPageId: NOT FOUND — URL:', window.location.href);
    return null;
}

/** Get current space key from URL or AJS.Meta */
export function getSpaceKey(): string | null {
    // Try URL query param
    const params = new URLSearchParams(window.location.search);
    const spaceKey = params.get('spaceKey');
    if (spaceKey) {
        ctmLog('[CTM] getSpaceKey from URL param:', spaceKey);
        return spaceKey;
    }

    // Try URL path /display/SPACEKEY/...
    const displayMatch = window.location.pathname.match(/\/display\/([^/]+)/);
    if (displayMatch) {
        ctmLog('[CTM] getSpaceKey from /display/ path:', displayMatch[1]);
        return displayMatch[1];
    }

    // Try URL path /wiki/spaces/SPACEKEY/... (Confluence Cloud)
    const spacesMatch = window.location.pathname.match(/\/spaces\/([^/]+)/);
    if (spacesMatch) {
        ctmLog('[CTM] getSpaceKey from /spaces/ path:', spacesMatch[1]);
        return spacesMatch[1];
    }

    // Try URL path /pages/viewpage.action?spaceKey=XXX
    const viewPageMatch = window.location.search.match(/[?&]spaceKey=([^&]+)/);
    if (viewPageMatch) {
        ctmLog('[CTM] getSpaceKey from viewpage query:', viewPageMatch[1]);
        return viewPageMatch[1];
    }

    // Fallback to AJS.Meta
    if (typeof window !== 'undefined' && (window as any).AJS?.Meta) {
        const metaSpaceKey = (window as any).AJS.Meta.get('space-key');
        if (metaSpaceKey) {
            ctmLog('[CTM] getSpaceKey from AJS.Meta:', metaSpaceKey);
            return metaSpaceKey;
        }
    }

    ctmLog('[CTM] getSpaceKey: NOT FOUND — URL:', window.location.href);
    return null;
}

/** Safe error message extraction */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Unknown error';
}
