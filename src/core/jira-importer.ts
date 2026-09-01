/**
 * Jira Sync Importer — plans and applies a Jira sync payload to a Jira project.
 *
 * Plan phase (`planJiraSync`):
 *   1. Fetch all existing issues of the target project with the `onyx-sync`
 *      label (JQL search, paginated).
 *   2. For each payload issue (parents-first), determine action:
 *      create / update / skip.
 *
 * Apply phase (`applyJiraSync`):
 *   1. For each selected row (parents-first), create or update the issue.
 *   2. Apply labels (including the marker label `onyx-sync`).
 *   3. Retry on rate-limit (429), honoring Retry-After.
 *   4. Return a structured report.
 *
 * Uses `transportRequest` / `fetchJson` from `@/utils/transport` — never
 * calls raw `fetch` directly.
 */

import { getBaseUrl } from '@/api/confluence';
import { fetchJson, transportRequest } from '@/utils/transport';
import { ctmLog, ctmError } from '@/utils/logger';
import { ConfluenceApiError } from '@/api/errors';
import {
    SYNC_MARKER_LABEL,
    JIRA_DEFAULT_ISSUE_TYPE,
    JIRA_SUBTASK_ISSUE_TYPE,
    simpleNormal,
    type JiraPayload,
    type JiraPayloadIssue,
} from './jira-payload';

// ============================================================================
// Constants
// ============================================================================

const RETRY_DELAY_MS = 2_000;

/** XSRF header required on all POST/PUT to Jira Server. */
const JIRA_JSON_HEADERS = {
    'Content-Type': 'application/json',
    'X-Atlassian-Token': 'no-check',
};

// ============================================================================
// Types
// ============================================================================

/** A single row in the Jira sync plan. */
export interface JiraPlanRow {
    readonly localId: string;
    readonly title: string;
    readonly parentLocalId: string | null;
    readonly action: 'create' | 'update' | 'skip';
    readonly existingKey?: string;
}

/** Result of the plan phase. */
export interface JiraPlan {
    readonly project: string;
    readonly rows: readonly JiraPlanRow[];
}

/** Progress callback for both plan and apply phases. */
export type JiraProgressCallback = (
    phase: string,
    current: number,
    total: number
) => void;

/** Result of the apply phase. */
export interface JiraReport {
    readonly project: string;
    readonly appliedAt: string;
    readonly created: ReadonlyArray<{
        readonly localId: string;
        readonly pageId: string;
        readonly title: string;
    }>;
    readonly updated: ReadonlyArray<{
        readonly localId: string;
        readonly pageId: string;
        readonly title: string;
    }>;
    readonly skipped: ReadonlyArray<{
        readonly localId: string;
        readonly title: string;
    }>;
    readonly failed: ReadonlyArray<{
        readonly localId: string;
        readonly title: string;
        readonly error: string;
    }>;
    readonly warnings: ReadonlyArray<{
        readonly localId: string;
        readonly title: string;
        readonly warning: string;
    }>;
}

// ============================================================================
// Plan phase
// ============================================================================

/**
 * Compute a Jira sync plan for the given payload.
 *
 * Fetches all existing issues of the target project that have the
 * `onyx-sync` label (via JQL search) and determines the action for each
 * payload issue: create, update, or skip.
 *
 * Description normalization: collapse whitespace + trim (simpleNormal).
 * False "differs" is acceptable, false "equal" is not.
 */
