/**
 * Links Manifest — extract a space/page tree as a flat list of page links.
 *
 * Produces a structured payload (title + pageId + URL) for every node in the
 * tree, without fetching page bodies. Useful for building QA corpora or
 * feeding downstream tools that only need "which page lives where".
 */

import { getBaseUrl } from '@/api/confluence';
import { flattenTree } from './tree-processor';
import { sanitizeFilename } from './link-resolver';
import type { PageTreeNode } from '@/api/types';

export interface LinkManifestEntry {
    title: string;
    pageId: string;
    url: string;
    level: number;
    parentId: string | null;
}

export interface LinkManifest {
    source: 'confluence';
    baseUrl: string;
    rootTitle: string;
    spaceKey: string | null;
    generatedAt: string;
    count: number;
    pages: LinkManifestEntry[];
}

/** Build a flat links manifest from the tree (no network calls). */
export function buildLinksManifest(
    rootTree: PageTreeNode,
    rootTitle: string,
    spaceKey: string | null
): LinkManifest {
    const baseUrl = getBaseUrl();
    const flat = flattenTree(rootTree);

    const pages: LinkManifestEntry[] = flat.map((node) => ({
        title: node.title,
        pageId: node.id,
        url: `${baseUrl}/pages/viewpage.action?pageId=${node.id}`,
        level: node.level,
        parentId: node.parentId,
    }));

    return {
        source: 'confluence',
        baseUrl,
        rootTitle,
        spaceKey,
        generatedAt: new Date().toISOString(),
        count: pages.length,
        pages,
    };
}

/** Render the manifest as a markdown list (`- [title](url)`). */
export function renderLinksMarkdown(manifest: LinkManifest): string {
    const lines: string[] = [];
    lines.push(`# ${manifest.rootTitle} — links`);
    lines.push('');
    lines.push(`> Generated ${manifest.generatedAt} · ${manifest.count} pages`);
    lines.push('');
    for (const p of manifest.pages) {
        const indent = '  '.repeat(Math.max(0, p.level));
        lines.push(`${indent}- [${p.title}](${p.url})`);
    }
    lines.push('');
    return lines.join('\n');
}

/** Download the manifest as a JSON file. */
export function downloadLinksManifest(manifest: LinkManifest): void {
    const json = JSON.stringify(manifest, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const filename = `${sanitizeFilename(manifest.rootTitle)}_links.json`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
