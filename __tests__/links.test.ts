/**
 * Test: Links are preserved in markdown output
 */

import { describe, it, expect } from 'vitest';
import { sanitizeHtml, convertToMarkdown } from '../src/core/converter';

describe('Links preservation', () => {
    it('should preserve internal Confluence links', () => {
        const html = `
      <div class="wiki-content">
        <p>See <a href="/pages/viewpage.action?pageId=12345">related page</a> for details.</p>
      </div>
    `;

        const sanitized = sanitizeHtml(html, {
            includeImages: true,
            includeComments: false,
        });

        const markdown = convertToMarkdown(sanitized);

        expect(markdown).toContain('[related page]');
        expect(markdown).toContain('/pages/viewpage.action?pageId=12345');
    });

    it('should preserve external links', () => {
        const html = `
      <div class="wiki-content">
        <p>Check <a href="https://example.com/docs">documentation</a> here.</p>
      </div>
    `;

        const sanitized = sanitizeHtml(html, {
            includeImages: true,
            includeComments: false,
        });

        const markdown = convertToMarkdown(sanitized);

        expect(markdown).toContain('[documentation]');
        expect(markdown).toContain('https://example.com/docs');
    });

    it('should preserve multiple links in paragraph', () => {
        const html = `
      <div class="wiki-content">
        <p>
          Read <a href="/page1">first article</a> and 
          <a href="/page2">second article</a> for more info.
        </p>
      </div>
    `;

        const sanitized = sanitizeHtml(html, {
            includeImages: true,
            includeComments: false,
        });

        const markdown = convertToMarkdown(sanitized);

        expect(markdown).toContain('[first article]');
        expect(markdown).toContain('/page1');
        expect(markdown).toContain('[second article]');
        expect(markdown).toContain('/page2');
    });

    it('should preserve anchor links', () => {
        const html = `
      <div class="wiki-content">
        <p>Jump to <a href="#section-1">Section 1</a></p>
      </div>
    `;

        const sanitized = sanitizeHtml(html, {
            includeImages: true,
            includeComments: false,
        });

        const markdown = convertToMarkdown(sanitized);

        expect(markdown).toContain('[Section 1]');
        expect(markdown).toContain('#section-1');
    });

    it('should handle links with special characters', () => {
        const html = `
      <div class="wiki-content">
        <p>See <a href="/pages/Архитектура%20системы">Architecture</a></p>
      </div>
    `;

        const sanitized = sanitizeHtml(html, {
            includeImages: true,
            includeComments: false,
        });

        const markdown = convertToMarkdown(sanitized);

        expect(markdown).toContain('[Architecture]');
        expect(markdown).toContain('Архитектура%20системы');
    });
});
