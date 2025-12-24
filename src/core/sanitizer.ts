import { DEBUG } from '@/config';

/** Base selectors to always remove */
const BASE_SELECTORS_TO_REMOVE = [
    '#likes-and-labels-container',
    '#likes-section',
    '#labels-section',
    '.page-metadata-modification-info',
    '#children-section',
    '.plugin_pagetree',
    '.content-action',
    '.page-header-actions',
    '.contributors',
    'script',
    'style',
    '.expand-control',
    '.aui-expander-trigger',
];

/** Selectors for diagram macros */
const DIAGRAM_SELECTORS = [
    '[data-macro-name="drawio"]',
    '[data-macro-name="drawio-sketch"]',
    '.drawio-macro',
    '.drawio-diagram',
    '.conf-macro[data-macro-name="drawio"]',
    '.conf-macro[data-macro-name="drawio-sketch"]',
    '[data-macro-name="gliffy"]',
    '.gliffy-macro',
    '.gliffy-diagram',
].join(', ');

export interface SanitizeOptions {
    includeImages: boolean;
    includeComments: boolean;
}

/** Diagram info extracted before sanitization */
export interface DiagramInfo {
    /** Index of diagram in document order */
    index: number;
    /** Diagram name */
    name: string;
    /** Diagram type */
    type: 'drawio' | 'drawio-sketch' | 'gliffy' | 'plantuml' | 'mermaid';
    /** Original macro element outerHTML for matching */
    macroId?: string;
}

/**
 * Extract diagram name from script content inside a macro element.
 * Must be called BEFORE scripts are removed from DOM.
 */
function extractDiagramNameFromScript(el: HTMLElement): string {
    const script = el.querySelector('script');
    if (!script?.textContent) return '';

    // Parse readerOpts.diagramName from script (URL-encoded format)
    const nameMatch = script.textContent.match(/readerOpts\.diagramName\s*=\s*decodeURIComponent\(['"]([^'"]+)['"]\)/);
    if (nameMatch) {
        try {
            return decodeURIComponent(nameMatch[1]);
        } catch {
            return nameMatch[1];
        }
    }

    // Fallback: simple string assignment
    const simpleMatch = script.textContent.match(/readerOpts\.diagramName\s*=\s*['"]([^'"]+)['"]/);
    if (simpleMatch) return simpleMatch[1];

    return '';
}

/**
 * Extract diagram info from HTML BEFORE sanitization.
 * This preserves diagram names that are stored in script tags.
 */
export function extractDiagramInfoFromHtml(html: string): DiagramInfo[] {
    if (!html) return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const diagrams: DiagramInfo[] = [];

    doc.querySelectorAll(DIAGRAM_SELECTORS).forEach((el, index) => {
        const htmlEl = el as HTMLElement;
        const macroName = htmlEl.dataset.macroName || '';

        // Determine diagram type
        let type: DiagramInfo['type'] = 'drawio';
        if (macroName === 'drawio-sketch' || htmlEl.classList.contains('drawio-sketch')) {
            type = 'drawio-sketch';
        } else if (macroName === 'gliffy' || htmlEl.classList.contains('gliffy-macro') || htmlEl.classList.contains('gliffy-diagram')) {
            type = 'gliffy';
        }

        // Try to get name from data attributes first
        let name = htmlEl.dataset.diagramName ||
            htmlEl.getAttribute('data-diagram-name') ||
            '';

        // If no name in attributes, extract from script
        if (!name) {
            name = extractDiagramNameFromScript(htmlEl);
        }

        // Fallback to generic name with index
        if (!name) {
            name = `diagram-${index + 1}`;
        }

        diagrams.push({
            index,
            name,
            type,
            macroId: `diagram-${index}`,
        });

        // Add data attribute to element for later matching in Turndown
        htmlEl.setAttribute('data-extracted-diagram-name', name);
        htmlEl.setAttribute('data-diagram-index', String(index));
    });

    if (DEBUG && diagrams.length > 0) {
        console.log('Extracted diagram info:', diagrams);
    }

    return diagrams;
}

