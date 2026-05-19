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
        ctmLog('getCurrentPageId from URL param:', pageId);
        return pageId;
    }

    // Try URL path /wiki/spaces/SPACE/pages/123/PageTitle (Confluence Cloud)
    const pathPageMatch = window.location.pathname.match(/\/pages\/(\d+)/);
    if (pathPageMatch) {
        ctmLog('getCurrentPageId from URL path:', pathPageMatch[1]);
        return pathPageMatch[1];
    }

    // Fallback to AJS.Meta (works on /display/SPACEKEY/PageTitle URLs — Confluence Server)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ajs = typeof window !== 'undefined' ? (window as any).AJS : undefined;
    if (ajs?.Meta) {
        const metaPageId = ajs.Meta.get('page-id');
        if (metaPageId) {
            ctmLog('getCurrentPageId from AJS.Meta:', metaPageId);
            return String(metaPageId);
        }
    }

    // Try to extract from AJS.params (alternative location in some Server versions)
    if (ajs?.params) {
        const paramsPageId = ajs.params.pageId;
        if (paramsPageId) {
            ctmLog('getCurrentPageId from AJS.params:', paramsPageId);
            return String(paramsPageId);
        }
    }

    // Confluence Server: /display/SPACE/PageTitle — pageId is NOT in URL, need AJS.Meta
    const isDisplayPath = window.location.pathname.includes('/display/');
    if (isDisplayPath) {
        ctmLog('getCurrentPageId: Server /display/ path but AJS.Meta missing. URL:', window.location.href);
        return null;
    }

    ctmLog('getCurrentPageId: NOT FOUND — URL:', window.location.href);
    return null;
}

/** Find action menu container for button injection (Cloud vs Server have different DOM) */
export function findActionMenuContainer(): HTMLElement | null {
    // Confluence Cloud: #action-menu-link is inside #page-metadata-bar or .cp-header-actions
    const cloudMenu = document.getElementById('action-menu-link');
    if (cloudMenu?.parentElement) {
        return cloudMenu.parentElement;
    }

    // Confluence Server: buttons are in #toolbar or .page-metadata or .aui-toolbar
    const serverToolbar = document.querySelector('#toolbar, .page-metadata, .aui-toolbar, .content-header .aui-buttons');
    if (serverToolbar) {
        return serverToolbar as HTMLElement;
    }

    // Fallback: any header action area
    const fallback = document.querySelector('.cp-header-actions, .content-header, #main-header');
    if (fallback) {
        return fallback as HTMLElement;
    }

    return null;
}

/** Get current space key from URL or AJS.Meta */
export function getSpaceKey(): string | null {
    // Try URL query param
    const params = new URLSearchParams(window.location.search);
    const spaceKey = params.get('spaceKey');
    if (spaceKey) {
        ctmLog('getSpaceKey from URL param:', spaceKey);
        return spaceKey;
    }

    // Try URL path /display/SPACEKEY/...
    const displayMatch = window.location.pathname.match(/\/display\/([^/]+)/);
    if (displayMatch) {
        ctmLog('getSpaceKey from /display/ path:', displayMatch[1]);
        return displayMatch[1];
    }

    // Try URL path /wiki/spaces/SPACEKEY/... (Confluence Cloud)
    const spacesMatch = window.location.pathname.match(/\/spaces\/([^/]+)/);
    if (spacesMatch) {
        ctmLog('getSpaceKey from /spaces/ path:', spacesMatch[1]);
        return spacesMatch[1];
    }

    // Try URL path /pages/viewpage.action?spaceKey=XXX
    const viewPageMatch = window.location.search.match(/[?&]spaceKey=([^&]+)/);
    if (viewPageMatch) {
        ctmLog('getSpaceKey from viewpage query:', viewPageMatch[1]);
        return viewPageMatch[1];
    }

    // Fallback to AJS.Meta
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ajs = typeof window !== 'undefined' ? (window as any).AJS : undefined;
    if (ajs?.Meta) {
        const metaSpaceKey = ajs.Meta.get('space-key');
        if (metaSpaceKey) {
            ctmLog('getSpaceKey from AJS.Meta:', metaSpaceKey);
            return metaSpaceKey;
        }
    }

    ctmLog('getSpaceKey: NOT FOUND — URL:', window.location.href);
    return null;
}

/** Safe error message extraction */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Unknown error';
}
