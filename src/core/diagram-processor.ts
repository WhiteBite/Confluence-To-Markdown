/**
 * Diagram processing using @whitebite/diagram-converter
 */

import { convert, parseDrawio } from '@whitebite/diagram-converter';
import type { Diagram, ConvertResult } from '@whitebite/diagram-converter';
import { DEBUG } from '@/config';

export type DiagramFormat = 'drawio' | 'mermaid' | 'plantuml' | 'gliffy' | 'unknown';
export type TargetFormat = 'mermaid' | 'drawio' | 'excalidraw' | 'original';

export interface DiagramInfo {
    format: DiagramFormat;
    name: string;
    content: string;
    sourceElement?: Element;
}

export interface ProcessedDiagram {
    name: string;
    originalFormat: DiagramFormat;
    targetFormat: TargetFormat;
    /** Converted code (Mermaid, etc.) */
    code?: string;
    /** Original/converted file content */
    fileContent?: string;
    /** File extension for saving */
    fileExtension?: string;
    /** PNG preview blob */
    preview?: Blob;
    /** Conversion warnings */
    warnings?: string[];
    /** Error if conversion failed */
    error?: string;
}

export interface DiagramProcessorOptions {
    targetFormat: TargetFormat;
    embedAsCodeBlocks: boolean;
    keepOriginalOnError: boolean;
    includePngFallback: boolean;
}

const DEFAULT_OPTIONS: DiagramProcessorOptions = {
    targetFormat: 'mermaid',
    embedAsCodeBlocks: true,
    keepOriginalOnError: true,
    includePngFallback: true,
};

/**
 * Detect diagram format from content
 */
export function detectDiagramFormat(content: string): DiagramFormat {
    const trimmed = content.trim();

    // Draw.io XML
    if (trimmed.includes('<mxfile') || trimmed.includes('<mxGraphModel')) {
        return 'drawio';
    }

    // Mermaid
    if (/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|journey)/m.test(trimmed)) {
        return 'mermaid';
    }

    // PlantUML
    if (trimmed.startsWith('@startuml') || trimmed.includes('@startuml')) {
        return 'plantuml';
    }

    // Gliffy JSON
    if (trimmed.startsWith('{') && trimmed.includes('"stage"')) {
        try {
            const parsed = JSON.parse(trimmed);
            if (parsed.stage || parsed.contentType?.includes('gliffy')) {
                return 'gliffy';
            }
        } catch {
            // Not valid JSON
        }
    }

    return 'unknown';
}

/**
 * Extract diagram info from Confluence macro HTML element
 */
export function extractDiagramFromMacro(element: Element): DiagramInfo | null {
    const macroName = element.getAttribute('data-macro-name') || '';
    const classList = element.classList;

    // Draw.io
    if (macroName === 'drawio' || classList.contains('drawio-macro') || classList.contains('drawio-diagram')) {
        const name = element.getAttribute('data-diagram-name') ||
            (element as HTMLElement).dataset?.diagramName ||
            'diagram';

        // Try to get embedded content
        const content = element.getAttribute('data-diagram-content') ||
            element.querySelector('[data-diagram-content]')?.getAttribute('data-diagram-content') ||
            '';

        return {
            format: 'drawio',
            name,
            content,
            sourceElement: element,
        };
    }

    // Gliffy
    if (macroName === 'gliffy' || classList.contains('gliffy-macro') || classList.contains('gliffy-diagram')) {
        const name = element.getAttribute('data-diagram-name') ||
            (element as HTMLElement).dataset?.diagramName ||
            'diagram';

        return {
            format: 'gliffy',
            name,
            content: '',
            sourceElement: element,
        };
    }

    // PlantUML
    if (macroName === 'plantuml' || classList.contains('plantuml-macro')) {
        const content = element.textContent || '';
        return {
            format: 'plantuml',
            name: 'plantuml-diagram',
            content,
            sourceElement: element,
        };
    }

    // Mermaid (some Confluence plugins)
    if (macroName === 'mermaid' || classList.contains('mermaid-macro')) {
        const content = element.textContent || '';
        return {
            format: 'mermaid',
            name: 'mermaid-diagram',
            content,
            sourceElement: element,
        };
    }

    return null;
}

