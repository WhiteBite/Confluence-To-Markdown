/**
 * Sync Payload — schema, parsing, and validation for the
 * "onyx-sync/confluence-pages" JSON format.
 *
 * The payload is produced by an external generator and consumed by
 * sync-importer.ts to create/update Confluence pages.
 *
 * Validation collects ALL errors into a readable list — it never throws
 * on the first error. Callers branch on `result.ok` without try/catch.
 */

// ============================================================================
// Constants
// ============================================================================

/** Marker label always applied by the importer to every synced page. */
export const SYNC_MARKER_LABEL = 'onyx-sync';

/** Expected format identifier. */
export const SYNC_PAYLOAD_FORMAT = 'onyx-sync/confluence-pages';

/** Expected schema version. */
export const SYNC_PAYLOAD_VERSION = 1;

// ============================================================================
// Types
// ============================================================================

/** A single page in the sync payload. */
export interface SyncPayloadPage {
    /** Stable LOCAL identifier; only used for parent references inside the payload. */
    readonly id: string;
    /** Page title (must be non-empty). */
    readonly title: string;
    /** Local id of the parent page in the payload, or null for space root. */
    readonly parent: string | null;
    /** Optional labels to apply (in addition to the marker label). */
    readonly labels?: readonly string[];
    /** Confluence storage-format XHTML body (must be non-empty). */
    readonly storage: string;
}

/** Top-level sync payload. */
export interface SyncPayload {
    /** Format identifier; must be "onyx-sync/confluence-pages". */
    readonly format: string;
    /** Schema version; must be 1. */
    readonly version: number;
    /** Target Confluence space key. */
    readonly space: string;
    /** ISO 8601 timestamp when the payload was generated. */
    readonly generatedAt: string;
    /** Pages to sync. */
    readonly pages: readonly SyncPayloadPage[];
}

/**
 * Result of parsing a sync payload.
 * Use `result.ok` to discriminate between success and failure.
 */
export type SyncPayloadParseResult =
    | { readonly ok: true; readonly payload: SyncPayload }
    | { readonly ok: false; readonly errors: readonly string[] };

// ============================================================================
// Public API
// ============================================================================

/**
 * Parse and validate a sync payload from a raw (unknown) value.
 *
 * Collects ALL validation errors into a readable list — does not throw on
 * the first error. Returns a discriminated union so callers can branch
 * on `ok` without try/catch.
 */
export function parseSyncPayload(raw: unknown): SyncPayloadParseResult {
    const errors: string[] = [];

    // ── Top-level shape ──────────────────────────────────────────
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        return { ok: false, errors: ['Payload must be a JSON object.'] };
    }

    const obj = raw as Record<string, unknown>;

    // ── format / version ─────────────────────────────────────────
    const format = obj['format'];
    if (format !== SYNC_PAYLOAD_FORMAT) {
        errors.push(
            `Invalid "format": expected "${SYNC_PAYLOAD_FORMAT}", got ${JSON.stringify(format)}.`
        );
    }

    const version = obj['version'];
    if (typeof version !== 'number' || version !== SYNC_PAYLOAD_VERSION) {
        errors.push(
            `Invalid "version": expected ${SYNC_PAYLOAD_VERSION}, got ${JSON.stringify(version)}.`
        );
    }

    // ── space ────────────────────────────────────────────────────
    const space = obj['space'];
    if (typeof space !== 'string' || space.trim().length === 0) {
        errors.push('Missing or empty "space" key.');
    }

    // ── generatedAt (optional but if present must be a string) ──
    const generatedAt = obj['generatedAt'];
    if (generatedAt !== undefined && typeof generatedAt !== 'string') {
        errors.push('Invalid "generatedAt": expected a string.');
    }

    // ── pages ────────────────────────────────────────────────────
    const pagesRaw = obj['pages'];
    if (!Array.isArray(pagesRaw)) {
        errors.push('Missing or invalid "pages": expected an array.');
        return { ok: false, errors };
    }

    // ── Per-page validation ──────────────────────────────────────
    const ids = new Set<string>();
    const pageMap = new Map<string, SyncPayloadPage>();

    for (let i = 0; i < pagesRaw.length; i++) {
        const p = pagesRaw[i];
        const ctx = `pages[${i}]`;

        if (typeof p !== 'object' || p === null || Array.isArray(p)) {
            errors.push(`${ctx}: must be a JSON object.`);
            continue;
        }

        const rec = p as Record<string, unknown>;

        const id = rec['id'];
        if (typeof id !== 'string' || id.length === 0) {
            errors.push(`${ctx}: missing or empty "id".`);
            continue; // can't check further without id
        }
        if (ids.has(id)) {
            errors.push(`${ctx}: duplicate id "${id}".`);
            continue;
        }
        ids.add(id);

        const title = rec['title'];
        if (typeof title !== 'string' || title.trim().length === 0) {
            errors.push(`${ctx} (id="${id}"): missing or empty "title".`);
        }

        const storage = rec['storage'];
        if (typeof storage !== 'string' || storage.trim().length === 0) {
            errors.push(`${ctx} (id="${id}"): missing or empty "storage".`);
        }

        const parent = rec['parent'];
        if (parent !== null && typeof parent !== 'string') {
            errors.push(`${ctx} (id="${id}"): "parent" must be a string or null.`);
        } else if (typeof parent === 'string' && parent.length === 0) {
            errors.push(
                `${ctx} (id="${id}"): "parent" must not be an empty string (use null for space root).`
            );
        }

        const labels = rec['labels'];
        if (labels !== undefined) {
            if (!Array.isArray(labels) || labels.some(l => typeof l !== 'string')) {
                errors.push(`${ctx} (id="${id}"): "labels" must be an array of strings.`);
            }
        }

        // Build a typed page for later checks (use defaults for invalid fields
        // so we can continue collecting errors).
        pageMap.set(id, {
            id,
            title: typeof title === 'string' ? title : '',
            parent: typeof parent === 'string' ? parent : null,
            labels: Array.isArray(labels)
                ? labels.filter((l): l is string => typeof l === 'string')
                : undefined,
            storage: typeof storage === 'string' ? storage : '',
        });
    }

    // ── Parent reference + cycle checks ──────────────────────────
    if (pageMap.size > 0) {
        for (const page of pageMap.values()) {
            if (page.parent === null) continue;
            if (!pageMap.has(page.parent)) {
                errors.push(
                    `Page "${page.id}": parent "${page.parent}" does not exist in payload.`
                );
            }
        }

        // Cycle detection: walk up parent chain from each page.
        for (const page of pageMap.values()) {
            const cycle = detectCycle(page.id, pageMap);
            if (cycle) {
                errors.push(
                    `Page "${page.id}": cycle in parent chain (${cycle.join(' → ')}).`
                );
            }
        }
    }

    if (errors.length > 0) {
        return { ok: false, errors };
    }

    // All valid — assemble the typed payload.
    const payload: SyncPayload = {
        format: SYNC_PAYLOAD_FORMAT,
        version: SYNC_PAYLOAD_VERSION,
        space: space as string,
        generatedAt: typeof generatedAt === 'string' ? generatedAt : new Date().toISOString(),
        pages: Array.from(pageMap.values()),
    };

    return { ok: true, payload };
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Walk up the parent chain from `startId`. Returns the cycle path if a
 * cycle is detected, or null if the chain terminates at a root.
 *
 * @internal Exported for testing.
 */
