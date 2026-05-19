import { getBaseUrl } from '@/api/confluence';

interface PageData {
    id: string;
    title: string;
}

export interface PageTitleMap {
    byId: Map<string, string>;      // pageId -> title
    byTitle: Map<string, string>;   // title -> pageId
}

export interface ResolvedLink {
    original: string;
    resolved: string;
    isInternal: boolean;
    isBroken: boolean;
}

/** Build page title map from exported pages */
export function buildPageTitleMap(pages: PageData[]): PageTitleMap {
    const byId = new Map<string, string>();
    const byTitle = new Map<string, string>();

    for (const page of pages) {
        byId.set(page.id, page.title);
        byTitle.set(page.title.toLowerCase(), page.id);
    }

    return { byId, byTitle };
}

/** Convert Confluence internal links to wikilinks */
export function convertToWikilinks(
    markdown: string,
    pageMap: PageTitleMap,
    currentPageId: string
): { markdown: string; brokenLinks: string[] } {
    const brokenLinks: string[] = [];
    const baseUrl = getBaseUrl();

    // Pattern for markdown links: [text](url)
    const linkPattern = /\[([^\]]*)\]\(([^)]+)\)/g;

    const converted = markdown.replace(linkPattern, (match, text, url) => {
        // Check if it's a Confluence internal link
        const pageIdMatch = url.match(/pageId=(\d+)/);
        const viewPageMatch = url.match(/\/pages\/viewpage\.action\?pageId=(\d+)/);
        const displayMatch = url.match(/\/display\/([^/]+)\/([^?#]+)/);

        let targetPageId: string | null = null;

        if (pageIdMatch) {
            targetPageId = pageIdMatch[1];
        } else if (viewPageMatch) {
            targetPageId = viewPageMatch[1];
        } else if (displayMatch && url.startsWith(baseUrl)) {
            // Try to find by title from display URL
            const titleFromUrl = decodeURIComponent(displayMatch[2]).replace(/\+/g, ' ');
            targetPageId = pageMap.byTitle.get(titleFromUrl.toLowerCase()) || null;
        }

        // If we found a target page ID
        if (targetPageId) {
            const targetTitle = pageMap.byId.get(targetPageId);

            if (targetTitle) {
                // Page is in our export - convert to wikilink
                const linkText = text && text !== targetTitle ? `${targetTitle}|${text}` : targetTitle;
                return `[[${linkText}]]`;
            } else {
                // Page not in export - mark as broken/external
                brokenLinks.push(url);
                return `[${text}](${url})`;
            }
        }

        // Check for anchor links within same page
        if (url.startsWith('#')) {
            const currentTitle = pageMap.byId.get(currentPageId);
            if (currentTitle) {
                return `[[${currentTitle}${url}|${text || url.slice(1)}]]`;
            }
        }

        // External link - keep as is
        return match;
    });

    return { markdown: converted, brokenLinks };
}

/** Convert HTML links to wikilinks before markdown conversion */
export function preprocessLinksForWikilinks(
    html: string,
    pageMap: PageTitleMap
): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    doc.querySelectorAll('a[href]').forEach((anchor) => {
        const href = anchor.getAttribute('href') || '';
        const text = anchor.textContent || '';

        // Extract page ID from various Confluence URL formats
        let targetPageId: string | null = null;

        const pageIdMatch = href.match(/pageId=(\d+)/);
        if (pageIdMatch) {
            targetPageId = pageIdMatch[1];
        }

        if (targetPageId) {
            const targetTitle = pageMap.byId.get(targetPageId);
            if (targetTitle) {
                // Mark for wikilink conversion
                anchor.setAttribute('data-wikilink', targetTitle);
                anchor.setAttribute('data-wikilink-text', text);
            }
        }
    });

    return doc.body.innerHTML;
}

/**
 * Sanitize title for use as a filename across Windows/macOS/Linux.
 *
 * Windows is the strictest target — it rejects:
 * - characters: < > : " / \ | ? *
 * - control chars: U+0000..U+001F
 * - trailing dots or spaces (Windows silently strips them, breaking ZIP extraction)
 * - reserved names: CON, PRN, AUX, NUL, COM1-9, LPT1-9 (with or without extension)
 *
 * Path length is capped at 100 chars per segment so combined paths stay under
 * Windows MAX_PATH (260) even with deep folder structure.
 */
export function sanitizeFilename(title: string): string {
    // 1) Replace forbidden chars and control chars with underscore
    let result = title
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
        // 2) Collapse whitespace (incl. NBSP) to single space
        .replace(/[\s\u00A0]+/g, ' ')
        .trim();

    // 3) Limit length BEFORE handling reserved names so we don't double-trim later
    if (result.length > 100) {
        result = result.substring(0, 100).trim();
    }

    // 4) Strip trailing dots/spaces (Windows can't create such files)
    result = result.replace(/[. ]+$/, '');

    // 5) Reserved Windows names (case-insensitive, with or without extension)
    if (/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.[^.]*)?$/i.test(result)) {
        result = `_${result}`;
    }

    // 6) Empty fallback
    if (!result) result = '_';

    return result;
}

/**
 * Sanitize a filename while preserving its extension.
 * Used for attachments where the extension carries semantic meaning (e.g., .png, .pdf).
 */
export function sanitizeAttachmentFilename(filename: string): string {
    const dotIndex = filename.lastIndexOf('.');
    // Only treat as extension if dot is not first/last char and short enough
    if (dotIndex > 0 && dotIndex < filename.length - 1 && filename.length - dotIndex <= 16) {
        const name = filename.substring(0, dotIndex);
        const ext = filename.substring(dotIndex); // includes the dot
        const cleanExt = ext.replace(/[<>:"/\\|?*\x00-\x1f]/g, '');
        const sanitizedName = sanitizeFilename(name);
        // Keep room for extension in 100-char limit
        const maxNameLen = Math.max(1, 100 - cleanExt.length);
        const truncatedName = sanitizedName.length > maxNameLen
            ? sanitizedName.substring(0, maxNameLen).trim()
            : sanitizedName;
        return truncatedName + cleanExt;
    }
    return sanitizeFilename(filename);
}

/** Create wikilink from title */
export function makeWikilink(title: string, displayText?: string): string {
    if (displayText && displayText !== title) {
        return `[[${title}|${displayText}]]`;
    }
    return `[[${title}]]`;
}

/** Create anchor from title for internal links */
export function makeAnchor(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}