/**
 * Convert diagram to target format using wb-diagram-converter
 */
export function convertDiagram(
    content: string,
    fromFormat: DiagramFormat,
    toFormat: TargetFormat,
): ConvertResult | null {
    if (fromFormat === 'unknown' || fromFormat === 'gliffy') {
        // Gliffy not supported yet by converter
        return null;
    }

    if (toFormat === 'original') {
        return null; // Keep original, no conversion needed
    }

    // Map formats
    const inputFormat = fromFormat as 'drawio' | 'mermaid' | 'plantuml';
    const outputFormat = toFormat as 'mermaid' | 'drawio' | 'excalidraw';

    try {
        return convert(content, {
            from: inputFormat,
            to: outputFormat,
            layout: {
                algorithm: 'dagre',
                direction: 'TB',
            },
        });
    } catch (error) {
        if (DEBUG) console.error(`Diagram conversion failed:`, error);
        return null;
    }
}

/**
 * Process a diagram with full conversion pipeline
 */
export function processDiagram(
    info: DiagramInfo,
    options: Partial<DiagramProcessorOptions> = {}
): ProcessedDiagram {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const result: ProcessedDiagram = {
        name: info.name,
        originalFormat: info.format,
        targetFormat: opts.targetFormat,
    };

    // If keeping original or format is unknown
    if (opts.targetFormat === 'original' || info.format === 'unknown') {
        result.fileContent = info.content;
        result.fileExtension = getFileExtension(info.format);
        return result;
    }

    // Try conversion
    if (info.content) {
        const converted = convertDiagram(info.content, info.format, opts.targetFormat);

        if (converted) {
            result.code = converted.output;
            result.warnings = converted.warnings;

            if (opts.targetFormat === 'mermaid' && opts.embedAsCodeBlocks) {
                // Will be embedded as code block in markdown
                result.code = converted.output;
            } else {
                // Save as file
                result.fileContent = converted.output;
                result.fileExtension = getFileExtension(opts.targetFormat);
            }
        } else if (opts.keepOriginalOnError) {
            // Conversion failed, keep original
            result.fileContent = info.content;
            result.fileExtension = getFileExtension(info.format);
            result.error = 'Conversion failed, keeping original format';
        } else {
            result.error = 'Conversion failed';
        }
    } else {
        // No content available (need to download from attachment)
        result.error = 'No diagram content available';
    }

    return result;
}

/**
 * Generate Mermaid code block for markdown embedding
 */
export function generateMermaidCodeBlock(code: string, title?: string): string {
    const header = title ? `%% ${title}\n` : '';
    return `\`\`\`mermaid\n${header}${code.trim()}\n\`\`\``;
}

/**
 * Generate diagram reference for markdown
 */
export function generateDiagramReference(
    diagram: ProcessedDiagram,
    attachmentPath: string
): string {
    if (diagram.code && diagram.targetFormat === 'mermaid') {
        return generateMermaidCodeBlock(diagram.code, diagram.name);
    }

    // File reference
    const ext = diagram.fileExtension || 'png';
    const filename = `${diagram.name}.${ext}`;
    return `![[${attachmentPath}/${filename}]]`;
}

/**
 * Parse Draw.io XML and extract diagram structure
 */
export function parseDrawioDiagram(xmlContent: string): Diagram | null {
    try {
        return parseDrawio(xmlContent);
    } catch (error) {
        if (DEBUG) console.error('Failed to parse Draw.io:', error);
        return null;
    }
}

// ============================================================================
// Helpers
// ============================================================================

function getFileExtension(format: DiagramFormat | TargetFormat): string {
    switch (format) {
        case 'drawio': return 'drawio';
        case 'mermaid': return 'md';
        case 'plantuml': return 'puml';
        case 'excalidraw': return 'excalidraw';
        case 'gliffy': return 'gliffy';
        default: return 'txt';
    }
}
