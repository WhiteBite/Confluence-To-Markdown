import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { ctmLog } from '@/utils/logger';
import type { TargetFormat } from './diagram-processor';
import type { DiagramInfo } from './sanitizer';
import type { ExportStats } from './export-stats';
import { applyAllRules } from './turndown-rules';

type ExportSummary = Partial<ExportStats>;

// Re-export sanitizer functions for backward compatibility
export {
    sanitizeHtml,
    extractDiagramInfoFromHtml,
    type DiagramInfo,
    type SanitizeOptions,
} from './sanitizer';

let turndownInstance: TurndownService | null = null;
let obsidianTurndownInstance: TurndownService | null = null;
let diagramConvertInstance: TurndownService | null = null;

export interface ConvertOptions {
    useObsidianCallouts?: boolean;
    /** Use Obsidian wikilinks format for images (![[file]]) vs standard markdown (![alt](url)) */
    useWikilinks?: boolean;
    /** Enable diagram conversion */
    convertDiagrams?: boolean;
    /** Target format for diagrams */
    diagramTargetFormat?: TargetFormat;
    /** Embed diagrams as code blocks (vs file references) */
    embedDiagramsAsCode?: boolean;
    /** Diagram export mode */
    diagramExportMode?: 'copy-as-is' | 'convert' | 'svg-preview';
    /** @deprecated Alias for diagramExportMode */
    exportMode?: 'copy-as-is' | 'convert' | 'svg-preview';
    /** Pre-extracted diagram info (extracted before sanitization) */
    diagramInfo?: DiagramInfo[];
    /** Optional export diagnostics summary (used by exporter flows) */
    summary?: ExportSummary;
}

/** Get configured Turndown instance */
function getTurndown(options?: ConvertOptions): TurndownService {
    const useObsidian = options?.useObsidianCallouts ?? false;
    const convertDiagrams = options?.convertDiagrams ?? false;
    const summary = options?.summary;

    ctmLog('[Converter] getTurndown called with options:', {
        useObsidian,
        useWikilinks: options?.useWikilinks ?? true,
        convertDiagrams,
        diagramTarget: options?.diagramTargetFormat ?? 'mermaid',
        embedAsCode: options?.embedDiagramsAsCode ?? true,
        exportMode: options?.diagramExportMode ?? options?.exportMode ?? 'copy-as-is',
        rawExportMode: options?.diagramExportMode,
    });

    // Return cached instance if available (simplified caching)
    // IMPORTANT: when collecting export summary, rules must close over the current summary object.
    // So we bypass caching when summary is provided.
    if (!summary) {
        if (useObsidian && !convertDiagrams && obsidianTurndownInstance)
            return obsidianTurndownInstance;
        if (!useObsidian && !convertDiagrams && turndownInstance) return turndownInstance;
        if (convertDiagrams && diagramConvertInstance) return diagramConvertInstance;
    }

    const instance = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        bulletListMarker: '-',
        emDelimiter: '*',
    });

    // Add GFM support (tables, strikethrough, task lists)
    instance.use(gfm);

    // Apply all custom rules
    applyAllRules(instance, options);

    // Cache the instance (simplified - diagram conversion creates new instance each time)
    if (convertDiagrams) {
        diagramConvertInstance = instance;
    } else if (useObsidian) {
        obsidianTurndownInstance = instance;
    } else {
        turndownInstance = instance;
    }

    return instance;
}

/** Convert sanitized HTML to Markdown */
export function convertToMarkdown(html: string, options?: ConvertOptions): string {
    if (!html) return '';
    const turndown = getTurndown(options);
    return turndown.turndown(html);
}
