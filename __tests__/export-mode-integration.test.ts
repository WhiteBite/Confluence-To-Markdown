import { describe, it, expect } from 'vitest';
import { buildMarkdownDocument } from '@/core/exporter';
import type { PageContentData, PageTreeNode } from '@/api/types';
import type { ExportSettings } from '@/storage/types';

describe('integration: buildMarkdownDocument with diagram formats', () => {
    const mockPage: PageContentData = {
        id: '123',
        title: 'Test Page',
        htmlContent: `
      <div class="content-wrapper">
        <p>Test content</p>
        <div class="confluence-drawio-macro" data-macro-name="drawio">
          <script type="application/json">
            {"diagramName":"diagram-1"}
          </script>
        </div>
      </div>
    `,
        version: { number: 1, when: '2024-01-01', by: { displayName: 'Test' } },
    };

    const rootNode: PageTreeNode = {
        id: '123',
        title: 'Test Page',
        level: 0,
        children: [],
    };

    const settings: ExportSettings = {
        includeMetadata: false,
        includeSourceLinks: false,
        includeImages: true,
        includeComments: false,
    };

    it('should keep wikilinks when diagramFormat=wikilink', async () => {
        const result = await buildMarkdownDocument(
            [mockPage],
            rootNode,
            'Test Export',
            settings,
            'wikilink' // Explicitly pass wikilink format
        );

        expect(result.markdown).toContain('![[diagram-1.png]]');
        expect(result.markdown).not.toContain('```mermaid');
    });

    // Note: Testing conversion with diagramFormat='mermaid' requires network access
    // to fetch diagram sources from Confluence, which is not available in unit tests.
    // Integration tests with real Confluence instance should cover this scenario.
});
