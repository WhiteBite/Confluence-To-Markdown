/**
 * Export statistics collection and display
 */

import type { PageTreeNode } from '@/api/types';
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