export async function planJiraSync(
    payload: JiraPayload,
    onProgress?: JiraProgressCallback
): Promise<JiraPlan> {
    const baseUrl = getBaseUrl();

    onProgress?.('Fetching existing issues...', 0, 1);
    const existingIssues = await fetchExistingIssues(baseUrl, payload.project);
    onProgress?.('Fetching existing issues...', 1, 1);

    // Build a normalized-summary → existing-issue index for quick lookup.
    // If multiple issues share a summary, the first one wins.
    const existingBySummary = new Map<
        string,
        { key: string; description: string }
    >();
    for (const iss of existingIssues) {
        const norm = simpleNormal(iss.summary);
        if (!existingBySummary.has(norm)) {
            existingBySummary.set(norm, iss);
        }
    }

    // Order payload issues parents-first.
    const ordered = orderIssuesParentsFirst(payload.issues);

    const rows: JiraPlanRow[] = [];
    for (const issue of ordered) {
        const normSummary = simpleNormal(issue.summary);
        const existing = existingBySummary.get(normSummary);
        if (!existing) {
            rows.push({
                localId: issue.id,
                title: issue.summary,
                parentLocalId: issue.parent,
                action: 'create',
            });
            continue;
        }

        const existingDesc = existing.description ?? '';
        const payloadDesc = issue.description ?? '';
        const sameDesc = simpleNormal(payloadDesc) === simpleNormal(existingDesc);
        if (sameDesc) {
            rows.push({
                localId: issue.id,
                title: issue.summary,
                parentLocalId: issue.parent,
                action: 'skip',
                existingKey: existing.key,
            });
        } else {
            rows.push({
                localId: issue.id,
                title: issue.summary,
                parentLocalId: issue.parent,
                action: 'update',
                existingKey: existing.key,
            });
        }
    }

    return { project: payload.project, rows };
}

// ============================================================================
// Apply phase
// ============================================================================

/**
 * Apply a Jira sync plan: create/update selected issues in Jira.
 *
 * Issues are processed parents-first. If an issue's parent was not applied
 * or resolved (i.e., its Jira key is unknown), the issue is failed with a
 * clear error rather than being orphaned.
 */
