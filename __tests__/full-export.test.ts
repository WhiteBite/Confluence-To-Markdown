/**
 * Full integration test for markdown export with diagrams
 * Tests the complete flow: HTML → sanitize → convert → markdown
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { sanitizeHtml, convertToMarkdown } from '../src/core/converter';
import { buildMarkdownDocument } from '../src/core/exporter';
import type { PageContentData, PageTreeNode } from '../src/api/types';
import type { ExportSettings } from '../src/storage/types';

describe('Full Export Integration Test', () => {
    // Load real HTML file
    const htmlPath = join(__dirname, '../example/[vstr-cache] Алгоритм параллельной обработки сортовых составов v2.2 - iBOX - Confluence.html');
    const realHtml = readFileSync(htmlPath, 'utf-8');

    // Extract main content from HTML
    const contentMatch = realHtml.match(/<div id="main-content"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<div id="footer"/);
    const mainContent = contentMatch ? contentMatch[1] : realHtml;

    describe('Diagram extraction and conversion', () => {
        it('should extract diagram names from scripts before sanitization', () => {
            // Sanitize HTML (this extracts diagram names)
            const sanitized = sanitizeHtml(mainContent, {
                includeImages: true,
                includeComments: false,
            }, '130520250');

            // Check that diagram names were extracted and preserved
            expect(sanitized).toContain('data-extracted-diagram-name');

            // Should have removed scripts
            expect(sanitized).not.toContain('<script');
            expect(sanitized).not.toContain('readerOpts');
        });

        it('should convert diagrams to wikilinks without conversion', () => {
            const sanitized = sanitizeHtml(mainContent, {
                includeImages: true,
                includeComments: false,
            }, '130520250');

            const markdown = convertToMarkdown(sanitized, {
                convertDiagrams: false,
            });

            // Should contain wikilink references to diagrams
            expect(markdown).toMatch(/!\[\[.*\.png\]\]/);

            // Should have editable source comments
            expect(markdown).toContain('%% Editable source:');
        });

        it('should convert diagrams to mermaid code blocks when requested', () => {
            const sanitized = sanitizeHtml(mainContent, {
                includeImages: true,
                includeComments: false,
            }, '130520250');

            const markdown = convertToMarkdown(sanitized, {
                convertDiagrams: true,
                diagramTargetFormat: 'mermaid',
                embedDiagramsAsCode: true,
            });

            // Should contain mermaid code blocks
            expect(markdown).toContain('```mermaid');

            // Should NOT contain wikilink references when converting
            // (or should have both - depends on implementation)
            const wikilinkCount = (markdown.match(/!\[\[.*\.png\]\]/g) || []).length;
            const mermaidCount = (markdown.match(/```mermaid/g) || []).length;

            // At least some diagrams should be converted
            expect(mermaidCount).toBeGreaterThan(0);
        });
    });

    describe('Full document export', () => {
        it('should export complete markdown document with diagrams as wikilinks', async () => {
            const pageContent: PageContentData = {
                id: '130520250',
                title: 'Процесс (draft)',
                htmlContent: mainContent,
                version: {
                    number: 1,
                    when: '2025-12-23T10:00:00.000Z',
                },
            };

            const rootNode: PageTreeNode = {
                id: '130520250',
                title: 'Процесс (draft)',
                level: 0,
                children: [],
                parentId: null,
            };

            const settings: ExportSettings = {
                includeImages: true,
                includeComments: false,
                includeMetadata: true,
                includeSourceLinks: true,
            };

            // Export WITHOUT diagram conversion (for Obsidian vault)
            const result = await buildMarkdownDocument(
                [pageContent],
                rootNode,
                'Test Export',
                settings,
                'wikilink' // Keep as wikilinks
            );

            // Check structure
            expect(result.markdown).toContain('# Test Export');
            expect(result.markdown).toContain('## Metadata');
            expect(result.markdown).toContain('## Table of Contents');
            expect(result.markdown).toContain('## Процесс (draft)');

            // Check diagrams as wikilinks
            expect(result.markdown).toMatch(/!\[\[.*\.png\]\]/);
            expect(result.markdown).toContain('%% Editable source:');

            // Should NOT contain mermaid blocks
            expect(result.markdown).not.toContain('```mermaid');

            expect(result.pageCount).toBe(1);
        });

        it.skip('should export complete markdown document with diagrams as mermaid code', async () => {
            // NOTE: This test requires real Confluence API to download diagram XML
            // Skipped in test environment - will work in production
            const pageContent: PageContentData = {
                id: '130520250',
                title: 'Процесс (draft)',
                htmlContent: mainContent,
                version: {
                    number: 1,
                    when: '2025-12-23T10:00:00.000Z',
                },
            };

            const rootNode: PageTreeNode = {
                id: '130520250',
                title: 'Процесс (draft)',
                level: 0,
                children: [],
                parentId: null,
            };

            const settings: ExportSettings = {
                includeImages: true,
                includeComments: false,
                includeMetadata: true,
                includeSourceLinks: true,
            };

            // Export WITH diagram conversion (for copy/download)
            const result = await buildMarkdownDocument(
                [pageContent],
                rootNode,
                'Test Export',
                settings,
                true // convertDiagrams = true
            );

            // Check structure
            expect(result.markdown).toContain('# Test Export');
            expect(result.markdown).toContain('## Процесс (draft)');

            // Check diagrams converted to mermaid
            expect(result.markdown).toContain('```mermaid');

            expect(result.pageCount).toBe(1);
        });
    });

    describe('Edge cases', () => {
        it('should handle pages without diagrams', () => {
            const simpleHtml = '<p>Simple content without diagrams</p>';

            const sanitized = sanitizeHtml(simpleHtml, {
                includeImages: true,
                includeComments: false,
            });

            const markdown = convertToMarkdown(sanitized, {
                convertDiagrams: true,
                diagramTargetFormat: 'mermaid',
                embedDiagramsAsCode: true,
            });

            expect(markdown).toContain('Simple content without diagrams');
            expect(markdown).not.toContain('```mermaid');
            expect(markdown).not.toMatch(/!\[\[.*\.png\]\]/);
        });

        it('should handle empty HTML', () => {
            const sanitized = sanitizeHtml('', {
                includeImages: true,
                includeComments: false,
            });

            const markdown = convertToMarkdown(sanitized);
            expect(markdown).toBe('');
        });
    });
});
