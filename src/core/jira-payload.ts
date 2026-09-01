/**
 * Jira Sync Payload — schema, parsing, and validation for the
 * "onyx-sync/jira-issues" JSON format.
 *
 * The payload is produced by an external generator and consumed by
 * jira-importer.ts to create/update Jira issues.
 *
 * Validation collects ALL errors into a readable list — it never throws
 * on the first error. Callers branch on `result.ok` without try/catch.
 */

import { SYNC_MARKER_LABEL } from './sync-payload';

// ============================================================================
// Constants
// ============================================================================

/** Re-exported so Jira files have a single import source for the marker. */
export { SYNC_MARKER_LABEL };

/** Expected format identifier. */
export const JIRA_PAYLOAD_FORMAT = 'onyx-sync/jira-issues';

/** Expected schema version. */
export const JIRA_PAYLOAD_VERSION = 1;

/** Default issue type when none is specified. */
export const JIRA_DEFAULT_ISSUE_TYPE = 'Задача';

/** Subtask issue type — used when an issue has a parent. */
export const JIRA_SUBTASK_ISSUE_TYPE = 'Подзадача';

// ============================================================================
// Types
// ============================================================================

/** A single issue in the Jira sync payload. */
export interface JiraPayloadIssue {
    /** Stable LOCAL identifier; only used for parent references inside the payload. */
    readonly id: string;
    /** Issue summary / title (must be non-empty). */
    readonly summary: string;
    /** Issue type name (default "Задача"). */
    readonly issueType?: string;
    /** Jira wiki-markup description (optional). */
    readonly description?: string;
    /** Optional labels to apply (in addition to the marker label). */
    readonly labels?: readonly string[];
    /** Local id of the parent issue in the payload, or null for top-level. */
    readonly parent: string | null;
}

/** Top-level Jira sync payload. */
export interface JiraPayload {
    /** Format identifier; must be "onyx-sync/jira-issues". */
    readonly format: string;
    /** Schema version; must be 1. */
    readonly version: number;
    /** Target Jira project key. */
    readonly project: string;
    /** ISO 8601 timestamp when the payload was generated. */
    readonly generatedAt: string;
    /** Issues to sync. */
    readonly issues: readonly JiraPayloadIssue[];
}

/**
 * Result of parsing a Jira sync payload.
 * Use `result.ok` to discriminate between success and failure.
 */
export type JiraPayloadParseResult =
    | { readonly ok: true; readonly payload: JiraPayload }
    | { readonly ok: false; readonly errors: readonly string[] };

// ============================================================================
// Public API
// ============================================================================

/**
 * Parse and validate a Jira sync payload from a raw (unknown) value.
 *
 * Collects ALL validation errors into a readable list — does not throw on
 * the first error. Returns a discriminated union so callers can branch
 * on `ok` without try/catch.
 */
