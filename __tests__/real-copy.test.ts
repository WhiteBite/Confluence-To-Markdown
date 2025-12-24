/**
 * Test with real HTML structure from user's Confluence page
 */

import { describe, it, expect } from 'vitest';
import { sanitizeHtml, convertToMarkdown } from '../src/core/converter';

describe('Real Confluence HTML - Copy Mode', () => {
    it('should convert real draw.io diagrams to wikilinks when convertDiagrams=false', () => {
        // Real HTML structure from user's page
        const html = `
            <div class="wiki-content">
                <p></p>
                <div class="conf-macro output-block" data-hasbody="false" data-macro-name="drawio" style="display:block;">
                    <div id="drawio-macro-content-6ba95dff-04d7-43e1-8899-434ffbb3d3d3" 
                         style="position: relative; display: inline-block;" 
                         class="geDiagramContainer">
                        <svg>...</svg>
                    </div>
                    <script type="text/javascript">
                        var graphContainer = document.getElementById('drawio-macro-content-6ba95dff-04d7-43e1-8899-434ffbb3d3d3');
                        var readerOpts = {};
                        readerOpts.diagramName = decodeURIComponent('%31');
                    </script>
                </div>
                <p></p>
                <div class="conf-macro output-block" data-hasbody="false" data-macro-name="drawio-sketch" style="display:block;">
                    <div id="drawio-macro-content-a7458cd7-d923-4a3d-a71e-f8b92b5d1d44" 
                         class="geDiagramContainer">
                        <svg>...</svg>
                    </div>
                    <script type="text/javascript">
                        readerOpts.diagramName = decodeURIComponent('%32');
                    </script>
                </div>
            </div>
        `;

        // Sanitize (extracts diagram names from scripts)
        const sanitized = sanitizeHtml(html, {
            includeImages: true,
            includeComments: false,
        });

        // Convert with convertDiagrams=false (copy mode)
        const markdown = convertToMarkdown(sanitized, {
            convertDiagrams: false,
        });

        console.log('Generated markdown:', markdown);

        // Should have wikilinks
        expect(markdown).toContain('![[1.png]]');
        expect(markdown).toContain('![[2.png]]');

        // Should have source comments
        expect(markdown).toContain('%% Editable source: 1.drawio %%');
        expect(markdown).toContain('%% Editable source: 2.drawio %%');

        // Should NOT have mermaid blocks
        expect(markdown).not.toContain('```mermaid');
        expect(markdown).not.toContain('flowchart TB');
    });

    it('should handle multiple diagrams without creating empty mermaid blocks', () => {
        const html = `
            <div class="wiki-content">
                <div class="conf-macro output-block" data-macro-name="drawio">
                    <div class="geDiagramContainer">
                        <script>readerOpts.diagramName = decodeURIComponent('%31');</script>
                    </div>
                </div>
                <div class="conf-macro output-block" data-macro-name="drawio">
                    <div class="geDiagramContainer">
                        <script>readerOpts.diagramName = decodeURIComponent('%32');</script>
                    </div>
                </div>
                <div class="conf-macro output-block" data-macro-name="drawio">
                    <div class="geDiagramContainer">
                        <script>readerOpts.diagramName = decodeURIComponent('%33');</script>
                    </div>
                </div>
                <div class="conf-macro output-block" data-macro-name="drawio">
                    <div class="geDiagramContainer">
                        <script>readerOpts.diagramName = decodeURIComponent('%34');</script>
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

        // Count wikilinks
        const wikilinkMatches = markdown.match(/!\[\[\d+\.png\]\]/g);
        expect(wikilinkMatches).toHaveLength(4);

        // Should NOT have any mermaid blocks
        const mermaidMatches = markdown.match(/```mermaid/g);
        expect(mermaidMatches).toBeNull();
    });
});
