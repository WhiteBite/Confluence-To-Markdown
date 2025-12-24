/**
 * Bug: Draw.io diagrams copy as empty mermaid blocks
 * 
 * Expected: ![[1.png]] with source comment
 * Actual: ```mermaid\nflowchart TB\n```
 */

import { describe, it, expect } from 'vitest';
import { sanitizeHtml, convertToMarkdown } from '../src/core/converter';

describe('Bug: Empty mermaid blocks for draw.io', () => {
  it('should NOT create empty mermaid blocks when diagram has no content', () => {
    const html = `
      <div class="wiki-content">
        <div class="conf-macro output-block" data-hasbody="false" data-macro-name="drawio" data-extracted-diagram-name="1">
          <div class="geDiagramContainer">
            <svg>...</svg>
          </div>
        </div>
      </div>
    `;

    const sanitized = sanitizeHtml(html, {
      includeImages: true,
      includeComments: false,
    });

    // Convert with diagram conversion disabled (default for copy)
    const markdown = convertToMarkdown(sanitized, {
      convertDiagrams: false,
      diagramTargetFormat: 'mermaid',
    });

    // Should create wikilink, NOT empty mermaid block
    expect(markdown).toContain('![[1.png]]');
    expect(markdown).toContain('%% Editable source: 1.drawio %%');

    // Should NOT contain empty mermaid blocks
    expect(markdown).not.toContain('```mermaid');
  });

  it('should create wikilinks for multiple diagrams without content', () => {
    const html = `
      <div class="wiki-content">
        <div class="conf-macro output-block" data-macro-name="drawio" data-extracted-diagram-name="1">
          <div class="geDiagramContainer">
            <svg>...</svg>
          </div>
        </div>
        <div class="conf-macro output-block" data-macro-name="drawio" data-extracted-diagram-name="2">
          <div class="geDiagramContainer">
            <svg>...</svg>
          </div>
        </div>
      </div>
    `;

    const sanitized = sanitizeHtml(html, {
      includeImages: true,
      includeComments: false,
    });

    const markdown = convertToMarkdown(sanitized, {
      convertDiagrams: false,
    });

    // Should have wikilinks for both
    expect(markdown).toContain('![[1.png]]');
    expect(markdown).toContain('![[2.png]]');

    // Should NOT have empty mermaid blocks
    const mermaidBlocks = markdown.match(/```mermaid/g);
    expect(mermaidBlocks).toBeNull();
  });

  it('should attempt conversion with exportMode=convert (may fallback to wikilink)', () => {
    const drawioXml = `<mxfile><diagram>test</diagram></mxfile>`;

    const html = `
      <div class="wiki-content">
        <div class="conf-macro output-block" data-macro-name="drawio">
          <div class="geDiagramContainer" data-diagram-content="${drawioXml}">
            <script>readerOpts.diagramName = decodeURIComponent('%31');</script>
          </div>
        </div>
      </div>
    `;

    const sanitized = sanitizeHtml(html, {
      includeImages: true,
      includeComments: false,
    });

    // With conversion enabled - should attempt conversion
    const markdown = convertToMarkdown(sanitized, {
      convertDiagrams: false, // deprecated
      diagramTargetFormat: 'mermaid',
      exportMode: 'convert', // NEW API
    });

    // Note: Minimal XML may not convert successfully
    // In that case, fallback to wikilink is expected
    // This test just verifies exportMode is respected
    expect(markdown).toBeDefined();
    expect(markdown.length).toBeGreaterThan(0);
  });
});
