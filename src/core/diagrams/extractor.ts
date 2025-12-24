import type { DiagramReference } from './types';

/** Extract diagram references from HTML content */
export function extractDiagramReferences(html: string): DiagramReference[] {
    const diagrams: DiagramReference[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Draw.io macros - multiple selector patterns for different Confluence versions
    // Including drawio-sketch (whiteboard mode)
    const drawioSelectors = [
        '[data-macro-name="drawio"]',
        '[data-macro-name="drawio-sketch"]',
        '.drawio-macro',
        '.drawio-diagram',
        '.conf-macro[data-macro-name="drawio"]',
        '.conf-macro[data-macro-name="drawio-sketch"]',
    ].join(', ');

    doc.querySelectorAll(drawioSelectors).forEach((el) => {
        let name = (el as HTMLElement).dataset.diagramName ||
            el.getAttribute('data-diagram-name') ||
            el.querySelector('img')?.getAttribute('data-diagram-name') ||
            '';
        let imageUrl: string | undefined;

        // Try to extract from script content (Confluence Server/DC format)
        if (!name) {
            const script = el.querySelector('script');
            if (script?.textContent) {
                // Try diagramName first (older format)
                const nameMatch = script.textContent.match(/readerOpts\.diagramName\s*=\s*decodeURIComponent\(['"]([^'"]+)['"]\)/);
                if (nameMatch) {
                    try {
                        name = decodeURIComponent(nameMatch[1]);
                    } catch {
                        name = nameMatch[1];
                    }
                }
                if (!name) {
                    const simpleMatch = script.textContent.match(/readerOpts\.diagramName\s*=\s*['"]([^'"]+)['"]/);
                    if (simpleMatch) name = simpleMatch[1];
                }

                // Try to extract from loadUrl (newer format: /rest/drawio/1.0/diagram/crud/%31/pageId)
                if (!name) {
                    // Format: readerOpts.loadUrl = '' + '/rest/drawio/1.0/diagram/crud/%31/130520250?revision=1';
                    const loadUrlMatch = script.textContent.match(/readerOpts\.loadUrl\s*=\s*''\s*\+\s*'([^']+)'/);
                    if (loadUrlMatch) {
                        const urlPath = loadUrlMatch[1];
                        const crudMatch = urlPath.match(/\/diagram\/crud\/([^/]+)\//);
                        if (crudMatch) {
                            try {
                                name = decodeURIComponent(crudMatch[1]);
                            } catch {
                                name = crudMatch[1];
                            }
                        }
                    }
                }

                // Extract imageUrl for direct PNG download
                // Format: readerOpts.imageUrl = '' + '/download/attachments/130520250/1.png' + '?version=1&api=v2';
                const imageUrlMatch = script.textContent.match(/readerOpts\.imageUrl\s*=\s*''\s*\+\s*'([^']+)'/);
                if (imageUrlMatch) {
                    imageUrl = imageUrlMatch[1];
                }
            }
        }

        if (!name) name = 'diagram';
        diagrams.push({ type: 'drawio', name, imageUrl });
    });

    // Gliffy macros
    doc.querySelectorAll('[data-macro-name="gliffy"], .gliffy-macro, .gliffy-diagram').forEach((el) => {
        let name = (el as HTMLElement).dataset.diagramName ||
            el.getAttribute('data-diagram-name') ||
            '';

        // Try to find name in child elements
        if (!name) {
            const childWithName = el.querySelector('[data-diagram-name]');
            if (childWithName) {
                name = childWithName.getAttribute('data-diagram-name') || '';
            }
        }

        if (!name) name = 'diagram';
        diagrams.push({ type: 'gliffy', name });
    });

    return diagrams;
}
