/**
 * Unit tests for attachment filter logic in createConfluenceBackup.
 *
 * Verifies:
 *   1. attachmentFilter = '' → no attachments downloaded (downloadTasks empty)
 *   2. attachmentFilter = 'csv' → only .csv files downloaded, others skipped
 *   3. attachmentFilter = '*' → all files downloaded
 *   4. maxAttachmentSizeMB = 1 → 2 MB file skipped, 0.5 MB file downloaded
 *   5. page.attachments in result JSON contains only filtered attachments
 *
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { unzipSync } from 'fflate';
import type { AttachmentInfo } from '../src/api/types';
import type { BackupPageData } from '../src/core/backup-exporter';

// ── Mocks ─────────────────────────────────────────────────────────────────

vi.mock('@/api/confluence', () => ({
    getBaseUrl: () => 'http://confluence.test',
}));

const mockFetchJson = vi.fn();
vi.mock('@/utils/transport', () => ({
    fetchJson: (...args: unknown[]) => mockFetchJson(...args),
}));

const mockFetchPageAttachments = vi.fn<(pageId: string) => Promise<AttachmentInfo[]>>();
const mockExportAnyAttachment = vi.fn();
vi.mock('../src/core/attachment-handler', () => ({
    fetchPageAttachments: (pageId: string) => mockFetchPageAttachments(pageId),
    exportAnyAttachment: (att: AttachmentInfo) => mockExportAnyAttachment(att),
}));

// Suppress logger noise in tests
vi.mock('@/utils/logger', () => ({
    ctmLog: vi.fn(),
    ctmError: vi.fn(),
    ctmWarn: vi.fn(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────

function makePageResponse(id: string, title = 'Test Page') {
    return {
        id,
        title,
        type: 'page',
        status: 'current',
        space: { key: 'TEST' },
        body: {
            storage: { value: '<p>content</p>', representation: 'storage' },
            view: { value: '<p>content</p>', representation: 'view' },
        },
        ancestors: [],
        version: { number: 1, when: '2024-01-01T00:00:00Z' },
        metadata: { labels: { results: [] } },
    };
}

function makeAttachment(filename: string, fileSize: number, downloadUrl = `http://confluence.test/download/${filename}`): AttachmentInfo {
    return {
        id: `att-${filename}`,
        title: filename,
        filename,
        mediaType: 'application/octet-stream',
        fileSize,
        downloadUrl,
        pageId: '1',
    };
}

function makeBlobFor(filename: string): Blob {
    return new Blob([`data for ${filename}`], { type: 'application/octet-stream' });
}

const ROOT_NODE = {
    id: '1',
    title: 'Root',
    parentId: null,
    children: [],
};

// ── Tests ─────────────────────────────────────────────────────────────────

describe('createConfluenceBackup — attachment filter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default: fetchJson returns a valid page for any page ID
        mockFetchJson.mockResolvedValue(makePageResponse('1'));
        // Default: no attachments
        mockFetchPageAttachments.mockResolvedValue([]);
        // Default: successful export
        mockExportAnyAttachment.mockImplementation((att: AttachmentInfo) =>
            Promise.resolve({ filename: att.filename, blob: makeBlobFor(att.filename) })
        );
    });

    it('1. attachmentFilter = "" → no attachments downloaded', async () => {
        const { createConfluenceBackup } = await import('../src/core/backup-exporter');

        mockFetchPageAttachments.mockResolvedValue([
            makeAttachment('report.pdf', 1024),
            makeAttachment('data.csv', 512),
        ]);

        const result = await createConfluenceBackup(
            ['1'],
            ROOT_NODE,
            'Root',
            'TEST',
            'Test Space',
            {
                includeAttachments: false, // empty filter → false
                includeViewHtml: false,
                attachmentFilter: '',
                maxAttachmentSizeMB: 0,
            }
        );

        // fetchPageAttachments should not have been called at all
        expect(mockFetchPageAttachments).not.toHaveBeenCalled();
        expect(mockExportAnyAttachment).not.toHaveBeenCalled();
        expect(result.attachmentCount).toBe(0);
    });

    it('2. attachmentFilter = "csv" → only .csv downloaded, others skipped', async () => {
        const { createConfluenceBackup } = await import('../src/core/backup-exporter');

        mockFetchPageAttachments.mockResolvedValue([
            makeAttachment('report.pdf', 1024),
            makeAttachment('data.csv', 512),
            makeAttachment('image.png', 2048),
        ]);

        const result = await createConfluenceBackup(
            ['1'],
            ROOT_NODE,
            'Root',
            'TEST',
            'Test Space',
            {
                includeAttachments: true,
                includeViewHtml: false,
                attachmentFilter: 'csv',
                maxAttachmentSizeMB: 0,
            }
        );

        // Only data.csv should have been exported
        expect(mockExportAnyAttachment).toHaveBeenCalledTimes(1);
        expect(mockExportAnyAttachment).toHaveBeenCalledWith(
            expect.objectContaining({ filename: 'data.csv' })
        );
        expect(result.attachmentCount).toBe(1);
    });

    it('3. attachmentFilter = "*" → all attachments downloaded', async () => {
        const { createConfluenceBackup } = await import('../src/core/backup-exporter');

        mockFetchPageAttachments.mockResolvedValue([
            makeAttachment('report.pdf', 1024),
            makeAttachment('data.csv', 512),
            makeAttachment('image.png', 2048),
        ]);

        const result = await createConfluenceBackup(
            ['1'],
            ROOT_NODE,
            'Root',
            'TEST',
            'Test Space',
            {
                includeAttachments: true,
                includeViewHtml: false,
                attachmentFilter: '*',
                maxAttachmentSizeMB: 0,
            }
        );

        expect(mockExportAnyAttachment).toHaveBeenCalledTimes(3);
        expect(result.attachmentCount).toBe(3);
    });

    it('4. maxAttachmentSizeMB = 1 → 2 MB file skipped, 0.5 MB file downloaded', async () => {
        const { createConfluenceBackup } = await import('../src/core/backup-exporter');

        const MB = 1024 * 1024;
        mockFetchPageAttachments.mockResolvedValue([
            makeAttachment('large.pdf', 2 * MB),   // 2 MB → should be skipped
            makeAttachment('small.pdf', 0.5 * MB), // 0.5 MB → should pass
        ]);

        const result = await createConfluenceBackup(
            ['1'],
            ROOT_NODE,
            'Root',
            'TEST',
            'Test Space',
            {
                includeAttachments: true,
                includeViewHtml: false,
                attachmentFilter: '*',
                maxAttachmentSizeMB: 1,
            }
        );

        expect(mockExportAnyAttachment).toHaveBeenCalledTimes(1);
        expect(mockExportAnyAttachment).toHaveBeenCalledWith(
            expect.objectContaining({ filename: 'small.pdf' })
        );
        expect(result.attachmentCount).toBe(1);
    });

    it('5. page.attachments in ZIP JSON contains only filtered attachments', async () => {
        const { createConfluenceBackup } = await import('../src/core/backup-exporter');

        const MB = 1024 * 1024;
        mockFetchPageAttachments.mockResolvedValue([
            makeAttachment('keep.csv', 512),         // passes csv filter
            makeAttachment('skip.pdf', 1024),        // blocked by type filter
            makeAttachment('too-large.csv', 2 * MB), // blocked by size limit
        ]);

        const result = await createConfluenceBackup(
            ['1'],
            ROOT_NODE,
            'Root',
            'TEST',
            'Test Space',
            {
                includeAttachments: true,
                includeViewHtml: false,
                attachmentFilter: 'csv',
                maxAttachmentSizeMB: 1,
            }
        );

        // Parse the ZIP and read page JSON
        const zipData = new Uint8Array(await result.zipBlob.arrayBuffer());
        const entries = unzipSync(zipData);

        expect(entries['pages/1.json']).toBeDefined();
        const page: BackupPageData = JSON.parse(new TextDecoder().decode(entries['pages/1.json']));

        // Only keep.csv passed both filters
        expect(page.attachments).toHaveLength(1);
        expect(page.attachments[0].filename).toBe('keep.csv');
        expect(page.attachments[0].size).toBe(512);
    });
});

// ── ZIP structure tests ────────────────────────────────────────────────────

describe('createConfluenceBackup — ZIP structure', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetchJson.mockResolvedValue(makePageResponse('1'));
        mockFetchPageAttachments.mockResolvedValue([]);
    });

    it('ZIP contains manifest.json with correct schema fields', async () => {
        const { createConfluenceBackup } = await import('../src/core/backup-exporter');

        const result = await createConfluenceBackup(
            ['1'],
            ROOT_NODE,
            'Root',
            'TEST',
            null,
            { includeAttachments: false, includeViewHtml: false, attachmentFilter: '', maxAttachmentSizeMB: 0 }
        );

        const entries = unzipSync(new Uint8Array(await result.zipBlob.arrayBuffer()));
        expect(entries['manifest.json']).toBeDefined();

        const manifest = JSON.parse(new TextDecoder().decode(entries['manifest.json']));
        expect(manifest.formatVersion).toBe('1.0');
        expect(manifest.spaceKey).toBe('TEST');
        expect(manifest.pageCount).toBe(1);
        expect(manifest.attachmentCount).toBe(0);
        expect(typeof manifest.exportDate).toBe('string');
        expect(typeof manifest.confluenceBaseUrl).toBe('string');
    });

    it('ZIP contains tree.json preserving the page hierarchy', async () => {
        const { createConfluenceBackup } = await import('../src/core/backup-exporter');

        const rootWithChild = {
            id: '1',
            title: 'Root',
            parentId: null,
            children: [{ id: '2', title: 'Child', parentId: '1', children: [] }],
        };
        mockFetchJson
            .mockResolvedValueOnce(makePageResponse('1'))
            .mockResolvedValueOnce(makePageResponse('2'));

        const result = await createConfluenceBackup(
            ['1', '2'],
            rootWithChild,
            'Root',
            'TEST',
            null,
            { includeAttachments: false, includeViewHtml: false, attachmentFilter: '', maxAttachmentSizeMB: 0 }
        );

        const entries = unzipSync(new Uint8Array(await result.zipBlob.arrayBuffer()));
        expect(entries['tree.json']).toBeDefined();

        const tree = JSON.parse(new TextDecoder().decode(entries['tree.json']));
        expect(tree.id).toBe('1');
        expect(tree.children).toHaveLength(1);
        expect(tree.children[0].id).toBe('2');
    });

    it('ZIP contains pages/{id}.json with body.storage content', async () => {
        const { createConfluenceBackup } = await import('../src/core/backup-exporter');

        const pageResponse = {
            ...makePageResponse('1'),
            body: {
                storage: { value: '<p>Hello <strong>world</strong></p>', representation: 'storage' },
                view: { value: '<p>Hello world</p>', representation: 'view' },
            },
        };
        mockFetchJson.mockResolvedValue(pageResponse);

        const result = await createConfluenceBackup(
            ['1'],
            ROOT_NODE,
            'Root',
            'TEST',
            null,
            { includeAttachments: false, includeViewHtml: false, attachmentFilter: '', maxAttachmentSizeMB: 0 }
        );

        const entries = unzipSync(new Uint8Array(await result.zipBlob.arrayBuffer()));
        expect(entries['pages/1.json']).toBeDefined();

        const page = JSON.parse(new TextDecoder().decode(entries['pages/1.json']));
        expect(page.id).toBe('1');
        expect(page.body.storage).toBe('<p>Hello <strong>world</strong></p>');
        // view HTML excluded when includeViewHtml: false
        expect(page.body.view).toBeUndefined();
    });

    it('result metadata (pageCount, attachmentCount) matches ZIP contents', async () => {
        const { createConfluenceBackup } = await import('../src/core/backup-exporter');

        const MB = 1024 * 1024;
        mockFetchPageAttachments.mockResolvedValue([
            makeAttachment('doc.csv', 0.1 * MB),
        ]);
        mockExportAnyAttachment.mockResolvedValue({
            filename: 'doc.csv',
            blob: makeBlobFor('doc.csv'),
        });

        const result = await createConfluenceBackup(
            ['1'],
            ROOT_NODE,
            'Root',
            'TEST',
            null,
            { includeAttachments: true, includeViewHtml: false, attachmentFilter: '*', maxAttachmentSizeMB: 0 }
        );

        expect(result.pageCount).toBe(1);
        expect(result.attachmentCount).toBe(1);

        // manifest in ZIP must be consistent with result metadata
        const entries = unzipSync(new Uint8Array(await result.zipBlob.arrayBuffer()));
        const manifest = JSON.parse(new TextDecoder().decode(entries['manifest.json']));
        expect(manifest.pageCount).toBe(result.pageCount);
        expect(manifest.attachmentCount).toBe(result.attachmentCount);
    });
});
