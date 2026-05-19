import TurndownService from 'turndown';
import type { ConvertOptions } from '../converter';

export function applyMediaRules(turndown: TurndownService, options?: ConvertOptions): void {
    const useWikilinks = options?.useWikilinks ?? true;

    // Rule: Images - convert to Obsidian wikilinks or standard markdown
    if (useWikilinks) {
        turndown.addRule('obsidianImages', {
            filter: 'img',
            replacement: (_content, node) => {
                const img = node as HTMLImageElement;
                const src = img.getAttribute('src') || '';
                const alt = img.getAttribute('alt') || '';

                // Extract filename from URL
                let filename: string;
                try {
                    const url = new URL(src, 'https://example.com');
                    // Get filename from path
                    const pathParts = url.pathname.split('/');
                    filename = pathParts[pathParts.length - 1];
                    // Remove query params from filename
                    filename = filename.split('?')[0];
                    // Decode URI components
                    filename = decodeURIComponent(filename);
                } catch {
                    // Fallback: extract from src directly
                    filename = src.split('/').pop()?.split('?')[0] || 'image.png';
                    try {
                        filename = decodeURIComponent(filename);
                    } catch {
                        // Keep as is
                    }
                }

                // Use wikilink format with _attachments path
                if (alt && alt !== `[Image: ${filename}]`) {
                    return `\n![[_attachments/${filename}|${alt}]]\n`;
                }
                return `\n![[_attachments/${filename}]]\n`;
            },
        });
    } else {
        // Standard markdown images - keep original URL
        turndown.addRule('standardImages', {
            filter: 'img',
            replacement: (_content, node) => {
                const img = node as HTMLImageElement;
                const src = img.getAttribute('src') || '';
                const alt = img.getAttribute('alt') || 'image';

                // Keep original URL for single file export
                if (src) {
                    return `\n![${alt}](${src})\n`;
                }
                return '';
            },
        });
    }
}
