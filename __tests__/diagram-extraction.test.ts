/**
 * Tests for diagram extraction from Confluence HTML
 * Based on real examples from confluence-to-markdown/example/
 */

import { describe, it, expect } from 'vitest';
import { extractDiagramReferences } from '../src/core/attachment-handler';
import { sanitizeHtml, convertToMarkdown, extractDiagramInfoFromHtml } from '../src/core/converter';

// Real HTML snippets from Confluence pages
const DRAWIO_MACRO_HTML = `
<div class="conf-macro output-block" data-hasbody="false" data-macro-name="drawio" style="display:block;">
  <div id="drawio-macro-content-6ba95dff-04d7-43e1-8899-434ffbb3d3d3" class="geDiagramContainer">
    <svg>...</svg>
    <script type="text/javascript">//<![CDATA[
      readerOpts.diagramName = decodeURIComponent('%61%72%63%68%69%74%65%63%74%75%72%65%2D%64%69%61%67%72%61%6D');
    //]]></script>
  </div>
</div>
`;

const DRAWIO_SKETCH_HTML = `
<div class="conf-macro output-block" data-hasbody="false" data-macro-name="drawio-sketch" style="display:block;">
  <div id="drawio-macro-content-a7458cd7-d923-4a3d-a71e-f8b92b5d1d44" class="geDiagramContainer">
    <svg>...</svg>
    <script type="text/javascript">//<![CDATA[
      readerOpts.diagramName = decodeURIComponent('%73%6B%65%74%63%68%2D%64%69%61%67%72%61%6D');
    //]]></script>
  </div>
</div>
`;

// New format from Confluence Server/DC with loadUrl and imageUrl
const DRAWIO_LOADURL_FORMAT_HTML = `
<div class="conf-macro output-block" data-hasbody="false" data-macro-name="drawio" style="display:block;">
  <div id="drawio-macro-content-6ba95dff-04d7-43e1-8899-434ffbb3d3d3" class="geDiagramContainer">
    <svg>...</svg>
    <script type="text/javascript">//<![CDATA[
      (function() {
        var readerOpts = {};
        readerOpts.loadUrl = '' + '/rest/drawio/1.0/diagram/crud/%31/130520250?revision=1';
        readerOpts.imageUrl = '' + '/download/attachments/130520250/1.png' + '?version=1&api=v2';
        readerOpts.diagramName = decodeURIComponent('%31');
      })();
    //]]></script>
  </div>
</div>
`;

const PLANTUML_MACRO_HTML = `
<div class="conf-macro output-block" data-hasbody="true" data-macro-name="plantuml">
  <pre>@startuml
Bob -> Alice : hello
@enduml</pre>
</div>
`;

const GLIFFY_MACRO_HTML = `
<div class="conf-macro output-block" data-hasbody="false" data-macro-name="gliffy">
  <div class="gliffy-content" data-diagram-name="architecture-diagram">
    <img src="/gliffy/preview.png" />
  </div>
</div>
`;

const MULTIPLE_DIAGRAMS_HTML = `
<div class="wiki-content">
  <h1>Architecture</h1>
  <div class="conf-macro output-block" data-hasbody="false" data-macro-name="drawio">
    <div class="geDiagramContainer">
      <script>readerOpts.diagramName = decodeURIComponent('%64%69%61%67%72%61%6D%2D%31');</script>
    </div>
  </div>
  <h2>Sequence</h2>
  <div class="conf-macro output-block" data-hasbody="false" data-macro-name="drawio">
    <div class="geDiagramContainer">
      <script>readerOpts.diagramName = decodeURIComponent('%64%69%61%67%72%61%6D%2D%32');</script>
    </div>
  </div>
  <h2>PlantUML</h2>
  <div class="conf-macro output-block" data-hasbody="true" data-macro-name="plantuml">
    <pre>@startuml
class User
@enduml</pre>
  </div>
</div>
`;

