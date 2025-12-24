import { describe, it, expect } from 'vitest';
import { processDiagram, type DiagramInfo } from '../src/core/diagram-processor';

describe('Diagram Export Modes', () => {
    const mockDrawioDiagram: DiagramInfo = {
        format: 'drawio',
        name: 'test-diagram',
        content: '<mxfile><diagram>test</diagram></mxfile>',
        renderedSvg: '<svg><rect x="0" y="0" width="100" height="100"/></svg>',
    };

    describe('Mode: copy-as-is', () => {
        it('should keep original format without conversion', () => {
            const result = processDiagram(mockDrawioDiagram, {
                targetFormat: 'mermaid',
                embedAsCodeBlocks: true,
                keepOriginalOnError: true,
                includePngFallback: true,
                exportMode: 'copy-as-is',
            });

            expect(result.originalFormat).toBe('drawio');
            expect(result.fileContent).toBe(mockDrawioDiagram.content);
            expect(result.fileExtension).toBe('drawio');
            expect(result.code).toBeUndefined();
            expect(result.svgPreview).toBeUndefined();
        });

        it('should work for PlantUML', () => {
            const plantuml: DiagramInfo = {
                format: 'plantuml',
                name: 'sequence',
                content: '@startuml\nAlice -> Bob: Hello\n@enduml',
            };

            const result = processDiagram(plantuml, {
                targetFormat: 'mermaid',
                embedAsCodeBlocks: true,
                keepOriginalOnError: true,
                includePngFallback: false,
                exportMode: 'copy-as-is',
            });

            expect(result.fileContent).toBe(plantuml.content);
            expect(result.fileExtension).toBe('puml');
        });
    });

    describe('Mode: svg-preview', () => {
        it('should include SVG preview when available', () => {
            const result = processDiagram(mockDrawioDiagram, {
                targetFormat: 'mermaid',
                embedAsCodeBlocks: true,
                keepOriginalOnError: true,
                includePngFallback: true,
                exportMode: 'svg-preview',
            });

            expect(result.svgPreview).toBeDefined();
            expect(result.svgPreview).toContain('<svg>');
            expect(result.svgPreview).toContain('<rect');
            expect(result.fileContent).toBe(mockDrawioDiagram.content);
            expect(result.fileExtension).toBe('drawio');
        });

        it('should work without SVG preview', () => {
            const diagramWithoutSvg: DiagramInfo = {
                format: 'drawio',
                name: 'no-svg',
                content: '<mxfile><diagram>test</diagram></mxfile>',
            };

            const result = processDiagram(diagramWithoutSvg, {
                targetFormat: 'mermaid',
                embedAsCodeBlocks: true,
                keepOriginalOnError: true,
                includePngFallback: true,
                exportMode: 'svg-preview',
            });

            expect(result.svgPreview).toBeUndefined();
            expect(result.fileContent).toBe(diagramWithoutSvg.content);
        });
    });

    describe('Mode: convert', () => {
        it('should attempt conversion to target format', () => {
            const result = processDiagram(mockDrawioDiagram, {
                targetFormat: 'mermaid',
                embedAsCodeBlocks: true,
                keepOriginalOnError: true,
                includePngFallback: true,
                exportMode: 'convert',
            });

            // Conversion may succeed or fail, but should attempt it
            expect(result.originalFormat).toBe('drawio');
            expect(result.targetFormat).toBe('mermaid');

            // If conversion succeeded, should have code
            // If failed with keepOriginalOnError, should have fileContent
            expect(result.code || result.fileContent).toBeDefined();
        });

        it('should keep original on conversion failure when keepOriginalOnError is true', () => {
            const invalidDiagram: DiagramInfo = {
                format: 'drawio',
                name: 'invalid',
                content: 'invalid xml content',
            };

            const result = processDiagram(invalidDiagram, {
                targetFormat: 'mermaid',
                embedAsCodeBlocks: true,
                keepOriginalOnError: true,
                includePngFallback: true,
                exportMode: 'convert',
            });

            expect(result.fileContent).toBe(invalidDiagram.content);
            expect(result.error).toBeDefined();
        });
    });

    describe('Default behavior', () => {
        it('should default to copy-as-is when no mode specified', () => {
            const result = processDiagram(mockDrawioDiagram, {
                targetFormat: 'mermaid',
                embedAsCodeBlocks: true,
                keepOriginalOnError: true,
                includePngFallback: true,
                // exportMode not specified
            });

            expect(result.fileContent).toBe(mockDrawioDiagram.content);
            expect(result.fileExtension).toBe('drawio');
        });
    });
});
