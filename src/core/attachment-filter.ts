/**
 * Attachment type filter — extension-based filtering with preset categories.
 *
 * Filter string format (comma-separated):
 *   - Category keywords: `images`, `documents`, `archives`, `media`
 *   - Literal extensions: `.pdf`, `.csv`, `.json`
 *   - Wildcard: `*` (match everything)
 *   - Empty string: match nothing
 */

import type { AttachmentInfo } from '@/api/types';

/** Category definitions with their extensions */
export const ATTACHMENT_CATEGORIES: Record<string, { label: string; icon: string; extensions: string[] }> = {
    images: {
        label: 'Images',
        icon: '🖼',
        extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico', 'tiff'],
    },
    documents: {
        label: 'Documents',
        icon: '📄',
        extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'txt', 'rtf', 'odt', 'ods', 'json', 'xml', 'yaml', 'yml', 'md'],
    },
    archives: {
        label: 'Archives',
        icon: '📦',
        extensions: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'],
    },
    media: {
        label: 'Media',
        icon: '🎬',
        extensions: ['mp3', 'mp4', 'avi', 'mov', 'wav', 'flac', 'ogg', 'mkv', 'webm'],
    },
};

/** Wildcard extension that matches everything */
const WILDCARD = '*';

/** Extract file extension (lowercase, no dot) from filename */
function getExtension(filename: string): string {
    const dot = filename.lastIndexOf('.');
    if (dot < 0 || dot === filename.length - 1) return '';
    return filename.substring(dot + 1).toLowerCase();
}

/**
 * Parse a filter string into a Set of lowercase extensions.
 * If the filter contains '*', returns a Set containing '*' (matches all).
 * Category keywords are expanded to their extension lists.
 * Literal extensions (with or without leading dot) are normalized to no-dot lowercase.
 */
export function parseAttachmentFilter(filter: string): Set<string> {
    if (!filter || !filter.trim()) return new Set();

    const parts = filter
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);

    if (parts.includes(WILDCARD)) return new Set([WILDCARD]);

    const extensions = new Set<string>();

    for (const part of parts) {
        const category = ATTACHMENT_CATEGORIES[part];
        if (category) {
            // Category keyword — expand to all its extensions
            for (const ext of category.extensions) {
                extensions.add(ext);
            }
        } else {
            // Literal extension — strip leading dot
            const ext = part.startsWith('.') ? part.substring(1) : part;
            if (ext) extensions.add(ext);
        }
    }

    return extensions;
}

/** Check if a filename matches the given filter set */
export function matchesAttachmentFilter(filename: string, filterSet: Set<string>): boolean {
    if (filterSet.size === 0) return false;
    if (filterSet.has(WILDCARD)) return true;
    const ext = getExtension(filename);
    return ext ? filterSet.has(ext) : false;
}

/** Detect unique extensions in a list of attachments and count occurrences */
export function detectExtensions(attachments: AttachmentInfo[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const att of attachments) {
        const ext = getExtension(att.filename);
        if (ext) {
            counts.set(ext, (counts.get(ext) || 0) + 1);
        }
    }
    return counts;
}

/** Get category summary for UI display (which categories have files and how many) */
export function getCategorySummary(detectedExtensions: Map<string, number>): Array<{
    key: string;
    label: string;
    icon: string;
    count: number;
    extensions: string[];
}> {
    const result: Array<{ key: string; label: string; icon: string; count: number; extensions: string[] }> = [];

    for (const [key, cat] of Object.entries(ATTACHMENT_CATEGORIES)) {
        let count = 0;
        for (const ext of cat.extensions) {
            count += detectedExtensions.get(ext) || 0;
        }
        result.push({
            key,
            label: cat.label,
            icon: cat.icon,
            count,
            extensions: cat.extensions,
        });
    }

    return result;
}

/**
 * Build a filter string from category keys and optional custom extensions.
 * Merges category keywords + extra extensions into a clean comma-separated string.
 */
export function buildFilterString(categories: string[], customExtensions: string[]): string {
    const parts: string[] = [...categories];

    for (const ext of customExtensions) {
        const clean = ext.trim().toLowerCase().replace(/^\./, '');
        if (!clean) continue;
        // Skip if already covered by a category
        let covered = false;
        for (const cat of categories) {
            const catDef = ATTACHMENT_CATEGORIES[cat];
            if (catDef?.extensions.includes(clean)) {
                covered = true;
                break;
            }
        }
        if (!covered) parts.push(`.${clean}`);
    }

    return parts.join(',');
}

/**
 * Check which categories are fully represented in a filter set.
 * Returns the category keys that have ALL their extensions present.
 */
export function detectCategoriesFromFilter(filterSet: Set<string>): string[] {
    if (filterSet.has(WILDCARD)) return Object.keys(ATTACHMENT_CATEGORIES);

    const matched: string[] = [];
    for (const [key, cat] of Object.entries(ATTACHMENT_CATEGORIES)) {
        if (cat.extensions.every(ext => filterSet.has(ext))) {
            matched.push(key);
        }
    }
    return matched;
}

/**
 * Get extensions from filter that are NOT covered by any of the given categories.
 * Useful for showing "custom" extensions in the UI.
 */
export function getCustomExtensions(filterSet: Set<string>, activeCategories: string[]): string[] {
    const coveredByCategories = new Set<string>();
    for (const cat of activeCategories) {
        const catDef = ATTACHMENT_CATEGORIES[cat];
        if (catDef) {
            for (const ext of catDef.extensions) coveredByCategories.add(ext);
        }
    }

    const custom: string[] = [];
    for (const ext of filterSet) {
        if (ext !== WILDCARD && !coveredByCategories.has(ext)) {
            custom.push(ext);
        }
    }
    return custom.sort();
}
