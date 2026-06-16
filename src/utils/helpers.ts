import { ctmLog } from './logger';

/** Delay execution */
export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Get current page ID from URL or AJS.Meta */
export function getCurrentPageId(): string | null {
    // Try URL query param first (?pageId=123)
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

    // Try AJS.Meta via multiple access paths (Confluence Server)
    // In Tampermonkey, `window` may be sandboxed — try unsafeWindow first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window) as any;
    const ajs = win.AJS;

    if (ajs?.Meta) {
        const metaPageId = ajs.Meta.get('page-id');
        if (metaPageId) {
            ctmLog('getCurrentPageId from AJS.Meta:', metaPageId);
            return String(metaPageId);
        }
    }

    // Try AJS.params (alternative location in some Server versions)
    if (ajs?.params?.pageId) {
        ctmLog('getCurrentPageId from AJS.params:', ajs.params.pageId);
        return String(ajs.params.pageId);
    }

    // Try HTML meta tag <meta name="ajs-page-id" content="12345">
    const metaTag = document.querySelector('meta[name="ajs-page-id"]');
    if (metaTag) {
        const content = metaTag.getAttribute('content');
        if (content) {
            ctmLog('getCurrentPageId from meta tag:', content);
            return content;
        }
    }

    // Try #content-body data attribute
    const contentBody = document.getElementById('content');
    const bodyPageId = contentBody?.getAttribute('data-content-id');
    if (bodyPageId) {
        ctmLog('getCurrentPageId from #content data-content-id:', bodyPageId);
        return bodyPageId;
    }

    // Try Confluence.getContentId() global function
    if (win.Confluence?.getContentId) {
        try {
            const cid = win.Confluence.getContentId();
            if (cid) {
                ctmLog('getCurrentPageId from Confluence.getContentId():', cid);
                return String(cid);
            }
        } catch { /* ignore */ }
    }

    // Confluence Server: /display/SPACE/PageTitle — pageId is NOT in URL
    const isDisplayPath = window.location.pathname.includes('/display/');
    if (isDisplayPath) {
        ctmLog('getCurrentPageId: Server /display/ path, all methods failed. URL:', window.location.href);
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
    const win = (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window) as any;
    if (win.AJS?.Meta) {
        const metaSpaceKey = win.AJS.Meta.get('space-key');
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

/**
 * Ensure a Uint8Array is from the current JS realm.
 *
 * fflate uses `instanceof Uint8Array` to detect file data vs nested folders
 * (see fflate source: `fltn` function). When a Uint8Array originates from a
 * different realm (e.g. Tampermonkey GM_xmlhttpRequest response, background
 * script message, or iframe), the instanceof check fails and fflate treats
 * the data as a directory — producing a garbled ZIP that Windows Explorer
 * refuses to open.
 *
 * This function always creates a fresh copy in the current realm's ArrayBuffer.
 */
export function ensureOwnRealmU8(data: Uint8Array): Uint8Array {
    if (data instanceof Uint8Array && data.buffer instanceof ArrayBuffer) {
        // Already in own realm — still copy to avoid shared-buffer issues
        const buf = new ArrayBuffer(data.byteLength);
        new Uint8Array(buf).set(data);
        return new Uint8Array(buf);
    }
    // Cross-realm fallback: iterate bytes manually
    const buf = new ArrayBuffer(data.length);
    const copy = new Uint8Array(buf);
    for (let i = 0; i < data.length; i++) copy[i] = data[i];
    return copy;
}

/**
 * Normalize all values in a fflate Zippable record to ensure they are
 * current-realm Uint8Arrays. Prevents cross-realm instanceof failures
 * that corrupt the ZIP structure.
 */
export function normalizeZipEntries(
    files: Record<string, Uint8Array | [Uint8Array, unknown]>
): void {
    for (const key of Object.keys(files)) {
        const entry = files[key];
        if (Array.isArray(entry)) {
            // Tuple form: [Uint8Array, ZipOptions]
            entry[0] = ensureOwnRealmU8(entry[0]);
        } else {
            // Plain form: Uint8Array
            files[key] = ensureOwnRealmU8(entry);
        }
    }
}
