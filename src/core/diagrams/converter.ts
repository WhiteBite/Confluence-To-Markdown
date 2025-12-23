import { getBaseUrl } from '@/api/confluence';
import { fetchPageAttachments, downloadAttachment } from '../attachment-handler';
import { convert } from '@whitebite/diagram-converter';
import { DEBUG } from '@/config';

/**
 * Convert Draw.io diagram to Mermaid code
 * Downloads source XML and converts using @whitebite/diagram-converter
 */
export async function convertDrawioToMermaid(
    pageId: string,
    diagramName: string
): Promise<string | null> {
    try {
        const baseUrl = getBaseUrl();

        // Try method 1: Download from attachments
        const attachments = await fetchPageAttachments(pageId);
        const drawioAttachment = attachments.find(
            att => att.filename === `${diagramName}.drawio` ||
                att.filename === `${diagramName}.drawio.xml` ||
                att.filename === diagramName
        );

        let xmlText: string;

        if (drawioAttachment?.downloadUrl) {
            // Download from attachments
            const xmlBlob = await downloadAttachment(drawioAttachment.downloadUrl);
            xmlText = await xmlBlob.text();
        } else {
            // Method 2: Try to get XML via render endpoint
            // Confluence can export diagram as XML via special URL
            const xmlUrl = `${baseUrl}/plugins/servlet/drawio/export?pageId=${pageId}&diagramName=${encodeURIComponent(diagramName)}&format=xml`;

            try {
                const xmlBlob = await downloadAttachment(xmlUrl);
                xmlText = await xmlBlob.text();
            } catch (error) {
                if (DEBUG) console.warn(`Draw.io source not found for: ${diagramName}`, error);
                return null;
            }
        }

        // Convert Draw.io → Mermaid using wb-diagrams
        const result = convert(xmlText, {
            from: 'drawio',
            to: 'mermaid',
            layout: {
                algorithm: 'dagre',
                direction: 'TB',
            },
        });

        return result.output;
    } catch (error) {
        if (DEBUG) console.error(`Failed to convert Draw.io to Mermaid:`, error);
        return null;
    }
}
