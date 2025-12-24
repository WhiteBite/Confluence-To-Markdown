/**
 * Bug test: Empty Mermaid output for Draw.io diagrams
 * 
 * Issue: When diagram conversion fails (no XML content available),
 * the converter returns empty "flowchart TB" instead of null/wikilink fallback.
 * 
 * Expected: Return null when conversion produces empty diagram,
 * so the caller can use wikilink fallback.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the attachment handler to simulate failed downloads
vi.mock('../src/core/attachment-handler', () => ({
    fetchPageAttachments: vi.fn(),
    downloadAttachment: vi.fn(),
}));

// Mock the confluence API
vi.mock('../src/api/confluence', () => ({
    getBaseUrl: vi.fn(() => 'https://confluence.example.com'),
}));

// Mock the diagram converter to test empty output handling
vi.mock('@whitebite/diagram-converter', () => ({
    convert: vi.fn(),
}));

import { convertDrawioToMermaid } from '../src/core/diagrams/converter';
import { fetchPageAttachments, downloadAttachment } from '../src/core/attachment-handler';
import { convert } from '@whitebite/diagram-converter';

describe('Draw.io to Mermaid conversion - empty output bug', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return null when conversion produces empty flowchart', async () => {
        // Setup: attachment exists but conversion produces empty diagram
        const mockAttachments = [
            { filename: 'test-diagram.drawio', downloadUrl: '/download/test.drawio' }
        ];

        vi.mocked(fetchPageAttachments).mockResolvedValue(mockAttachments);
        const mockBlob = { text: vi.fn().mockResolvedValue('<mxfile></mxfile>') } as unknown as Blob;
        vi.mocked(downloadAttachment).mockResolvedValue(mockBlob);

        // Mock converter returning empty flowchart (the bug)
        vi.mocked(convert).mockReturnValue({
            output: 'flowchart TB',
            diagram: { nodes: [], edges: [], groups: [], metadata: { source: 'drawio' } },
        } as any);

        const result = await convertDrawioToMermaid('123', 'test-diagram');

        // Should return null for empty diagram, not "flowchart TB"
        expect(result).toBeNull();
    });

    it('should return null when conversion produces flowchart with only whitespace', async () => {
        const mockAttachments = [
            { filename: 'test-diagram.drawio', downloadUrl: '/download/test.drawio' }
        ];

        vi.mocked(fetchPageAttachments).mockResolvedValue(mockAttachments);
        const mockBlob = { text: vi.fn().mockResolvedValue('<mxfile></mxfile>') } as unknown as Blob;
        vi.mocked(downloadAttachment).mockResolvedValue(mockBlob);

        vi.mocked(convert).mockReturnValue({
            output: 'flowchart TB\n\n',
            diagram: { nodes: [], edges: [], groups: [], metadata: { source: 'drawio' } },
        } as any);

        const result = await convertDrawioToMermaid('123', 'test-diagram');

        expect(result).toBeNull();
    });

    it('should return mermaid code when conversion produces valid diagram', async () => {
        const mockAttachments = [
            { filename: 'test-diagram.drawio', downloadUrl: '/download/test.drawio' }
        ];

        vi.mocked(fetchPageAttachments).mockResolvedValue(mockAttachments);

        // Create a mock blob with text() method that works in test environment
        const mockBlob = {
            text: vi.fn().mockResolvedValue('<mxfile>...</mxfile>'),
        } as unknown as Blob;
        vi.mocked(downloadAttachment).mockResolvedValue(mockBlob);

        const validMermaid = 'flowchart TB\n    A[Start] --> B[End]';
        vi.mocked(convert).mockReturnValue({
            output: validMermaid,
            diagram: {
                nodes: [{ id: 'A' }, { id: 'B' }],
                edges: [{ id: 'e1', source: 'A', target: 'B' }],
                groups: [],
                metadata: { source: 'drawio' }
            },
        } as any);

        const result = await convertDrawioToMermaid('123', 'test-diagram');

        expect(fetchPageAttachments).toHaveBeenCalledWith('123');
        expect(downloadAttachment).toHaveBeenCalledWith('/download/test.drawio');
        expect(convert).toHaveBeenCalled();

        expect(result).toBe(validMermaid);
    });

    it('should return null when attachment download fails', async () => {
        vi.mocked(fetchPageAttachments).mockResolvedValue([]);

        const result = await convertDrawioToMermaid('123', 'nonexistent-diagram');

        expect(result).toBeNull();
    });

    it('should return null when converter throws error', async () => {
        const mockAttachments = [
            { filename: 'test-diagram.drawio', downloadUrl: '/download/test.drawio' }
        ];

        vi.mocked(fetchPageAttachments).mockResolvedValue(mockAttachments);
        const mockBlob = { text: vi.fn().mockResolvedValue('invalid xml') } as unknown as Blob;
        vi.mocked(downloadAttachment).mockResolvedValue(mockBlob);
        vi.mocked(convert).mockImplementation(() => {
            throw new Error('Parse error');
        });

        const result = await convertDrawioToMermaid('123', 'test-diagram');

        expect(result).toBeNull();
    });
});