/** Pre-process and sanitize HTML before Turndown conversion */
export function sanitizeHtml(html: string, options: SanitizeOptions, pageId?: string): string {
    if (!html) return '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    if (DEBUG) console.group(`Sanitize HTML for Page ID: ${pageId || 'N/A'}`);

    // Extract only main content, ignore Confluence UI
    const contentSelectors = [
        '.wiki-content',           // Main Confluence content
        '#main-content',           // Alternative selector
        '.page-content',           // Another variant
        '.confluence-content',     // Server/DC format
    ];

    let contentElement: Element | null = null;
    for (const selector of contentSelectors) {
        contentElement = doc.querySelector(selector);
        if (contentElement) {
            if (DEBUG) console.log(`Found content using selector: ${selector}`);
            break;
        }
    }

    // If no content container found, work with body but remove UI elements
    if (!contentElement) {
        if (DEBUG) console.warn('No content container found, using body with cleanup');
        contentElement = doc.body;

        // Remove Confluence UI elements
        const uiSelectors = [
            '#header', '.aui-header', '.aui-nav', '#navigation',
            '.ia-fixed-sidebar', '.ia-splitter-left', '#breadcrumbs', '.breadcrumbs',
            '#sidebar', '.ia-secondary-sidebar', '.space-tools-section',
            '#footer', '.footer', '.aui-footer',
            '#action-menu-link', '.page-metadata', '.page-metadata-banner',
            '.aui-page-panel-nav', '.aui-page-header', '.aui-page-header-inner',
        ];

        uiSelectors.forEach(selector => {
            contentElement?.querySelectorAll(selector).forEach(el => el.remove());
        });
    }

    // Create a new document with only the content
    const cleanDoc = parser.parseFromString('<html><body></body></html>', 'text/html');
    cleanDoc.body.innerHTML = contentElement.innerHTML;

    // Expand collapsed content
    cleanDoc.querySelectorAll('.aui-expander-content, .expand-content').forEach((el) => {
        (el as HTMLElement).style.display = 'block';
        el.removeAttribute('aria-hidden');
        const expander = el.closest('.aui-expander-container, .expand-container');
        if (expander) {
            expander.classList.remove('collapsed');
            expander.classList.add('expanded');
        }
    });

    // IMPORTANT: Extract diagram names from scripts BEFORE removing scripts
    cleanDoc.querySelectorAll(DIAGRAM_SELECTORS).forEach((el, index) => {
        const htmlEl = el as HTMLElement;

        // Check if already has name
        let name = htmlEl.dataset.diagramName ||
            htmlEl.getAttribute('data-diagram-name') ||
            htmlEl.getAttribute('data-extracted-diagram-name') ||
            '';

        // Extract from script if needed
        if (!name) {
            name = extractDiagramNameFromScript(htmlEl);
        }

        // Set extracted name as data attribute (will survive script removal)
        if (name) {
            htmlEl.setAttribute('data-extracted-diagram-name', name);
        }
        htmlEl.setAttribute('data-diagram-index', String(index));

        // Extract and preserve original image URL for single file export
        const img = htmlEl.querySelector('img');
        if (img?.src) {
            htmlEl.setAttribute('data-original-image-url', img.src);
        }

        // Add a text marker that Turndown will see (hidden from display)
        // This ensures Turndown doesn't skip empty diagram containers
        const marker = cleanDoc.createElement('span');
        marker.style.display = 'none';
        marker.setAttribute('data-diagram-marker', 'true');
        marker.textContent = `DIAGRAM:${name || `diagram-${index + 1}`}`;
        htmlEl.appendChild(marker);
    });

    // Remove base selectors (including scripts - but diagram names are now preserved)
    BASE_SELECTORS_TO_REMOVE.forEach((selector) => {
        cleanDoc.querySelectorAll(selector).forEach((el) => el.remove());
    });

    // Conditionally remove comments
    if (!options.includeComments) {
        cleanDoc.querySelectorAll('#comments-section, .comment-thread, .inline-comment').forEach((el) => {
            el.remove();
        });
    }

    // Conditionally remove images
    if (!options.includeImages) {
        cleanDoc.querySelectorAll('img, .confluence-embedded-image, .image-wrap').forEach((el) => {
            el.remove();
        });
    } else {
        // Add alt text to images without it
        cleanDoc.querySelectorAll('img').forEach((img) => {
            if (!img.alt?.trim()) {
                const src = img.src || '';
                const filename = src.split('/').pop()?.split('?')[0] || 'image';
                img.alt = `[Image: ${filename}]`;
            }
        });
    }

    if (DEBUG) console.groupEnd();

    return cleanDoc.body.innerHTML;
}