describe('extractDiagramReferences', () => {
  describe('Draw.io diagrams', () => {
    it('should extract draw.io diagram with encoded name from script', () => {
      const diagrams = extractDiagramReferences(DRAWIO_MACRO_HTML);

      expect(diagrams).toHaveLength(1);
      expect(diagrams[0].type).toBe('drawio');
      expect(diagrams[0].name).toBe('architecture-diagram');
    });

    it('should extract draw.io sketch diagram', () => {
      const diagrams = extractDiagramReferences(DRAWIO_SKETCH_HTML);

      expect(diagrams).toHaveLength(1);
      expect(diagrams[0].type).toBe('drawio');
      expect(diagrams[0].name).toBe('sketch-diagram');
    });

    it('should fallback to "diagram" if name not found', () => {
      const html = `<div class="conf-macro output-block" data-macro-name="drawio"></div>`;
      const diagrams = extractDiagramReferences(html);

      expect(diagrams).toHaveLength(1);
      expect(diagrams[0].name).toBe('diagram');
    });

    it('should extract diagram name from loadUrl format', () => {
      const diagrams = extractDiagramReferences(DRAWIO_LOADURL_FORMAT_HTML);

      expect(diagrams).toHaveLength(1);
      expect(diagrams[0].type).toBe('drawio');
      expect(diagrams[0].name).toBe('1'); // %31 decoded = '1'
      expect(diagrams[0].imageUrl).toBe('/download/attachments/130520250/1.png');
    });
  });

  describe('Gliffy diagrams', () => {
    it('should extract gliffy diagram with data-diagram-name', () => {
      const diagrams = extractDiagramReferences(GLIFFY_MACRO_HTML);

      expect(diagrams).toHaveLength(1);
      expect(diagrams[0].type).toBe('gliffy');
      expect(diagrams[0].name).toBe('architecture-diagram');
    });
  });

  describe('Multiple diagrams', () => {
    it('should extract all diagrams from page', () => {
      const diagrams = extractDiagramReferences(MULTIPLE_DIAGRAMS_HTML);

      expect(diagrams).toHaveLength(2); // Only drawio, not plantuml
      expect(diagrams[0].type).toBe('drawio');
      expect(diagrams[0].name).toBe('diagram-1');
      expect(diagrams[1].type).toBe('drawio');
      expect(diagrams[1].name).toBe('diagram-2');
    });
  });

  describe('Edge cases', () => {
    it('should return empty array for HTML without diagrams', () => {
      const html = '<div><p>Just text</p></div>';
      const diagrams = extractDiagramReferences(html);

      expect(diagrams).toHaveLength(0);
    });

    it('should handle empty HTML', () => {
      const diagrams = extractDiagramReferences('');

      expect(diagrams).toHaveLength(0);
    });

    it('should handle malformed HTML gracefully', () => {
      const html = '<div data-macro-name="drawio"><script>broken';
      const diagrams = extractDiagramReferences(html);

      // Should not throw, may or may not find diagram
      expect(Array.isArray(diagrams)).toBe(true);
    });
  });
});


describe('extractDiagramInfoFromHtml', () => {
  it('should extract diagram info before sanitization', () => {
    const diagrams = extractDiagramInfoFromHtml(DRAWIO_MACRO_HTML);

    expect(diagrams).toHaveLength(1);
    expect(diagrams[0].name).toBe('architecture-diagram');
    expect(diagrams[0].type).toBe('drawio');
  });

  it('should extract multiple diagrams with correct indices', () => {
    const diagrams = extractDiagramInfoFromHtml(MULTIPLE_DIAGRAMS_HTML);

    expect(diagrams).toHaveLength(2);
    expect(diagrams[0].index).toBe(0);
    expect(diagrams[0].name).toBe('diagram-1');
    expect(diagrams[1].index).toBe(1);
    expect(diagrams[1].name).toBe('diagram-2');
  });
});

describe('sanitizeHtml preserves diagram names', () => {
  it('should preserve diagram name in data attribute after removing scripts', () => {
    const sanitized = sanitizeHtml(DRAWIO_MACRO_HTML, {
      includeImages: true,
      includeComments: false,
    });

    // Script should be removed
    expect(sanitized).not.toContain('<script');
    expect(sanitized).not.toContain('readerOpts');

    // But diagram name should be preserved in data attribute
    expect(sanitized).toContain('data-extracted-diagram-name="architecture-diagram"');
  });

  it('should preserve multiple diagram names', () => {
    const sanitized = sanitizeHtml(MULTIPLE_DIAGRAMS_HTML, {
      includeImages: true,
      includeComments: false,
    });

    expect(sanitized).toContain('data-extracted-diagram-name="diagram-1"');
    expect(sanitized).toContain('data-extracted-diagram-name="diagram-2"');
  });
});

describe('convertToMarkdown with diagrams', () => {
  it('should convert draw.io diagram to markdown with correct name', () => {
    // First sanitize (which preserves diagram names)
    const sanitized = sanitizeHtml(DRAWIO_MACRO_HTML, {
      includeImages: true,
      includeComments: false,
    });

    // Then convert to markdown
    const markdown = convertToMarkdown(sanitized);

    // Should contain the diagram reference with correct name
    expect(markdown).toContain('architecture-diagram');
    expect(markdown).toMatch(/!\[\[architecture-diagram\.png\]\]/);
  });

  it('should convert multiple diagrams with correct names', () => {
    const sanitized = sanitizeHtml(MULTIPLE_DIAGRAMS_HTML, {
      includeImages: true,
      includeComments: false,
    });

    const markdown = convertToMarkdown(sanitized);

    // Check that diagrams are present with correct names
    expect(markdown).toContain('diagram-1');
    expect(markdown).toContain('diagram-2');
    expect(markdown).toMatch(/!\[\[diagram-1\.png\]\]/);
    expect(markdown).toMatch(/!\[\[diagram-2\.png\]\]/);
  });
});
