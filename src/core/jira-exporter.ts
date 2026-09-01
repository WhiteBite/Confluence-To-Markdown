/**
 * Jira Exporter — dumps all issues of a Jira project to a JSON object.
 *
 * `exportJiraIssues(projectKey, onProgress?)` returns an object with the
 * `onyx-sync/jira-export` format, suitable for review or archival.
 *
 * Uses JQL search with pagination via `startAt`/`maxResults`.
 * Uses `fetchJson` from `@/utils/transport` — never raw `fetch`.
 */

import { getBaseUrl } from '@/api/confluence';
import { fetchJson } from '@/utils/transport';
import { ctmError } from '@/utils/logger';

// ============================================================================
// Constants
// ============================================================================

/** Page size for JQL search pagination. */
const PAGE_SIZE = 100;

// ============================================================================
// Types
// ============================================================================

/** A single issue in the export output. */
export interface JiraExportIssue {
    readonly key: string;
    readonly summary: string;
    readonly status: string;
    readonly issueType: string;
    readonly labels: readonly string[];
}

/** Top-level export object. */
export interface JiraExport {
    readonly format: 'onyx-sync/jira-export';
    readonly version: 1;
    readonly project: string;
    readonly exportedAt: string;
    readonly issues: readonly JiraExportIssue[];
}

/** Progress callback for the export phase. */
export type JiraExportProgressCallback = (
    phase: string,
    current: number,
    total: number
) => void;

// ============================================================================
// Public API
// ============================================================================

/**
 * Export all issues of a Jira project to a JSON object.
 *
 * JQL: `project = "KEY" ORDER BY key ASC`, paginated via `startAt`/`maxResults`
 * (100 per page, loop until `startAt >= total`).
 * Fields: `key,summary,status,issuetype,labels`.
 */
export async function exportJiraIssues(
    projectKey: string,
    onProgress?: JiraExportProgressCallback
): Promise<JiraExport> {
    const baseUrl = getBaseUrl();
    const issues: JiraExportIssue[] = [];

    let startAt = 0;
    let total = Infinity;

    onProgress?.('Exporting issues...', 0, 0);

    while (startAt < total) {
        const jql = encodeURIComponent(`project = "${projectKey}" ORDER BY key ASC`);
        const url =
            `${baseUrl}/rest/api/2/search?jql=${jql}` +
            `&fields=key,summary,status,issuetype,labels` +
            `&startAt=${startAt}&maxResults=${PAGE_SIZE}`;

        try {
            const response = await fetchJson<{
                startAt: number;
                maxResults: number;
                total: number;
                issues: Array<{
                    key: string;
                    fields: {
                        summary: string;
                        status?: { name: string };
                        issuetype?: { name: string };
                        labels?: string[];
                    };
                }>;
            }>(url);

            for (const iss of response.issues) {
                issues.push({
                    key: iss.key,
                    summary: iss.fields.summary,
                    status: iss.fields.status?.name ?? '',
                    issueType: iss.fields.issuetype?.name ?? '',
                    labels: iss.fields.labels ?? [],
                });
            }

            total = response.total;
            startAt += response.issues.length;

            onProgress?.('Exporting issues...', issues.length, total);

            // Safety: if a page returns 0 issues, break to avoid infinite loop.
            if (response.issues.length === 0) break;
        } catch (error) {
            ctmError('[JiraExport] Failed to fetch issues:', error);
            throw error;
        }
    }

    return {
        format: 'onyx-sync/jira-export',
        version: 1,
        project: projectKey,
        exportedAt: new Date().toISOString(),
        issues,
    };
}
