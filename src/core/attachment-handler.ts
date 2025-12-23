import { getBaseUrl } from '@/api/confluence';
import { fetchJson, fetchBlob } from '@/utils/fetch-helper';
import { DEBUG } from '@/config';
import type { AttachmentInfo, DiagramAttachment, ExportedAttachment, ExportedDiagram } from '@/api/types';

interface ConfluenceAttachmentResponse {
    results: Array<{
        id: string;
        title: string;
        metadata?: {
            mediaType?: string;
        };
        extensions?: {
            fileSize?: number;
            mediaType?: string;
        };
        _links?: {
            download?: string;
        };
    }>;
    _links?: {
        next?: string;
    };
}

/** Fetch all attachments for a page */
export async function fetchPageAttachments(pageId: string): Promise<AttachmentInfo[]> {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/rest/api/content/${pageId}/child/attachment?expand=metadata,extensions`;

    try {
        const response = await fetchJson<ConfluenceAttachmentResponse>(url);
        return (response.results || []).map((att) => ({
            id: att.id,
            title: att.title,
            filename: att.title,
            mediaType: att.extensions?.mediaType || att.metadata?.mediaType || 'application/octet-stream',
            fileSize: att.extensions?.fileSize || 0,
            downloadUrl: att._links?.download ? `${baseUrl}${att._links.download}` : '',
            pageId,
        }));
    } catch (error) {
        if (DEBUG) console.error(`Error fetching attachments for page ${pageId}:`, error);
        return [];
    }
}

/** Identify if attachment is a diagram and its type */
export function identifyDiagram(attachment: AttachmentInfo): DiagramAttachment | null {
    const { filename, mediaType } = attachment;
    const baseUrl = getBaseUrl();

    // Draw.io detection
    if (
        mediaType === 'application/vnd.jgraph.mxfile' ||
        filename.endsWith('.drawio') ||
        filename.endsWith('.drawio.xml')
    ) {
        const diagramName = filename.replace(/\.(drawio|drawio\.xml)$/, '');
        return {
            ...attachment,
            diagramType: 'drawio',
            diagramName,
            renderUrl: `${baseUrl}/plugins/servlet/drawio/export?pageId=${attachment.pageId}&diagramName=${encodeURIComponent(diagramName)}&format=png`,
        };
    }

    // Gliffy detection
    if (
        mediaType === 'application/gliffy+json' ||
        filename.endsWith('.gliffy')
    ) {
        const diagramName = filename.replace(/\.gliffy$/, '');
        return {
            ...attachment,
            diagramType: 'gliffy',
            diagramName,
            renderUrl: `${baseUrl}/plugins/servlet/gliffy/export?pageId=${attachment.pageId}&diagramName=${encodeURIComponent(diagramName)}&format=png`,
        };
    }

    return null;
}

/** Check if attachment is an image */
export function isImageAttachment(attachment: AttachmentInfo): boolean {
    const imageTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp'];
    return imageTypes.includes(attachment.mediaType) || /\.(png|jpe?g|gif|svg|webp)$/i.test(attachment.filename);
}

/** Download attachment as Blob */
export async function downloadAttachment(url: string): Promise<Blob> {
    return fetchBlob(url);
}

/** Download diagram with source and preview */
export async function exportDiagram(
    diagram: DiagramAttachment,
    options: { includeSource: boolean; includePreview: boolean; scale: number }
): Promise<ExportedDiagram> {
    const result: ExportedDiagram = {
        name: diagram.diagramName,
        pageId: diagram.pageId,
        source: null,
        preview: null,
        type: diagram.diagramType as 'drawio' | 'gliffy',
    };

    try {
        // Download source file
        if (options.includeSource && diagram.downloadUrl) {
            result.source = await downloadAttachment(diagram.downloadUrl);
        }

        // Download PNG preview
        if (options.includePreview && diagram.renderUrl) {
            const renderUrl = diagram.renderUrl + `&scale=${options.scale}`;
            result.preview = await downloadAttachment(renderUrl);
        }
    } catch (error) {
        if (DEBUG) console.error(`Error exporting diagram ${diagram.diagramName}:`, error);
    }

    return result;
}

/** Download image attachment */
export async function exportImageAttachment(attachment: AttachmentInfo): Promise<ExportedAttachment | null> {
    if (!attachment.downloadUrl) return null;

    try {
        const blob = await downloadAttachment(attachment.downloadUrl);
        return {
            filename: attachment.filename,
            pageId: attachment.pageId,
            blob,
            type: 'image',
        };
    } catch (error) {
        if (DEBUG) console.error(`Error downloading image ${attachment.filename}:`, error);
        return null;
    }
}

/** Extract image URLs from HTML content */
export function extractImageUrls(html: string): string[] {
    const urls: string[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    doc.querySelectorAll('img').forEach((img) => {
        const src = img.src || img.getAttribute('data-src') || '';
        if (src && (src.includes('/download/attachments/') || src.includes('/rest/api/content/'))) {
            urls.push(src);
        }
    });

    return urls;
}

// Re-export diagram functions for backward compatibility
export { extractDiagramReferences, convertDrawioToMermaid } from './diagrams';
