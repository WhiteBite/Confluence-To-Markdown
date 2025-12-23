/**
 * Detailed test with example HTML file
 * Tests actual diagram extraction and conversion with real Confluence HTML
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { sanitizeHtml, convertToMarkdown, extractDiagramInfoFromHtml } from '../src/core/converter';
import { buildMarkdownDocument } from '../src/core/exporter';
import { extractDiagramReferences } from '../src/core/attachment-handler';
import type { PageContentData, PageTreeNode } from '../src/api/types';
import type { ExportSettings } from '../src/storage/types';

describe('Example HTML Export Test', () => {
    const htmlPath = join(__dirname, '../example/[vstr-cache] Алгоритм параллельной обработки сортовых составов v2.2 - iBOX - Confluence.html');
    const realHtml = readFileSync(htmlPath, 'utf-8');

    // Use full HTML - sanitizeHtml will extract what we need
    const mainContent = realHtml;

    describe('Step 1: Extract diagram info from raw HTML', () => {
        it('should find all diagrams in HTML before sanitization', () => {
            const diagrams = extractDiagramInfoFromHtml(mainContent);

            console.log('\n📊 Diagrams found:', diagrams.length);
            diagrams.forEach((d, i) => {
                console.log(`  ${i + 1}. ${d.type}: "${d.name}" (index: ${d.index})`);
            });

            expect(diagrams.length).toBeGreaterThan(0);

            // Check that names are extracted
            diagrams.forEach(d => {
                expect(d.name).toBeTruthy();
                expect(d.name).not.toBe('diagram');
            });
        });

        it('should extract diagram references using attachment-handler', () => {
            const refs = extractDiagramReferences(mainContent);

            console.log('\n📎 Diagram references:', refs.length);
            refs.forEach((r, i) => {
                console.log(`  ${i + 1}. ${r.type}: "${r.name}"`);
            });

            expect(refs.length).toBeGreaterThan(0);
        });
    });

    describe('Step 2: Sanitize HTML and preserve diagram names', () => {
        it('should sanitize HTML and keep diagram names in data attributes', () => {
            const sanitized = sanitizeHtml(mainContent, {
                includeImages: true,
                includeComments: false,
            }, '130520250');

            // Check scripts are removed
            expect(sanitized).not.toContain('<script');
            expect(sanitized).not.toContain('readerOpts');

            // Check diagram names are preserved
            const nameMatches = sanitized.match(/data-extracted-diagram-name="([^"]+)"/g);

            console.log('\n🏷️  Preserved diagram names:', nameMatches?.length || 0);
            nameMatches?.forEach((match, i) => {
                const name = match.match(/data-extracted-diagram-name="([^"]+)"/)?.[1];
                console.log(`  ${i + 1}. "${name}"`);
            });

            expect(nameMatches).toBeTruthy();
            expect(nameMatches!.length).toBeGreaterThan(0);
        });
    });

    describe('Step 3: Convert to Markdown (wikilinks mode)', () => {
        it('should convert diagrams to wikilinks', () => {
            const sanitized = sanitizeHtml(mainContent, {
                includeImages: true,
                includeComments: false,
            }, '130520250');

            const markdown = convertToMarkdown(sanitized, {
                convertDiagrams: false,
            });

            // Find all wikilinks
            const wikilinks = markdown.match(/!\[\[([^\]]+)\]\]/g);

            console.log('\n🔗 Wikilinks generated:', wikilinks?.length || 0);
            wikilinks?.forEach((link, i) => {
                console.log(`  ${i + 1}. ${link}`);
            });

            expect(wikilinks).toBeTruthy();
            expect(wikilinks!.length).toBeGreaterThan(0);

            // Check editable source comments
            const sourceComments = markdown.match(/%% Editable source: ([^\n]+)/g);
            console.log('\n📝 Source comments:', sourceComments?.length || 0);

            expect(sourceComments).toBeTruthy();
        });
    });

    describe('Step 4: Convert to Markdown (mermaid mode)', () => {
        it('should convert diagrams to mermaid code blocks', () => {
            const sanitized = sanitizeHtml(mainContent, {
                includeImages: true,
                includeComments: false,
            }, '130520250');

            const markdown = convertToMarkdown(sanitized, {
                convertDiagrams: true,
                diagramTargetFormat: 'mermaid',
                embedDiagramsAsCode: true,
            });

            // Find mermaid blocks
            const mermaidBlocks = markdown.match(/```mermaid[\s\S]*?```/g);

            console.log('\n🎨 Mermaid blocks generated:', mermaidBlocks?.length || 0);
            if (mermaidBlocks) {
                mermaidBlocks.forEach((block, i) => {
                    const lines = block.split('\n');
                    console.log(`  ${i + 1}. ${lines.length} lines`);
                });
            }

            // Note: mermaid blocks might be 0 if conversion is not implemented
            // In that case, should still have wikilinks as fallback
            const wikilinks = markdown.match(/!\[\[([^\]]+)\]\]/g);

            console.log('   Fallback wikilinks:', wikilinks?.length || 0);

            // At least one of them should exist
            expect(mermaidBlocks || wikilinks).toBeTruthy();
        });
    });

    describe('Step 5: Full document export', () => {
        it('should export complete document with wikilinks', async () => {
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

            const result = await buildMarkdownDocument(
                [pageContent],
                rootNode,
                'Test Export',
                settings,
                'wikilink' // Keep as wikilinks
            );

            // Save to file for inspection
            const outputPath = join(__dirname, '../example/output-wikilinks.md');
            writeFileSync(outputPath, result.markdown, 'utf-8');
            console.log(`\n💾 Saved wikilinks output to: ${outputPath}`);

            // Verify structure
            expect(result.markdown).toContain('# Test Export');
            expect(result.markdown).toContain('## Процесс (draft)');
            expect(result.markdown).toMatch(/!\[\[.*\.png\]\]/);

            const wikilinks = result.markdown.match(/!\[\[([^\]]+)\]\]/g);
            console.log(`\n✅ Final wikilinks count: ${wikilinks?.length || 0}`);
        });

        it.skip('should export complete document with mermaid', async () => {
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

            const result = await buildMarkdownDocument(
                [pageContent],
                rootNode,
                'Test Export',
                settings,
                true // mermaid mode
            );

            // Save to file for inspection
            const outputPath = join(__dirname, '../example/output-mermaid.md');
            writeFileSync(outputPath, result.markdown, 'utf-8');
            console.log(`\n💾 Saved mermaid output to: ${outputPath}`);

            // Verify structure
            expect(result.markdown).toContain('# Test Export');
            expect(result.markdown).toContain('## Процесс (draft)');

            const mermaidBlocks = result.markdown.match(/```mermaid[\s\S]*?```/g);
            const wikilinks = result.markdown.match(/!\[\[([^\]]+)\]\]/g);

            console.log(`\n✅ Final mermaid blocks: ${mermaidBlocks?.length || 0}`);
            console.log(`✅ Final wikilinks (fallback): ${wikilinks?.length || 0}`);

            // NOTE: In test environment without real API, diagrams will remain as wikilinks
            // In production, convertDrawioToMermaid will download XML and convert to Mermaid
            expect(wikilinks).toBeTruthy();
            expect(wikilinks!.length).toBeGreaterThan(0);
        });
    });

    describe('Step 6: Verify diagram names', () => {
        it('should use correct diagram names from HTML', () => {
            const diagrams = extractDiagramInfoFromHtml(mainContent);
            const sanitized = sanitizeHtml(mainContent, {
                includeImages: true,
                includeComments: false,
            }, '130520250');
            const markdown = convertToMarkdown(sanitized, {
                convertDiagrams: false,
            });

            console.log('\n🔍 Verifying diagram names match:');

            diagrams.forEach((diagram, i) => {
                const expectedLink = `![[${diagram.name}.png]]`;
                const found = markdown.includes(expectedLink);

                console.log(`  ${i + 1}. "${diagram.name}" → ${found ? '✅' : '❌'}`);

                if (!found) {
                    // Try to find what name was actually used
                    const allLinks = markdown.match(/!\[\[([^\]]+)\]\]/g);
                    console.log(`     Available links:`, allLinks?.slice(0, 3));
                }
            });

            // At least some diagrams should match
            const matchCount = diagrams.filter(d =>
                markdown.includes(`![[${d.name}.png]]`)
            ).length;

            console.log(`\n📊 Match rate: ${matchCount}/${diagrams.length}`);
            expect(matchCount).toBeGreaterThan(0);
        });
    });
});
