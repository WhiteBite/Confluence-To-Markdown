import { getBaseUrl } from '@/api/confluence';
import { fetchPageAttachments, downloadAttachment } from '../attachment-handler';
import { convert } from '@whitebite/diagram-converter';
import { DEBUG } from '@/config';

/**
 * Check if mermaid output is empty (just header, no content)
 * Empty diagrams look like: "flowchart TB" or "flowchart LR" with no nodes/edges
 */
function isEmptyMermaidDiagram(mermaidCode: string): boolean {
    const trimmed = mermaidCode.trim();

    // Match empty flowchart patterns: "flowchart TB", "flowchart LR", etc.
    const emptyFlowchartPattern = /^flowchart\s+(TB|BT|LR|RL|TD)\s*$/;
    if (emptyFlowchartPattern.test(trimmed)) {
        return true;
    }

    // Check if there are any node definitions or edges
    // Valid mermaid should have at least one node (A, B, etc.) or edge (-->)
    const lines = trimmed.split('\n').slice(1); // Skip header line
    const hasContent = lines.some(line => {
        const l = line.trim();
        // Skip empty lines, comments, and subgraph/end keywords
        if (!l || l.startsWith('%%') || l === 'end') return false;
        // Has actual content (node definition or edge)
        return l.length > 0;
    });

    return !hasContent;
}

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

        console.log(`[DiagramConverter] Downloaded XML for ${diagramName}, length: ${xmlText.length}`);
        console.log(`[DiagramConverter] XML first 500 chars:`, xmlText.substring(0, 500));
        console.log(`[DiagramConverter] XML last 200 chars:`, xmlText.substring(xmlText.length - 200));

        // Check if it's compressed (base64 in diagram element)
        const hasCompressedContent = xmlText.includes('<diagram') && !xmlText.includes('<mxGraphModel');
        console.log(`[DiagramConverter] Has compressed content: ${hasCompressedContent}`);

        // Log diagram element content if present
        const diagramMatch = xmlText.match(/<diagram[^>]*>([\s\S]*?)<\/diagram>/);
        if (diagramMatch) {
            const diagramContent = diagramMatch[1].trim();
            console.log(`[DiagramConverter] Diagram element content (first 200):`, diagramContent.substring(0, 200));
            console.log(`[DiagramConverter] Diagram content length:`, diagramContent.length);
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

        console.log(`[DiagramConverter] Conversion result for ${diagramName}:`, {
            hasOutput: !!result.output,
            outputLength: result.output?.length,
            outputPreview: result.output?.substring(0, 100),
            diagramNodes: result.diagram?.nodes?.length,
            diagramEdges: result.diagram?.edges?.length,
        });

        // Check if conversion produced empty diagram
        // Empty mermaid is just "flowchart TB" or "flowchart TB\n" with no nodes/edges
        const output = result.output?.trim();
        if (!output || isEmptyMermaidDiagram(output)) {
            console.warn(`[DiagramConverter] Empty diagram for ${diagramName}, output: "${output}"`);
            return null;
        }

        return result.output;
    } catch (error) {
        if (DEBUG) console.error(`Failed to convert Draw.io to Mermaid:`, error);
        return null;
    }
}
