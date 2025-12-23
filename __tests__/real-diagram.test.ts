/**
 * Test with real Confluence HTML from user's page
 */

import { describe, it, expect } from 'vitest';
import { sanitizeHtml, convertToMarkdown } from '../src/core/converter';

const REAL_DRAWIO_HTML = `
<div class="conf-macro output-block" data-hasbody="false" data-macro-name="drawio" style="display:block;">
  <div id="drawio-macro-content-634f9eba-fa40-4425-b970-9eb31678af5e" class="geDiagramContainer">
    <svg>...</svg>
    <script type="text/javascript">//<![CDATA[
      readerOpts.diagramName = decodeURIComponent('%D0%90%D1%80%D1%85%D0%B8%D1%82%D0%B5%D0%BA%D1%82%D1%83%D1%80%D0%B0%20%D0%B2%20%D1%86%D0%B5%D0%BB%D0%BE%D0%BC%20%D1%81%D1%85%D0%B5%D0%BC%D0%B0%20%D0%B8%20%D1%80%D0%BE%D0%BB%D0%B8%20%D0%BA%D0%BE%D0%BC%D0%BF%D0%BE%D0%BD%D0%B5%D0%BD%D1%82%D0%BE%D0%B2');
    //]]></script>
  </div>
</div>
`;

const NUMERIC_NAME_HTML = `
<div class="conf-macro output-block" data-hasbody="false" data-macro-name="drawio" style="display:block;">
  <div id="drawio-macro-content-6ba95dff-04d7-43e1-8899-434ffbb3d3d3" class="geDiagramContainer">
    <svg>...</svg>
    <script type="text/javascript">//<![CDATA[
      readerOpts.diagramName = decodeURIComponent('%31');
    //]]></script>
  </div>
</div>
`;

describe('Real Confluence diagram extraction', () => {
  it('should extract Russian diagram name from real HTML', () => {
    const sanitized = sanitizeHtml(REAL_DRAWIO_HTML, {
      includeImages: true,
      includeComments: false,
    });

    // Check that name was extracted and preserved
    expect(sanitized).toContain('data-extracted-diagram-name');
    expect(sanitized).toContain('Архитектура в целом схема и роли компонентов');

    const markdown = convertToMarkdown(sanitized);

    // Should contain the diagram reference with correct name
    expect(markdown).toContain('Архитектура в целом схема и роли компонентов');
    expect(markdown).toMatch(/!\[\[Архитектура в целом схема и роли компонентов\.png\]\]/);
  });

  it('should extract numeric diagram name (1, 2, 3, 4)', () => {
    const sanitized = sanitizeHtml(NUMERIC_NAME_HTML, {
      includeImages: true,
      includeComments: false,
    });

    // Check that name "1" was extracted
    expect(sanitized).toContain('data-extracted-diagram-name="1"');

    const markdown = convertToMarkdown(sanitized);

    // Should contain the diagram reference with name "1"
    expect(markdown).toContain('1.png');
    expect(markdown).toMatch(/!\[\[1\.png\]\]/);
  });
});