export function detectCycle(
    startId: string,
    pageMap: Map<string, SyncPayloadPage>
): string[] | null {
    const visited = new Set<string>();
    const path: string[] = [];
    let current: string | null = startId;

    while (current !== null) {
        if (visited.has(current)) {
            // Found a cycle — extract the cycle portion of the path.
            const cycleStart = path.indexOf(current);
            return path.slice(cycleStart).concat(current);
        }
        visited.add(current);
        path.push(current);

        const page = pageMap.get(current);
        if (!page) break; // unknown parent — already reported separately
        current = page.parent;
    }

    return null;
}

/**
 * Normalize a Confluence storage body for comparison.
 *
 * Steps:
 *   1. Strip server-generated macro attributes — Confluence adds
 *      `ac:schema-version` and a random per-save `ac:macro-id` UUID to every
 *      structured macro on save, so a stored body never byte-matches the
 *      payload it was created from.
 *   2. Collapse all whitespace runs to a single space and trim.
 *
 * False "differs" is acceptable (extra updates are harmless); false "equal"
 * is not (would skip a page that needs updating).
 *
 * @internal Exported for testing.
 */
export function normalizeBody(body: string): string {
    const stripped = body
        .replace(/\s+ac:schema-version="[^"]*"/g, '')
        .replace(/\s+ac:macro-id="[^"]*"/g, '');
    return canonicalizeStorage(stripped);
}

/**
 * Canonicalize storage-format XHTML so semantically identical bodies compare
 * equal regardless of server-side normalization.
 *
 * On save, Confluence reorders `<ac:parameter>` children of a
 * `<ac:structured-macro>` alphabetically (observed on Server 8.5). Content
 * order of everything else is significant and preserved.
 *
 * Canonical form: attributes sorted by name; macro parameters sorted by
 * `ac:name` (emitted before other macro children, matching server output);
 * all whitespace collapsed.
 *
 * Falls back to plain whitespace normalization when DOMParser is unavailable
 * or the body is not well-formed XML.
 */
function canonicalizeStorage(body: string): string {
    if (typeof DOMParser === 'undefined') {
        return body.replace(/\s+/g, ' ').trim();
    }
    try {
        // Storage fragments use ac:/ri: prefixes without declaring them;
        // wrap in a root element that declares both to make it valid XML.
        const wrapped =
            `<root xmlns:ac="http://atlassian.com/macros" xmlns:ri="http://atlassian.com/resource-identifier">${body}</root>`;
        const doc = new DOMParser().parseFromString(wrapped, 'text/xml');
        if (doc.querySelector('parsererror')) {
            return body.replace(/\s+/g, ' ').trim();
        }
        // Serialize the wrapper's children only — the wrapper itself is
        // scaffolding and must not leak into the comparison.
        return Array.from(doc.documentElement.childNodes)
            .map(serializeCanonical)
            .join('')
            .replace(/\s+/g, ' ')
            .trim();
    } catch {
        return body.replace(/\s+/g, ' ').trim();
    }
}

function serializeCanonical(node: Node): string {
    // Text and CDATA nodes contribute their raw character data.
    if (node.nodeType === 3 || node.nodeType === 4) {
        return node.textContent ?? '';
    }
    if (node.nodeType !== 1) return '';

    const el = node as Element;
    const attrs = Array.from(el.attributes)
        .map(a => `${a.name}=${a.value}`)
        .sort()
        .join(' ');

    let children = Array.from(el.childNodes);
    if (el.tagName === 'ac:structured-macro') {
        const isParam = (n: Node): boolean =>
            n.nodeType === 1 && (n as Element).tagName === 'ac:parameter';
        const params = children
            .filter(isParam)
            .sort((a, b) =>
                ((a as Element).getAttribute('ac:name') ?? '').localeCompare(
                    (b as Element).getAttribute('ac:name') ?? ''
                )
            );
        const rest = children.filter(n => !isParam(n));
        children = [...params, ...rest];
    }

    const inner = children.map(serializeCanonical).join('');
    return `<${el.tagName} ${attrs}>${inner}</${el.tagName}>`;
}
