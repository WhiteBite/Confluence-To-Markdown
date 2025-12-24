/** Diagram-related types */

export interface DiagramReference {
    type: 'drawio' | 'gliffy';
    name: string;
    /** Direct URL to PNG preview (from Confluence attachment) */
    imageUrl?: string;
}

export interface DiagramConversionOptions {
    pageId: string;
    diagramName: string;
    targetFormat: 'mermaid' | 'drawio-xml';
}
