import { describe, it, expect } from 'vitest';
import { extractDiagramFromMacro } from '../src/core/diagram-processor';

describe('SVG Extraction from Draw.io', () => {
    it('should extract SVG from geDiagramContainer', () => {
        // Simulate DOM structure from Confluence
        const html = `
            <div class="drawio-macro" data-diagram-name="test-diagram">
                <div class="geDiagramContainer">
                    <svg width="100" height="100">
                        <rect x="10" y="10" width="80" height="80" fill="blue"/>
                    </svg>
                </div>
            </div>
        `;

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const element = doc.querySelector('.drawio-macro')!;

        const result = extractDiagramFromMacro(element);

        expect(result).toBeDefined();
        expect(result?.format).toBe('drawio');
        expect(result?.name).toBe('test-diagram');
        expect(result?.renderedSvg).toContain('<svg');
        expect(result?.renderedSvg).toContain('rect');
        expect(result?.renderedSvg).toContain('fill="blue"');
    });

    it('should extract SVG from direct svg child', () => {
        const html = `
            <div class="plantuml-macro">
                <svg viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="50" fill="red"/>
                </svg>
            </div>
        `;

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const element = doc.querySelector('.plantuml-macro')!;

        const result = extractDiagramFromMacro(element);

        expect(result).toBeDefined();
        expect(result?.format).toBe('plantuml');
        expect(result?.renderedSvg).toContain('<svg');
        expect(result?.renderedSvg).toContain('circle');
    });

    it('should return undefined when no SVG found', () => {
        const html = `
            <div class="drawio-macro" data-diagram-name="no-svg">
                <div class="geDiagramContainer">
                    <p>No SVG here</p>
                </div>
            </div>
        `;

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const element = doc.querySelector('.drawio-macro')!;

        const result = extractDiagramFromMacro(element);

        expect(result).toBeDefined();
        expect(result?.renderedSvg).toBeUndefined();
    });
});
