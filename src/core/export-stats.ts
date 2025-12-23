/**
 * Export statistics collection and display
 */

import type { PageTreeNode, PageContentData } from '@/api/types';
import { flattenTree } from './tree-processor';

export interface ExportStats {
    pages: number;
    selectedPages: number;
    images: number;
    diagrams: {
        total: number;
        drawio: number;
        gliffy: number;
        plantuml: number;
        mermaid: number;
    };
    attachments: number;
    estimatedSizeMB: number;
    errors: number;
}

export interface PageStats {
    id: string;
    title: string;
    images: number;
    diagrams: number;
    attachments: number;
    hasError: boolean;
}

/** Calculate stats from page tree */
export function calculateTreeStats(
    rootNode: PageTreeNode,
    selectedIds: Set<string>
): Partial<ExportStats> {
    const allNodes = flattenTree(rootNode);
    const selectedNodes = allNodes.filter(n => selectedIds.has(n.id));
    const errors = allNodes.filter(n => n.error).length;

    return {
        pages: allNodes.length,
        selectedPages: selectedNodes.length,
        errors,
    };
}

/** Extract stats from HTML content */
export function extractContentStats(html: string): {
    images: number;
    diagrams: { drawio: number; gliffy: number; plantuml: number; mermaid: number };
} {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Count images
    const images = doc.querySelectorAll('img, .confluence-embedded-image').length;

    // Count diagrams by type
    const drawio = doc.querySelectorAll(
        '[data-macro-name="drawio"], .drawio-macro, .drawio-diagram'
    ).length;

    const gliffy = doc.querySelectorAll(
        '[data-macro-name="gliffy"], .gliffy-macro, .gliffy-diagram'
    ).length;

    const plantuml = doc.querySelectorAll(
        '[data-macro-name="plantuml"], .plantuml-macro'
    ).length;

    const mermaid = doc.querySelectorAll(
        '[data-macro-name="mermaid"], .mermaid-macro'
    ).length;

    return {
        images,
        diagrams: { drawio, gliffy, plantuml, mermaid },
    };
}

/** Aggregate stats from multiple pages */
export function aggregateStats(pages: PageContentData[]): ExportStats {
    const stats: ExportStats = {
        pages: pages.length,
        selectedPages: pages.length,
        images: 0,
        diagrams: { total: 0, drawio: 0, gliffy: 0, plantuml: 0, mermaid: 0 },
        attachments: 0,
        estimatedSizeMB: 0,
        errors: pages.filter(p => p.error).length,
    };

    for (const page of pages) {
        if (page.error || !page.htmlContent) continue;

        const contentStats = extractContentStats(page.htmlContent);
        stats.images += contentStats.images;
        stats.diagrams.drawio += contentStats.diagrams.drawio;
        stats.diagrams.gliffy += contentStats.diagrams.gliffy;
        stats.diagrams.plantuml += contentStats.diagrams.plantuml;
        stats.diagrams.mermaid += contentStats.diagrams.mermaid;
    }

    stats.diagrams.total =
        stats.diagrams.drawio +
        stats.diagrams.gliffy +
        stats.diagrams.plantuml +
        stats.diagrams.mermaid;

    // Rough size estimate: ~50KB per page + 200KB per image + 100KB per diagram
    stats.estimatedSizeMB = (
        (stats.pages * 50) +
        (stats.images * 200) +
        (stats.diagrams.total * 100)
    ) / 1024;

    return stats;
}

/** Format stats for display */
export function formatStatsDisplay(stats: Partial<ExportStats>): string {
    const parts: string[] = [];

    if (stats.selectedPages !== undefined) {
        parts.push(`📄 ${stats.selectedPages} pages`);
    }

    if (stats.images) {
        parts.push(`🖼️ ${stats.images} images`);
    }

    if (stats.diagrams?.total) {
        const diagramDetails: string[] = [];
        if (stats.diagrams.drawio) diagramDetails.push(`${stats.diagrams.drawio} Draw.io`);
        if (stats.diagrams.gliffy) diagramDetails.push(`${stats.diagrams.gliffy} Gliffy`);
        if (stats.diagrams.plantuml) diagramDetails.push(`${stats.diagrams.plantuml} PlantUML`);
        if (stats.diagrams.mermaid) diagramDetails.push(`${stats.diagrams.mermaid} Mermaid`);

        parts.push(`📊 ${stats.diagrams.total} diagrams (${diagramDetails.join(', ')})`);
    }

    if (stats.estimatedSizeMB) {
        parts.push(`📦 ~${stats.estimatedSizeMB.toFixed(1)} MB`);
    }

    if (stats.errors) {
        parts.push(`⚠️ ${stats.errors} errors`);
    }

    return parts.join(' • ');
}

/** Generate stats HTML for modal */
export function generateStatsHtml(stats: Partial<ExportStats>): string {
    return `
        <div class="md-stats-grid">
            <div class="md-stat-item">
                <span class="md-stat-icon">📄</span>
                <span class="md-stat-value">${stats.selectedPages ?? 0}</span>
                <span class="md-stat-label">Pages</span>
            </div>
            <div class="md-stat-item">
                <span class="md-stat-icon">🖼️</span>
                <span class="md-stat-value">${stats.images ?? 0}</span>
                <span class="md-stat-label">Images</span>
            </div>
            <div class="md-stat-item">
                <span class="md-stat-icon">📊</span>
                <span class="md-stat-value">${stats.diagrams?.total ?? 0}</span>
                <span class="md-stat-label">Diagrams</span>
            </div>
            <div class="md-stat-item">
                <span class="md-stat-icon">📦</span>
                <span class="md-stat-value">${(stats.estimatedSizeMB ?? 0).toFixed(1)}</span>
                <span class="md-stat-label">MB (est.)</span>
            </div>
        </div>
    `;
}
