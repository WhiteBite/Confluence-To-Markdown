/** Diagram-related types */

export interface DiagramReference {
    type: 'drawio' | 'gliffy';
    name: string;
}

export interface DiagramConversionOptions {
    pageId: string;
    diagramName: string;
    targetFormat: 'mermaid' | 'drawio-xml';
}
