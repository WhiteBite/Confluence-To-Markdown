/**
 * Tests for sanitizer.ts and diagram-processor.ts
 */

import { describe, it, expect } from 'vitest';
import { sanitizeHtml, extractDiagramInfoFromHtml } from '../src/core/sanitizer';
import { detectDiagramFormat, getFileExtension } from '../src/core/diagram-processor';

const defaultOpts = { includeImages: true, includeComments: true };

// ---------------------------------------------------------------------------
// sanitizeHtml
// ---------------------------------------------------------------------------

describe('sanitizeHtml', () => {
    it('preserves data-extracted-diagram-name extracted from script inside drawio macro', () => {
        const html = `
            <div class="wiki-content">
                <div data-macro-name="drawio" class="conf-macro">
                    <script>
                        var readerOpts = {};
                        readerOpts.diagramName = decodeURIComponent('My%20Diagram');
                    </script>
                </div>
            </div>`;
        const result = sanitizeHtml(html, defaultOpts);
        expect(result).toContain('data-extracted-diagram-name="My Diagram"');
    });

    it('removes <img> tags when includeImages is false', () => {
        const html = `
            <div class="wiki-content">
                <p>Hello</p>
                <img src="image.png" alt="test"/>
            </div>`;
        const result = sanitizeHtml(html, { ...defaultOpts, includeImages: false });
        expect(result).not.toContain('<img');
    });

    it('preserves .comment-thread when includeComments is true', () => {
        const html = `
            <div class="wiki-content">
                <p>Content</p>
                <div class="comment-thread">A comment</div>
            </div>`;
        const result = sanitizeHtml(html, { ...defaultOpts, includeComments: true });
        expect(result).toContain('comment-thread');
    });

    it('removes .comment-thread when includeComments is false', () => {
        const html = `
            <div class="wiki-content">
                <p>Content</p>
                <div class="comment-thread">A comment</div>
            </div>`;
        const result = sanitizeHtml(html, { ...defaultOpts, includeComments: false });
        expect(result).not.toContain('comment-thread');
    });

    it('returns empty string for empty input', () => {
        expect(sanitizeHtml('', defaultOpts)).toBe('');
    });
});

// ---------------------------------------------------------------------------
// extractDiagramInfoFromHtml
// ---------------------------------------------------------------------------

describe('extractDiagramInfoFromHtml', () => {
    it('returns DiagramInfo with correct name from data-diagram-name attribute', () => {
        const html = `
            <div class="wiki-content">
                <div data-macro-name="drawio" data-diagram-name="Architecture" class="conf-macro"></div>
            </div>`;
        const diagrams = extractDiagramInfoFromHtml(html);
        expect(diagrams).toHaveLength(1);
        expect(diagrams[0].name).toBe('Architecture');
        expect(diagrams[0].type).toBe('drawio');
        expect(diagrams[0].index).toBe(0);
    });

    it('returns generic diagram-1 when no name is set', () => {
        const html = `
            <div class="wiki-content">
                <div data-macro-name="drawio" class="conf-macro"></div>
            </div>`;
        const diagrams = extractDiagramInfoFromHtml(html);
        expect(diagrams).toHaveLength(1);
        expect(diagrams[0].name).toBe('diagram-1');
    });
});

// ---------------------------------------------------------------------------
// detectDiagramFormat
// ---------------------------------------------------------------------------

describe('detectDiagramFormat', () => {
    it('detects drawio XML by <mxfile> tag', () => {
        expect(detectDiagramFormat('<mxfile host="Electron"><diagram>...</diagram></mxfile>')).toBe('drawio');
    });

    it('detects Mermaid by "graph TD" directive', () => {
        expect(detectDiagramFormat('graph TD\n  A --> B')).toBe('mermaid');
    });

    it('detects PlantUML by @startuml directive', () => {
        expect(detectDiagramFormat('@startuml\nactor User\n@enduml')).toBe('plantuml');
    });

    it('detects Gliffy JSON by "stage": key without full JSON.parse', () => {
        expect(detectDiagramFormat('{"stage": {"objects": []}, "version": 1}')).toBe('gliffy');
    });

    it('returns unknown for arbitrary plain text', () => {
        expect(detectDiagramFormat('Hello, world!')).toBe('unknown');
    });
});

// ---------------------------------------------------------------------------
// getFileExtension
// ---------------------------------------------------------------------------

describe('getFileExtension', () => {
    it('returns "mmd" for mermaid (regression test: was incorrectly "md")', () => {
        expect(getFileExtension('mermaid')).toBe('mmd');
    });

    it('returns "drawio" for drawio format', () => {
        expect(getFileExtension('drawio')).toBe('drawio');
    });
});