export async function applyJiraSync(
    payload: JiraPayload,
    plan: JiraPlan,
    selectedLocalIds: ReadonlySet<string>,
    onProgress?: JiraProgressCallback
): Promise<JiraReport> {
    const baseUrl = getBaseUrl();
    const project = payload.project;

    const created: Array<{ localId: string; pageId: string; title: string }> = [];
    const updated: Array<{ localId: string; pageId: string; title: string }> = [];
    const failed: Array<{ localId: string; title: string; error: string }> = [];
    const warnings: Array<{
        localId: string;
        title: string;
        warning: string;
    }> = [];

    // Pre-populate id mapping for all skip and update rows (their existing
    // Jira keys are known from the plan, regardless of selection).
    const idMapping = new Map<string, string>();
    for (const row of plan.rows) {
        if ((row.action === 'skip' || row.action === 'update') && row.existingKey) {
            idMapping.set(row.localId, row.existingKey);
        }
    }

    // Build a lookup from localId → payload issue.
    const issueMap = new Map<string, JiraPayloadIssue>();
    for (const iss of payload.issues) {
        issueMap.set(iss.id, iss);
    }

    // Order rows parents-first (same as plan).
    const orderedRows = orderJiraRowsParentsFirst(plan.rows);

    // Filter to rows that need applying (selected + create/update).
    const applicableRows = orderedRows.filter(
        r =>
            selectedLocalIds.has(r.localId) &&
            (r.action === 'create' || r.action === 'update')
    );

    onProgress?.('Applying changes...', 0, applicableRows.length);

    let processed = 0;
    for (const row of applicableRows) {
        onProgress?.('Applying changes...', processed, applicableRows.length);
        processed++;

        const issue = issueMap.get(row.localId);
        if (!issue) {
            failed.push({
                localId: row.localId,
                title: row.title,
                error: 'Issue not found in payload.',
            });
            continue;
        }

        // Resolve parent Jira key.
        let parentKey: string | null = null;
        if (row.parentLocalId !== null) {
            const resolved = idMapping.get(row.parentLocalId);
            if (!resolved) {
                failed.push({
                    localId: row.localId,
                    title: row.title,
                    error: `Parent "${row.parentLocalId}" was not applied or resolved.`,
                });
                continue;
            }
            parentKey = resolved;
        }

        try {
            let issueKey: string;
            if (row.action === 'create') {
                issueKey = await createIssue(
                    baseUrl,
                    project,
                    issue,
                    parentKey
                );
                idMapping.set(row.localId, issueKey);
                created.push({ localId: row.localId, pageId: issueKey, title: issue.summary });
                ctmLog(`[JiraSync] Created: ${issue.summary} (${issueKey})`);
            } else {
                // update
                issueKey = row.existingKey!;
                await updateIssue(baseUrl, issueKey, issue);
                updated.push({ localId: row.localId, pageId: issueKey, title: issue.summary });
                ctmLog(`[JiraSync] Updated: ${issue.summary} (${issueKey})`);
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            failed.push({ localId: row.localId, title: row.title, error: msg });
            ctmError(`[JiraSync] Failed to ${row.action} "${issue.summary}":`, error);
        }
    }

    onProgress?.('Applying changes...', applicableRows.length, applicableRows.length);

    // Build skipped list: every plan row not in created/updated/failed.
    const processedIds = new Set<string>();
    for (const c of created) processedIds.add(c.localId);
    for (const u of updated) processedIds.add(u.localId);
    for (const f of failed) processedIds.add(f.localId);

    const skipped: Array<{ localId: string; title: string }> = [];
    for (const row of plan.rows) {
        if (!processedIds.has(row.localId)) {
            skipped.push({ localId: row.localId, title: row.title });
        }
    }

    return {
        project,
        appliedAt: new Date().toISOString(),
        created,
        updated,
        skipped,
        failed,
        warnings,
    };
}

// ============================================================================
// REST API helpers
// ============================================================================

interface ExistingIssue {
    key: string;
    summary: string;
    description: string;
}

/**
 * Fetch all existing issues of a project that have the `onyx-sync` label.
 *
 * Uses JQL search with `fields=key,summary,description,labels` and paginates
 * via `startAt`/`maxResults` (loop while `startAt + results < total`).
 *
 * @internal Exported for testing.
 */
export async function fetchExistingIssues(
    baseUrl: string,
    projectKey: string
): Promise<ExistingIssue[]> {
    const issues: ExistingIssue[] = [];
    let startAt = 0;
    const maxResults = 100;
    let total = Infinity;

    while (startAt < total) {
        const jql = encodeURIComponent(
            `project = "${projectKey}" AND labels = "${SYNC_MARKER_LABEL}" ORDER BY key ASC`
        );
        const url =
            `${baseUrl}/rest/api/2/search?jql=${jql}` +
            `&fields=key,summary,description,labels&startAt=${startAt}&maxResults=${maxResults}`;

        const response = await fetchJson<{
            startAt: number;
            maxResults: number;
            total: number;
            issues: Array<{
                key: string;
                fields: {
                    summary: string;
                    description?: string;
                    labels?: string[];
                };
            }>;
        }>(url);

        for (const iss of response.issues) {
            issues.push({
                key: iss.key,
                summary: iss.fields.summary,
                description: iss.fields.description ?? '',
            });
        }

        total = response.total;
        startAt += response.issues.length;

        // Safety: if a page returns 0 issues, break to avoid infinite loop.
        if (response.issues.length === 0) break;
    }

    return issues;
}

/**
 * Create an issue in Jira via `POST /rest/api/2/issue`.
 * Retries once on rate-limit (429), honoring Retry-After.
 *
 * If `parentKey` is provided, sets `fields.parent` and forces the issue type
 * to the subtask type (`Подзадача`).
 *
 * @internal Exported for testing.
 */
export async function createIssue(
    baseUrl: string,
    projectKey: string,
    issue: JiraPayloadIssue,
    parentKey: string | null,
    retries = 1
): Promise<string> {
    const isSubtask = parentKey !== null;
    const issueType = isSubtask
        ? JIRA_SUBTASK_ISSUE_TYPE
        : (issue.issueType ?? JIRA_DEFAULT_ISSUE_TYPE);

    const labels = [...new Set([...(issue.labels ?? []), SYNC_MARKER_LABEL])];

    const fields: Record<string, unknown> = {
        project: { key: projectKey },
        summary: issue.summary,
        issuetype: { name: issueType },
        labels,
    };

    if (issue.description !== undefined) {
        fields['description'] = issue.description;
    }

    if (parentKey) {
        fields['parent'] = { key: parentKey };
    }

    try {
        const result = await transportRequest<{ key: string }>({
            url: `${baseUrl}/rest/api/2/issue`,
            method: 'POST',
            headers: JIRA_JSON_HEADERS,
            body: JSON.stringify({ fields }),
        });
        return result.key;
    } catch (error) {
        if (retries > 0 && isRateLimited(error)) {
            const delay = getRetryDelay(error);
            ctmLog(
                `[JiraSync] Rate limited creating "${issue.summary}", retrying in ${delay}ms`
            );
            await sleep(delay);
            return createIssue(baseUrl, projectKey, issue, parentKey, retries - 1);
        }
        throw error;
    }
}

/**
 * Update an issue in Jira via `PUT /rest/api/2/issue/{key}`.
 * Updates summary, description, and labels. Retries once on rate-limit (429).
 *
 * @internal Exported for testing.
 */
export async function updateIssue(
    baseUrl: string,
    issueKey: string,
    issue: JiraPayloadIssue,
    retries = 1
): Promise<void> {
    const labels = [...new Set([...(issue.labels ?? []), SYNC_MARKER_LABEL])];

    const fields: Record<string, unknown> = {
        summary: issue.summary,
        labels,
    };

    if (issue.description !== undefined) {
        fields['description'] = issue.description;
    }

    try {
        await transportRequest<unknown>({
            url: `${baseUrl}/rest/api/2/issue/${issueKey}`,
            method: 'PUT',
            headers: JIRA_JSON_HEADERS,
            body: JSON.stringify({ fields }),
        });
    } catch (error) {
        if (retries > 0 && isRateLimited(error)) {
            const delay = getRetryDelay(error);
            ctmLog(
                `[JiraSync] Rate limited updating "${issue.summary}", retrying in ${delay}ms`
            );
            await sleep(delay);
            return updateIssue(baseUrl, issueKey, issue, retries - 1);
        }
        throw error;
    }
}

// ============================================================================
// Ordering helpers
// ============================================================================

/**
 * Order payload issues parents-first (topological by parent reference).
 *
 * @internal Exported for testing.
 */
export function orderIssuesParentsFirst(
    issues: readonly JiraPayloadIssue[]
): JiraPayloadIssue[] {
    const issueMap = new Map<string, JiraPayloadIssue>();
    for (const iss of issues) {
        issueMap.set(iss.id, iss);
    }

    const depthMemo = new Map<string, number>();

    const depth = (id: string): number => {
        if (depthMemo.has(id)) return depthMemo.get(id)!;
        const issue = issueMap.get(id);
        if (!issue || issue.parent === null) {
            depthMemo.set(id, 0);
            return 0;
        }
        depthMemo.set(id, Number.MAX_SAFE_INTEGER);
        const d = depth(issue.parent) + 1;
        depthMemo.set(id, d);
        return d;
    };

    return [...issues].sort((a, b) => depth(a.id) - depth(b.id));
}

/**
 * Order plan rows parents-first (topological by parentLocalId reference).
 *
 * @internal Exported for testing.
 */
export function orderJiraRowsParentsFirst(rows: readonly JiraPlanRow[]): JiraPlanRow[] {
    const rowMap = new Map<string, JiraPlanRow>();
    for (const r of rows) {
        rowMap.set(r.localId, r);
    }

    const depthMemo = new Map<string, number>();

    const depth = (id: string): number => {
        if (depthMemo.has(id)) return depthMemo.get(id)!;
        const row = rowMap.get(id);
        if (!row || row.parentLocalId === null) {
            depthMemo.set(id, 0);
            return 0;
        }
        depthMemo.set(id, Number.MAX_SAFE_INTEGER);
        const d = depth(row.parentLocalId) + 1;
        depthMemo.set(id, d);
        return d;
    };

    return [...rows].sort((a, b) => depth(a.localId) - depth(b.localId));
}

// ============================================================================
// Helpers
// ============================================================================

function isRateLimited(error: unknown): boolean {
    return error instanceof ConfluenceApiError && error.category === 'rate_limited';
}

function getRetryDelay(error: unknown): number {
    if (error instanceof ConfluenceApiError && error.retryAfterMs !== undefined) {
        return error.retryAfterMs;
    }
    return RETRY_DELAY_MS;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