export function parseJiraPayload(raw: unknown): JiraPayloadParseResult {
    const errors: string[] = [];

    // ── Top-level shape ──────────────────────────────────────────
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
        return { ok: false, errors: ['Payload must be a JSON object.'] };
    }

    const obj = raw as Record<string, unknown>;

    // ── format / version ─────────────────────────────────────────
    const format = obj['format'];
    if (format !== JIRA_PAYLOAD_FORMAT) {
        errors.push(
            `Invalid "format": expected "${JIRA_PAYLOAD_FORMAT}", got ${JSON.stringify(format)}.`
        );
    }

    const version = obj['version'];
    if (typeof version !== 'number' || version !== JIRA_PAYLOAD_VERSION) {
        errors.push(
            `Invalid "version": expected ${JIRA_PAYLOAD_VERSION}, got ${JSON.stringify(version)}.`
        );
    }

    // ── project ──────────────────────────────────────────────────
    const project = obj['project'];
    if (typeof project !== 'string' || project.trim().length === 0) {
        errors.push('Missing or empty "project" key.');
    }

    // ── generatedAt (optional but if present must be a string) ──
    const generatedAt = obj['generatedAt'];
    if (generatedAt !== undefined && typeof generatedAt !== 'string') {
        errors.push('Invalid "generatedAt": expected a string.');
    }

    // ── issues ───────────────────────────────────────────────────
    const issuesRaw = obj['issues'];
    if (!Array.isArray(issuesRaw)) {
        errors.push('Missing or invalid "issues": expected an array.');
        return { ok: false, errors };
    }

    // ── Per-issue validation ─────────────────────────────────────
    const ids = new Set<string>();
    const issueMap = new Map<string, JiraPayloadIssue>();

    for (let i = 0; i < issuesRaw.length; i++) {
        const iss = issuesRaw[i];
        const ctx = `issues[${i}]`;

        if (typeof iss !== 'object' || iss === null || Array.isArray(iss)) {
            errors.push(`${ctx}: must be a JSON object.`);
            continue;
        }

        const rec = iss as Record<string, unknown>;

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

        const summary = rec['summary'];
        if (typeof summary !== 'string' || summary.trim().length === 0) {
            errors.push(`${ctx} (id="${id}"): missing or empty "summary".`);
        }

        const issueType = rec['issueType'];
        if (issueType !== undefined && typeof issueType !== 'string') {
            errors.push(`${ctx} (id="${id}"): "issueType" must be a string.`);
        }

        const description = rec['description'];
        if (description !== undefined && typeof description !== 'string') {
            errors.push(`${ctx} (id="${id}"): "description" must be a string.`);
        }

        const labels = rec['labels'];
        if (labels !== undefined) {
            if (!Array.isArray(labels) || labels.some(l => typeof l !== 'string')) {
                errors.push(`${ctx} (id="${id}"): "labels" must be an array of strings.`);
            }
        }

        const parent = rec['parent'];
        if (parent !== null && typeof parent !== 'string') {
            errors.push(`${ctx} (id="${id}"): "parent" must be a string or null.`);
        } else if (typeof parent === 'string' && parent.length === 0) {
            errors.push(
                `${ctx} (id="${id}"): "parent" must not be an empty string (use null for top-level).`
            );
        }

        // Build a typed issue for later checks (use defaults for invalid fields
        // so we can continue collecting errors).
        issueMap.set(id, {
            id,
            summary: typeof summary === 'string' ? summary : '',
            issueType: typeof issueType === 'string' ? issueType : undefined,
            description: typeof description === 'string' ? description : undefined,
            labels: Array.isArray(labels)
                ? labels.filter((l): l is string => typeof l === 'string')
                : undefined,
            parent: typeof parent === 'string' ? parent : null,
        });
    }

    // ── Parent reference + cycle checks ──────────────────────────
    if (issueMap.size > 0) {
        for (const issue of issueMap.values()) {
            if (issue.parent === null) continue;
            if (!issueMap.has(issue.parent)) {
                errors.push(
                    `Issue "${issue.id}": parent "${issue.parent}" does not exist in payload.`
                );
            }
        }

        // Cycle detection: walk up parent chain from each issue.
        for (const issue of issueMap.values()) {
            const cycle = detectJiraCycle(issue.id, issueMap);
            if (cycle) {
                errors.push(
                    `Issue "${issue.id}": cycle in parent chain (${cycle.join(' → ')}).`
                );
            }
        }
    }

    if (errors.length > 0) {
        return { ok: false, errors };
    }

    // All valid — assemble the typed payload.
    const payload: JiraPayload = {
        format: JIRA_PAYLOAD_FORMAT,
        version: JIRA_PAYLOAD_VERSION,
        project: project as string,
        generatedAt: typeof generatedAt === 'string' ? generatedAt : new Date().toISOString(),
        issues: Array.from(issueMap.values()),
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
export function detectJiraCycle(
    startId: string,
    issueMap: Map<string, JiraPayloadIssue>
): string[] | null {
    const visited = new Set<string>();
    const path: string[] = [];
    let current: string | null = startId;

    while (current !== null) {
        if (visited.has(current)) {
            const cycleStart = path.indexOf(current);
            return path.slice(cycleStart).concat(current);
        }
        visited.add(current);
        path.push(current);

        const issue = issueMap.get(current);
        if (!issue) break;
        current = issue.parent;
    }

    return null;
}

/**
 * Simple whitespace normalization for Jira wiki-markup descriptions.
 *
 * Collapses all whitespace runs to a single space and trims. Does NOT
 * do XML canonicalization (unlike sync-payload's normalizeBody) — wiki
 * markup is plain text, not XHTML.
 *
 * @internal Exported for testing.
 */
export function simpleNormal(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
}
