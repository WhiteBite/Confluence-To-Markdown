/**
 * Regression test: Ensure Confluence UI elements are removed from output
 * Bug: When copying markdown, entire Confluence page UI was included (navigation, menus, footer)
 * Fix: Extract only main content using .wiki-content or #main-content selectors
 */

import { describe, it, expect } from 'vitest';
import { sanitizeHtml, convertToMarkdown } from '../src/core/converter';

// Real HTML from Confluence page with UI elements
const CONFLUENCE_PAGE_WITH_UI = `
<div id="content" class="page view">
  <div id="action-messages"></div>
  <div class="page-metadata">
    <ul>
      <li class="page-metadata-modification-info">Создал(а) <span class="author">Минкин Даниил</span></li>
    </ul>
  </div>
  <div id="main-content" class="wiki-content">
    <p>Actual page content here</p>
    <div class="conf-macro output-block" data-hasbody="false" data-macro-name="drawio">
      <div class="geDiagramContainer">
        <script>readerOpts.diagramName = decodeURIComponent('%31');</script>
      </div>
    </div>
  </div>
  <div id="likes-and-labels-container">
    <div id="likes-section">Like button</div>
    <div id="labels-section">Labels</div>
  </div>
  <div id="comments-section">Comments</div>
</div>
`;

describe('Bug fix: UI cleanup', () => {
    it('should extract only main content, NOT UI elements', () => {
        const sanitized = sanitizeHtml(CONFLUENCE_PAGE_WITH_UI, {
            includeImages: true,
            includeComments: false,
        });

        // Should contain actual content
        expect(sanitized).toContain('Actual page content here');
        expect(sanitized).toContain('data-extracted-diagram-name="1"');

        // Should NOT contain UI elements
        expect(sanitized).not.toContain('page-metadata');
        expect(sanitized).not.toContain('Создал(а)');
        expect(sanitized).not.toContain('Минкин Даниил');
        expect(sanitized).not.toContain('likes-and-labels-container');
        expect(sanitized).not.toContain('Like button');
        expect(sanitized).not.toContain('Labels');
        expect(sanitized).not.toContain('comments-section');
        expect(sanitized).not.toContain('Comments');
    });

    it('should convert to markdown without UI elements', () => {
        const sanitized = sanitizeHtml(CONFLUENCE_PAGE_WITH_UI, {
            includeImages: true,
            includeComments: false,
        });

        const markdown = convertToMarkdown(sanitized);

        // Should contain actual content
        expect(markdown).toContain('Actual page content here');
        expect(markdown).toMatch(/!\[\[1\.png\]\]/);

        // Should NOT contain UI text
        expect(markdown).not.toContain('Создал');
        expect(markdown).not.toContain('Минкин');
        expect(markdown).not.toContain('Like button');
        expect(markdown).not.toContain('Labels');
        expect(markdown).not.toContain('Comments');
    });

    it('should handle page without main-content wrapper', () => {
        const htmlWithoutWrapper = `
      <div id="header">Navigation</div>
      <div class="wiki-content">
        <p>Content without wrapper</p>
      </div>
      <div id="footer">Footer</div>
    `;

        const sanitized = sanitizeHtml(htmlWithoutWrapper, {
            includeImages: true,
            includeComments: false,
        });

        const markdown = convertToMarkdown(sanitized);

        // Should contain content
        expect(markdown).toContain('Content without wrapper');

        // Should NOT contain UI
        expect(markdown).not.toContain('Navigation');
        expect(markdown).not.toContain('Footer');
    });
});
