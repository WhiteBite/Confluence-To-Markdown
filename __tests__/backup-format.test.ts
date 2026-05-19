/**
 * Tests for Confluence Backup format (.cfb.zip) structure.
 * Validates manifest, tree, and page JSON schemas.
 *
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest';
import { unzipSync, zipSync, strToU8 } from 'fflate';
import type { BackupManifest, BackupPageData } from '../src/core/backup-exporter';

/** Helper: create a minimal valid .cfb.zip for testing */
function createTestBackupZip(pages: BackupPageData[], manifest?: Partial<BackupManifest>): Uint8Array {
    const now = new Date();
    const fullManifest: BackupManifest = {
        formatVersion: '1.0',
        exportDate: now.toISOString(),
        exportedBy: 'test',
        spaceKey: 'TEST',
        spaceName: 'Test Space',
        rootPageId: '1',
        rootPageTitle: 'Root',
        pageCount: pages.length,
        attachmentCount: 0,
        confluenceBaseUrl: 'http://localhost:8090',
        ...manifest,
    };

    const tree = { id: '1', title: 'Root', children: pages.map(p => ({ id: p.id, title: p.title, children: [] })) };

    // Use plain Uint8Array (no tuple) because vitest+jsdom has cross-realm
    // Uint8Array issue where fflate's `instanceof u8` check fails with tuples.
    const files: Record<string, Uint8Array> = {
        'manifest.json': strToU8(JSON.stringify(fullManifest, null, 2)),
        'tree.json': strToU8(JSON.stringify(tree, null, 2)),
    };

    for (const page of pages) {
        files[`pages/${page.id}.json`] = strToU8(JSON.stringify(page, null, 2));
    }

    return zipSync(files);
}

describe('Confluence Backup format (.cfb.zip)', () => {
    it('contains manifest.json with correct schema', () => {
        const pages: BackupPageData[] = [{
            id: '100',
            title: 'Test Page',
            parentId: '1',
            spaceKey: 'TEST',
            ancestors: [{ id: '1', title: 'Root' }],
            version: { number: 3, when: '2024-01-15T10:00:00Z' },
            labels: ['test', 'docs'],
            body: { storage: '<p>Hello <strong>world</strong></p>' },
            attachments: [],
        }];

        const zip = createTestBackupZip(pages);
        const entries = unzipSync(zip);

        // manifest.json exists
        expect(entries['manifest.json']).toBeDefined();
        const manifest: BackupManifest = JSON.parse(new TextDecoder().decode(entries['manifest.json']));

        expect(manifest.formatVersion).toBe('1.0');
        expect(manifest.spaceKey).toBe('TEST');
        expect(manifest.pageCount).toBe(1);
        expect(manifest.confluenceBaseUrl).toBe('http://localhost:8090');
    });

    it('contains tree.json with hierarchy', () => {
        const pages: BackupPageData[] = [
            { id: '10', title: 'Child 1', parentId: '1', spaceKey: 'T', ancestors: [], version: null, labels: [], body: { storage: '' }, attachments: [] },
            { id: '20', title: 'Child 2', parentId: '1', spaceKey: 'T', ancestors: [], version: null, labels: [], body: { storage: '' }, attachments: [] },
        ];

        const zip = createTestBackupZip(pages);
        const entries = unzipSync(zip);

        const tree = JSON.parse(new TextDecoder().decode(entries['tree.json']));
        expect(tree.id).toBe('1');
        expect(tree.children).toHaveLength(2);
        expect(tree.children[0].id).toBe('10');
        expect(tree.children[1].id).toBe('20');
    });

    it('stores pages as pages/{id}.json with body.storage', () => {
        const storageHtml = '<ac:structured-macro ac:name="info"><ac:rich-text-body><p>Important</p></ac:rich-text-body></ac:structured-macro>';
        const pages: BackupPageData[] = [{
            id: '42',
            title: 'Page with Macro',
            parentId: null,
            spaceKey: 'DEMO',
            ancestors: [],
            version: { number: 7, when: '2025-03-01T12:00:00Z' },
            labels: ['architecture'],
            body: { storage: storageHtml },
            attachments: [{ filename: 'diagram.drawio', mediaType: 'application/vnd.jgraph.mxfile', size: 3000 }],
        }];

        const zip = createTestBackupZip(pages);
        const entries = unzipSync(zip);

        expect(entries['pages/42.json']).toBeDefined();
        const page: BackupPageData = JSON.parse(new TextDecoder().decode(entries['pages/42.json']));

        expect(page.id).toBe('42');
        expect(page.title).toBe('Page with Macro');
        expect(page.body.storage).toBe(storageHtml);
        expect(page.labels).toContain('architecture');
        expect(page.attachments[0].filename).toBe('diagram.drawio');
    });

    it('preserves Confluence macros in body.storage (lossless)', () => {
        const complexStorage = [
            '<ac:structured-macro ac:name="expand"><ac:parameter ac:name="title">Details</ac:parameter>',
            '<ac:rich-text-body><p>Hidden content</p></ac:rich-text-body></ac:structured-macro>',
            '<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">typescript</ac:parameter>',
            '<ac:plain-text-body><![CDATA[const x = 1;]]></ac:plain-text-body></ac:structured-macro>',
        ].join('');

        const pages: BackupPageData[] = [{
            id: '99',
            title: 'Complex Page',
            parentId: null,
            spaceKey: 'X',
            ancestors: [],
            version: null,
            labels: [],
            body: { storage: complexStorage },
            attachments: [],
        }];

        const zip = createTestBackupZip(pages);
        const entries = unzipSync(zip);
        const page: BackupPageData = JSON.parse(new TextDecoder().decode(entries['pages/99.json']));

        // Body.storage is preserved EXACTLY — no conversion, no loss
        expect(page.body.storage).toBe(complexStorage);
        expect(page.body.storage).toContain('ac:structured-macro');
        expect(page.body.storage).toContain('CDATA[const x = 1;]');
    });

    it('handles Cyrillic titles and content', () => {
        const pages: BackupPageData[] = [{
            id: '200',
            title: 'Архитектура системы Рутил v2.0',
            parentId: null,
            spaceKey: 'RUTIL',
            ancestors: [],
            version: { number: 14, when: '2024-08-12T15:32:00Z' },
            labels: ['архитектура', 'рутил'],
            body: { storage: '<p>Описание архитектуры</p>' },
            attachments: [{ filename: 'Снимок экрана.png', mediaType: 'image/png', size: 50000 }],
        }];

        const zip = createTestBackupZip(pages);
        const entries = unzipSync(zip);
        const page: BackupPageData = JSON.parse(new TextDecoder().decode(entries['pages/200.json']));

        expect(page.title).toBe('Архитектура системы Рутил v2.0');
        expect(page.labels).toContain('архитектура');
        expect(page.body.storage).toContain('Описание архитектуры');
    });
});
