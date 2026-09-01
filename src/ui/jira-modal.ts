/**
 * Jira Modal — UI for exporting and applying Jira issue sync payloads.
 *
 * Two modes:
 *   - Export: dump project issues to JSON (download `<project>-jira-export.json`)
 *   - Apply: create/update issues from a JSON payload (review + report)
 *
 * Mirrors the structure/state machine of sync-modal.ts with a top-level
 * mode toggle (Export | Apply).
 */

import { parseJiraPayload, type JiraPayload } from '@/core/jira-payload';
import {
    planJiraSync,
    applyJiraSync,
    type JiraPlan,
    type JiraReport,
} from '@/core/jira-importer';
import { exportJiraIssues, type JiraExport } from '@/core/jira-exporter';
import { ctmLog, ctmError } from '@/utils/logger';

// ============================================================================
// Constants
// ============================================================================

const MODAL_ID = 'md-jira-modal';

// ============================================================================
// State
// ============================================================================

interface JiraModalState {
    mode: 'export' | 'apply';
    // Apply mode state
    file: File | null;
    payload: JiraPayload | null;
    parseErrors: string[];
    phase: 'pick' | 'review' | 'applying' | 'done';
    projectKey: string;
    plan: JiraPlan | null;
    planError: string | null;
    planning: boolean;
    report: JiraReport | null;
    // Export mode state
    exportProjectKey: string;
    exporting: boolean;
    exportError: string | null;
    exportResult: JiraExport | null;
}

let state: JiraModalState = createInitialState();

function createInitialState(): JiraModalState {
    return {
        mode: 'export',
        file: null,
        payload: null,
        parseErrors: [],
        phase: 'pick',
        projectKey: '',
        plan: null,
        planError: null,
        planning: false,
        report: null,
        exportProjectKey: '',
        exporting: false,
        exportError: null,
        exportResult: null,
    };
}

// ============================================================================
// Public API
// ============================================================================

/** Open the Jira modal */
export function showJiraModal(): void {
    state = createInitialState();
    renderJiraModal();
}

/** Close the Jira modal */
export function closeJiraModal(): void {
    const el = document.getElementById(MODAL_ID);
    if (el) el.remove();
}

// ============================================================================
// Render
// ============================================================================

function renderJiraModal(): void {
    closeJiraModal();

    const overlay = document.createElement('div');
    overlay.id = MODAL_ID;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Jira Sync');
    overlay.style.cssText = `
        position:fixed;inset:0;background:rgba(9,30,66,0.54);
        backdrop-filter:blur(2px);z-index:10000;display:flex;
        justify-content:center;align-items:center;padding:1.5rem;
        box-sizing:border-box;font-family:var(--md-font);
        animation:fadeIn 0.2s ease;
    `;

    applyTheme(overlay);

    const content = document.createElement('div');
    content.className = 'md-modal-content';
    content.style.cssText = `
        width:42rem;max-width:95vw;height:auto;max-height:90vh;
        display:flex;flex-direction:column;overflow:hidden;
    `;

    content.innerHTML = buildHeader();
    content.innerHTML += buildBody();

    overlay.appendChild(content);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeJiraModal();
    });

    document.body.appendChild(overlay);
    attachEventListeners();
}

function applyTheme(overlay: HTMLElement): void {
    const isDark =
        document.documentElement.getAttribute('data-color-mode') === 'dark' ||
        document.body.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (isDark) overlay.setAttribute('data-theme', 'dark');
}

function buildHeader(): string {
    return `
        <div class="md-modal-header">
            <div class="md-header-title">
                <h3>Jira Sync</h3>
            </div>
            <div class="md-header-actions">
                <button class="md-btn-icon" id="md-jira-close" title="Close">
                    <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>
            </div>
        </div>
    `;
}

function buildBody(): string {
    // Mode toggle is always visible except during applying phase
    const showToggle = state.phase !== 'applying';
    const toggle = showToggle ? buildModeToggle() : '';

    const body = state.mode === 'export' ? buildExportBody() : buildApplyBody();

    return toggle + body;
}

function buildModeToggle(): string {
    const exportActive = state.mode === 'export' ? 'active' : '';
    const applyActive = state.mode === 'apply' ? 'active' : '';
    const disabled = state.phase === 'applying' ? 'disabled' : '';

    return `
        <div style="display:flex;gap:0.25rem;padding:0.75rem 1.25rem 0;border-bottom:1px solid var(--md-border);">
            <button class="md-segment ${exportActive}" id="md-jira-mode-export" ${disabled}
                style="padding:0.375rem 1rem;border-radius:var(--md-radius);border:1px solid var(--md-border);
                background:${exportActive ? 'var(--md-primary)' : 'var(--md-bg)'};
                color:${exportActive ? '#fff' : 'var(--md-text-subtle)'};
                cursor:pointer;font-size:0.8125rem;font-weight:500;font-family:var(--md-font);">
                Export
            </button>
            <button class="md-segment ${applyActive}" id="md-jira-mode-apply" ${disabled}
                style="padding:0.375rem 1rem;border-radius:var(--md-radius);border:1px solid var(--md-border);
                background:${applyActive ? 'var(--md-primary)' : 'var(--md-bg)'};
                color:${applyActive ? '#fff' : 'var(--md-text-subtle)'};
                cursor:pointer;font-size:0.8125rem;font-weight:500;font-family:var(--md-font);">
                Apply
            </button>
        </div>
    `;
}

// ============================================================================
// Export mode
// ============================================================================

function buildExportBody(): string {
    if (state.exporting) {
        return buildExportProgress();
    }

    if (state.exportResult) {
        return buildExportDone();
    }

    let errorBlock = '';
    if (state.exportError) {
        errorBlock = `
            <div style="background:var(--md-danger-light);border-radius:var(--md-radius);padding:0.75rem;margin-top:0.5rem;">
                <div style="font-size:0.75rem;color:var(--md-danger);">
                    ${escapeHtml(state.exportError)}
                </div>
            </div>
        `;
    }

    return `
        <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem;">
            <p style="font-size:0.8125rem;color:var(--md-text-subtle);margin:0;line-height:1.4;">
                Export all issues from a Jira project to a JSON file
                (<code>onyx-sync/jira-export</code> format). The export includes
                issue keys, summaries, statuses, types, and labels.
            </p>
            <div class="md-settings-section">
                <div class="md-settings-title">Project</div>
                <label style="font-size:0.8125rem;color:var(--md-text-subtle);">
                    Project Key
                    <input id="md-jira-export-project" type="text"
                        value="${escapeHtml(state.exportProjectKey)}"
                        placeholder="e.g. ONYX"
                        style="display:block;width:100%;margin-top:0.25rem;padding:0.375rem 0.5rem;
                        border:1px solid var(--md-border);border-radius:var(--md-radius);
                        font-size:0.8125rem;font-family:var(--md-font);
                        background:var(--md-bg);color:var(--md-text);box-sizing:border-box;" />
                </label>
            </div>
            ${errorBlock}
            <div style="display:flex;justify-content:flex-end;padding-top:0.5rem;">
                <button class="md-btn md-btn-primary" id="md-jira-export-start">Export</button>
            </div>
        </div>
    `;
}

function buildExportProgress(): string {
    return `
        <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem;align-items:center;justify-content:center;min-height:10rem;">
            <div style="font-size:0.875rem;color:var(--md-text);font-weight:500;" id="md-jira-phase-label">
                Exporting issues...
            </div>
            <div style="width:100%;">
                <div class="md-progress-bar" style="height:0.375rem;">
                    <div class="md-progress-fill" id="md-jira-progress-fill" style="width:0%;"></div>
                </div>
            </div>
            <div style="font-size:0.75rem;color:var(--md-text-muted);" id="md-jira-progress-detail">
                0 / 0
            </div>
        </div>
    `;
}

function buildExportDone(): string {
    const result = state.exportResult!;
    return `
        <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem;">
            <div style="text-align:center;font-size:1.5rem;">✅</div>
            <div style="text-align:center;font-size:0.875rem;color:var(--md-text);">
                Exported <strong>${result.issues.length}</strong> issues from
                project <strong>${escapeHtml(result.project)}</strong>.
            </div>
            <div style="display:flex;justify-content:center;gap:0.5rem;padding-top:0.5rem;">
                <button class="md-btn md-btn-secondary" id="md-jira-export-done">Close</button>
                <button class="md-btn md-btn-primary" id="md-jira-export-download">Download again</button>
            </div>
        </div>
    `;
}

// ============================================================================
// Apply mode
// ============================================================================

function buildApplyBody(): string {
    switch (state.phase) {
        case 'pick': return buildFilePicker();
        case 'review': return buildReview();
        case 'applying': return buildProgress();
        case 'done': return buildResult();
    }
}

function buildFilePicker(): string {
    let errorBlock = '';
    if (state.parseErrors.length > 0) {
        const items = state.parseErrors
            .map(e => `<li style="margin-bottom:0.25rem;">${escapeHtml(e)}</li>`)
            .join('');
        errorBlock = `
            <div style="background:var(--md-danger-light);border-radius:var(--md-radius);padding:0.75rem;margin-top:0.5rem;">
                <div style="font-size:0.75rem;font-weight:600;color:var(--md-danger);margin-bottom:0.375rem;">
                    Validation errors:
                </div>
                <ul style="margin:0;padding-left:1.25rem;font-size:0.75rem;color:var(--md-text);">
                    ${items}
                </ul>
            </div>
        `;
    }

    return `
        <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem;">
            <p style="font-size:0.8125rem;color:var(--md-text-subtle);margin:0;line-height:1.4;">
                Import a JSON sync payload (<code>onyx-sync/jira-issues</code> format)
                to create or update issues in a Jira project. The importer always
                applies the marker label <code>onyx-sync</code> to synced issues.
            </p>
            <div id="md-jira-dropzone" style="
                border:2px dashed var(--md-border);border-radius:var(--md-radius-lg);
                padding:2.5rem 1.5rem;text-align:center;cursor:pointer;
                transition:all 0.15s ease;
            ">
                <div style="font-size:2rem;margin-bottom:0.5rem;">📋</div>
                <div style="font-size:0.875rem;color:var(--md-text);font-weight:500;">
                    Drop .json payload file here
                </div>
                <div style="font-size:0.75rem;color:var(--md-text-muted);margin-top:0.25rem;">
                    or click to browse
                </div>
                <input type="file" id="md-jira-file-input" accept=".json,application/json"
                    style="display:none;" />
            </div>
            ${errorBlock}
        </div>
    `;
}

function buildReview(): string {
    // Planning spinner — also when plan is not computed yet (first render).
    if (state.planning || (!state.plan && !state.planError)) {
        return `
            <div style="padding:2rem;display:flex;flex-direction:column;gap:1rem;align-items:center;justify-content:center;min-height:12rem;">
                <div class="md-btn-icon spinning" style="width:2rem;height:2rem;">
                    <svg viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>
                </div>
                <div style="font-size:0.875rem;color:var(--md-text-subtle);">
                    ${escapeHtml(state.planError ?? 'Planning...')}
                </div>
            </div>
        `;
    }

    // Plan error
    if (state.planError && !state.plan) {
        return `
            <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem;">
                <div style="background:var(--md-danger-light);border-radius:var(--md-radius);padding:0.75rem;">
                    <div style="font-size:0.75rem;color:var(--md-danger);">
                        ${escapeHtml(state.planError)}
                    </div>
                </div>
                <div style="display:flex;justify-content:flex-end;gap:0.5rem;">
                    <button class="md-btn md-btn-secondary" id="md-jira-back">Back</button>
                </div>
            </div>
        `;
    }

    const p = state.payload!;
    const plan = state.plan!;
    const dateStr = p.generatedAt
        ? new Date(p.generatedAt).toLocaleString()
        : '—';

    const counts = { create: 0, update: 0, skip: 0 };
    for (const row of plan.rows) {
        counts[row.action]++;
    }

    // Build table rows with depth-based indentation
    const depthMemo = new Map<string, number>();
    const computeDepth = (id: string): number => {
        if (depthMemo.has(id)) return depthMemo.get(id)!;
        const row = plan.rows.find(r => r.localId === id);
        if (!row || row.parentLocalId === null) {
            depthMemo.set(id, 0);
            return 0;
        }
        depthMemo.set(id, Number.MAX_SAFE_INTEGER);
        const d = computeDepth(row.parentLocalId) + 1;
        depthMemo.set(id, d);
        return d;
    };

    const tableRows = plan.rows.map(row => {
        const depth = computeDepth(row.localId);
        const indent = depth * 1.25;
        const checked = row.action === 'skip' ? '' : 'checked';
        const disabled = row.action === 'skip' ? 'disabled' : '';
        const badge = buildActionBadge(row.action);

        return `
            <tr style="border-bottom:1px solid var(--md-border);">
                <td style="padding:0.375rem 0.5rem;text-align:center;">
                    <input type="checkbox" class="md-jira-row-check"
                        data-local-id="${escapeHtml(row.localId)}"
                        ${checked} ${disabled}
                        style="cursor:pointer;accent-color:var(--md-primary);" />
                </td>
                <td style="padding:0.375rem 0.5rem;padding-left:${indent}rem;color:var(--md-text);font-size:0.8125rem;">
                    ${escapeHtml(row.title)}
                </td>
                <td style="padding:0.375rem 0.5rem;text-align:center;">
                    ${badge}
                </td>
            </tr>
        `;
    }).join('');

    const selectedCount = plan.rows.filter(
        r => r.action !== 'skip'
    ).length;

    return `
        <div style="padding:1.25rem;display:flex;flex-direction:column;gap:1rem;overflow-y:auto;">
            <div style="background:var(--md-bg-subtle);border-radius:var(--md-radius);padding:0.75rem 1rem;">
                <div style="font-size:0.6875rem;font-weight:600;color:var(--md-text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.5rem;">
                    Payload Info
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.375rem;font-size:0.8125rem;">
                    <span style="color:var(--md-text-subtle);">Issues:</span>
                    <span style="color:var(--md-text);font-weight:500;">${plan.rows.length}</span>
                    <span style="color:var(--md-text-subtle);">Generated:</span>
                    <span style="color:var(--md-text);font-weight:500;">${escapeHtml(dateStr)}</span>
                    <span style="color:var(--md-text-subtle);">Create:</span>
                    <span style="color:var(--md-success);font-weight:500;">${counts.create}</span>
                    <span style="color:var(--md-text-subtle);">Update:</span>
                    <span style="color:var(--md-warning);font-weight:500;">${counts.update}</span>
                    <span style="color:var(--md-text-subtle);">Skip:</span>
                    <span style="color:var(--md-text-muted);font-weight:500;">${counts.skip}</span>
                </div>
            </div>

            <div class="md-settings-section">
                <div class="md-settings-title">Target Project</div>
                <label style="font-size:0.8125rem;color:var(--md-text-subtle);">
                    Project Key
                    <input id="md-jira-project" type="text" value="${escapeHtml(state.projectKey)}"
                        style="display:block;width:100%;margin-top:0.25rem;padding:0.375rem 0.5rem;
                        border:1px solid var(--md-border);border-radius:var(--md-radius);
                        font-size:0.8125rem;font-family:var(--md-font);
                        background:var(--md-bg);color:var(--md-text);box-sizing:border-box;" />
                </label>
            </div>

            <div style="border:1px solid var(--md-border);border-radius:var(--md-radius);overflow:hidden;">
                <table style="width:100%;border-collapse:collapse;">
                    <thead>
                        <tr style="background:var(--md-bg-subtle);border-bottom:1px solid var(--md-border);">
                            <th style="padding:0.5rem;text-align:center;width:2.5rem;">
                                <input type="checkbox" id="md-jira-select-all"
                                    style="cursor:pointer;accent-color:var(--md-primary);" />
                            </th>
                            <th style="padding:0.5rem;text-align:left;font-size:0.6875rem;font-weight:600;color:var(--md-text-muted);text-transform:uppercase;letter-spacing:0.5px;">
                                Summary
                            </th>
                            <th style="padding:0.5rem;text-align:center;font-size:0.6875rem;font-weight:600;color:var(--md-text-muted);text-transform:uppercase;letter-spacing:0.5px;width:5rem;">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;padding-top:0.5rem;">
                <button class="md-btn md-btn-secondary" id="md-jira-back">Back</button>
                <span style="font-size:0.75rem;color:var(--md-text-muted);" id="md-jira-selected-count">
                    ${selectedCount} issues selected
                </span>
                <button class="md-btn md-btn-primary" id="md-jira-apply">
                    Apply ${selectedCount} issues
                </button>
            </div>
        </div>
    `;
}

function buildActionBadge(action: 'create' | 'update' | 'skip'): string {
    const styles: Record<'create' | 'update' | 'skip', string> = {
        create: 'background:var(--md-success-light);color:var(--md-success);',
        update: 'background:var(--md-warning-light);color:var(--md-warning);',
        skip: 'background:var(--md-bg-subtle);color:var(--md-text-muted);',
    };
    const labels: Record<'create' | 'update' | 'skip', string> = {
        create: 'CREATE',
        update: 'UPDATE',
        skip: 'SKIP',
    };
    return `<span style="${styles[action]}padding:0.125rem 0.5rem;border-radius:0.25rem;font-size:0.625rem;font-weight:600;letter-spacing:0.5px;">${labels[action]}</span>`;
}

function buildProgress(): string {
    return `
        <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem;align-items:center;justify-content:center;min-height:10rem;">
            <div style="font-size:0.875rem;color:var(--md-text);font-weight:500;" id="md-jira-phase-label">
                Starting sync...
            </div>
            <div style="width:100%;">
                <div class="md-progress-bar" style="height:0.375rem;">
                    <div class="md-progress-fill" id="md-jira-progress-fill" style="width:0%;"></div>
                </div>
            </div>
            <div style="font-size:0.75rem;color:var(--md-text-muted);" id="md-jira-progress-detail">
                0 / 0
            </div>
        </div>
    `;
}

function buildResult(): string {
    const r = state.report!;
    const hasErrors = r.failed.length > 0;

    let errorList = '';
    if (r.failed.length > 0) {
        const items = r.failed
            .slice(0, 20)
            .map(e => `<li style="margin-bottom:0.25rem;"><strong>${escapeHtml(e.title)}</strong>: ${escapeHtml(e.error)}</li>`)
            .join('');
        const moreNote = r.failed.length > 20
            ? `<li style="color:var(--md-text-muted);">...and ${r.failed.length - 20} more</li>`
            : '';
        errorList = `
            <div style="margin-top:0.75rem;max-height:8rem;overflow-y:auto;
                background:var(--md-danger-light);border-radius:var(--md-radius);padding:0.75rem;">
                <div style="font-size:0.6875rem;font-weight:600;color:var(--md-danger);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.375rem;">
                    Errors (${r.failed.length})
                </div>
                <ul style="margin:0;padding-left:1.25rem;font-size:0.75rem;color:var(--md-text);">
                    ${items}${moreNote}
                </ul>
            </div>
        `;
    }

    let warningList = '';
    if (r.warnings.length > 0) {
        const items = r.warnings
            .slice(0, 20)
            .map(w => `<li style="margin-bottom:0.25rem;"><strong>${escapeHtml(w.title)}</strong>: ${escapeHtml(w.warning)}</li>`)
            .join('');
        const moreNote = r.warnings.length > 20
            ? `<li style="color:var(--md-text-muted);">...and ${r.warnings.length - 20} more</li>`
            : '';
        warningList = `
            <div style="margin-top:0.5rem;max-height:6rem;overflow-y:auto;
                background:var(--md-warning-light);border-radius:var(--md-radius);padding:0.75rem;">
                <div style="font-size:0.6875rem;font-weight:600;color:var(--md-warning);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.375rem;">
                    Warnings (${r.warnings.length})
                </div>
                <ul style="margin:0;padding-left:1.25rem;font-size:0.75rem;color:var(--md-text);">
                    ${items}${moreNote}
                </ul>
            </div>
        `;
    }

    return `
        <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem;">
            <div style="text-align:center;font-size:1.5rem;">${hasErrors ? '⚠️' : '✅'}</div>
            <div style="display:flex;justify-content:center;gap:1.5rem;font-size:0.875rem;flex-wrap:wrap;">
                <span style="color:var(--md-success);font-weight:500;">Created: ${r.created.length}</span>
                <span style="color:var(--md-warning);font-weight:500;">Updated: ${r.updated.length}</span>
                <span style="color:var(--md-text-muted);font-weight:500;">Skipped: ${r.skipped.length}</span>
                <span style="color:var(--md-danger);font-weight:500;">Failed: ${r.failed.length}</span>
            </div>
            ${errorList}
            ${warningList}
            <div style="display:flex;justify-content:center;gap:0.5rem;padding-top:0.5rem;">
                <button class="md-btn md-btn-secondary" id="md-jira-done">Close</button>
                <button class="md-btn md-btn-primary" id="md-jira-download">Download report</button>
            </div>
        </div>
    `;
}

// ============================================================================
// Event Listeners
// ============================================================================

function attachEventListeners(): void {
    const modal = document.getElementById(MODAL_ID);
    if (!modal) return;

    // Close button
    modal.querySelector('#md-jira-close')?.addEventListener('click', closeJiraModal);

    // Escape key
    const onKeyDown = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') {
            closeJiraModal();
            document.removeEventListener('keydown', onKeyDown);
        }
    };
    document.addEventListener('keydown', onKeyDown);

    // Mode toggle (visible except during applying)
    if (state.phase !== 'applying') {
        modal.querySelector('#md-jira-mode-export')?.addEventListener('click', () => {
            switchMode('export');
        });
        modal.querySelector('#md-jira-mode-apply')?.addEventListener('click', () => {
            switchMode('apply');
        });
    }

    // Mode-specific listeners
    if (state.mode === 'export') {
        attachExportListeners(modal);
    } else {
        switch (state.phase) {
            case 'pick': attachFilePickerListeners(modal); break;
            case 'review': attachReviewListeners(modal); break;
            case 'done': attachResultListeners(modal); break;
        }
    }
}

function switchMode(mode: 'export' | 'apply'): void {
    if (state.mode === mode) return;
    state.mode = mode;
    // Reset sub-state for the new mode
    state.phase = 'pick';
    state.parseErrors = [];
    state.plan = null;
    state.planError = null;
    state.planning = false;
    state.report = null;
    state.file = null;
    state.payload = null;
    state.exportError = null;
    state.exportResult = null;
    state.exporting = false;
    renderJiraModal();
}

function attachExportListeners(modal: HTMLElement): void {
    if (state.exporting) return;

    if (state.exportResult) {
        // Done state
        modal.querySelector('#md-jira-export-done')?.addEventListener('click', closeJiraModal);
        modal.querySelector('#md-jira-export-download')?.addEventListener('click', () => {
            if (state.exportResult) downloadExport(state.exportResult);
        });
        return;
    }

    // Pick state
    const projectInput = modal.querySelector('#md-jira-export-project') as HTMLInputElement | null;
    if (projectInput) {
        projectInput.addEventListener('input', () => {
            state.exportProjectKey = projectInput.value.trim().toUpperCase();
        });
    }

    modal.querySelector('#md-jira-export-start')?.addEventListener('click', () => {
        void startExport();
    });
}

function attachFilePickerListeners(modal: HTMLElement): void {
    const dropzone = modal.querySelector('#md-jira-dropzone') as HTMLElement | null;
    const fileInput = modal.querySelector('#md-jira-file-input') as HTMLInputElement | null;
    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--md-primary)';
        dropzone.style.background = 'var(--md-primary-light)';
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = 'var(--md-border)';
        dropzone.style.background = '';
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--md-border)';
        dropzone.style.background = '';
        const file = e.dataTransfer?.files[0];
        if (file) void handleFileSelected(file);
    });

    fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (file) void handleFileSelected(file);
    });
}

function attachReviewListeners(modal: HTMLElement): void {
    // Back button
    modal.querySelector('#md-jira-back')?.addEventListener('click', () => {
        state.phase = 'pick';
        state.file = null;
        state.payload = null;
        state.parseErrors = [];
        state.plan = null;
        state.planError = null;
        renderJiraModal();
    });

    // Project key change → re-plan
    const projectInput = modal.querySelector('#md-jira-project') as HTMLInputElement | null;
    if (projectInput) {
        projectInput.addEventListener('change', () => {
            const newKey = projectInput.value.trim().toUpperCase();
            if (newKey && newKey !== state.projectKey) {
                state.projectKey = newKey;
                state.payload = { ...state.payload!, project: newKey };
                void computePlan();
            }
        });
    }

    // Select all checkbox
    const selectAll = modal.querySelector('#md-jira-select-all') as HTMLInputElement | null;
    if (selectAll) {
        selectAll.addEventListener('change', () => {
            const checks = modal.querySelectorAll<HTMLInputElement>('.md-jira-row-check');
            for (const check of checks) {
                if (!check.disabled) {
                    check.checked = selectAll.checked;
                }
            }
            updateSelectedCount(modal);
        });
    }

    // Individual row checkboxes
    const rowChecks = modal.querySelectorAll<HTMLInputElement>('.md-jira-row-check');
    for (const check of rowChecks) {
        check.addEventListener('change', () => updateSelectedCount(modal));
    }

    // Sync select-all state with individual checks
    updateSelectAllState(modal);

    // Apply button
    modal.querySelector('#md-jira-apply')?.addEventListener('click', () => {
        void startApplyProcess(modal);
    });
}

function attachResultListeners(modal: HTMLElement): void {
    modal.querySelector('#md-jira-done')?.addEventListener('click', closeJiraModal);
    modal.querySelector('#md-jira-download')?.addEventListener('click', () => {
        if (state.report) downloadReport(state.report);
    });
}

// ============================================================================
// Export process
// ============================================================================

async function startExport(): Promise<void> {
    const projectKey = state.exportProjectKey.trim().toUpperCase();
    if (!projectKey) return;

    state.exporting = true;
    state.exportError = null;
    renderJiraModal();

    try {
        const result = await exportJiraIssues(projectKey, (phase, current, total) => {
            updateProgress(phase, current, total);
        });

        state.exportResult = result;
        state.exporting = false;
        // Download immediately
        downloadExport(result);
        renderJiraModal();
    } catch (error) {
        ctmError('[JiraModal] Export failed:', error);
        state.exportError = error instanceof Error ? error.message : String(error);
        state.exporting = false;
        renderJiraModal();
    }
}

// ============================================================================
// File handling (Apply mode)
// ============================================================================

async function handleFileSelected(file: File): Promise<void> {
    ctmLog('[JiraModal] File selected:', file.name, file.size);

    try {
        const text = await file.text();
        let raw: unknown;
        try {
            raw = JSON.parse(text);
        } catch {
            state.parseErrors = ['File is not valid JSON.'];
            state.file = null;
            state.payload = null;
            renderJiraModal();
            return;
        }

        const result = parseJiraPayload(raw);
        if (!result.ok) {
            state.parseErrors = [...result.errors];
            state.file = null;
            state.payload = null;
            renderJiraModal();
            return;
        }

        // Valid payload → move to review phase. planning=true is set BEFORE the
        // first review render so buildReview shows the spinner instead of
        // dereferencing the still-null plan.
        state.file = file;
        state.payload = result.payload;
        state.parseErrors = [];
        state.projectKey = result.payload.project;
        state.phase = 'review';
        state.planning = true;
        renderJiraModal();

        // Compute plan lazily
        void computePlan();
    } catch (error) {
        ctmError('[JiraModal] Failed to read file:', error);
        state.parseErrors = [
            `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
        ];
        state.file = null;
        state.payload = null;
        state.phase = 'pick';
        renderJiraModal();
    }
}

// ============================================================================
// Plan computation (Apply mode)
// ============================================================================

async function computePlan(): Promise<void> {
    if (!state.payload) return;

    state.planning = true;
    state.planError = null;
    renderJiraModal();

    try {
        const plan = await planJiraSync(state.payload);
        state.plan = plan;
        state.planning = false;
        renderJiraModal();
    } catch (error) {
        ctmError('[JiraModal] Plan failed:', error);
        state.planError = error instanceof Error ? error.message : String(error);
        state.planning = false;
        renderJiraModal();
    }
}

// ============================================================================
// Apply process
// ============================================================================

async function startApplyProcess(modal: HTMLElement): Promise<void> {
    if (!state.payload || !state.plan) return;

    const checks = modal.querySelectorAll<HTMLInputElement>('.md-jira-row-check');
    const selectedLocalIds = new Set<string>();
    for (const check of checks) {
        if (check.checked && !check.disabled) {
            const id = check.getAttribute('data-local-id');
            if (id) selectedLocalIds.add(id);
        }
    }

    if (selectedLocalIds.size === 0) return;

    state.phase = 'applying';
    renderJiraModal();

    try {
        const report = await applyJiraSync(
            state.payload,
            state.plan,
            selectedLocalIds,
            (phase, current, total) => {
                updateProgress(phase, current, total);
            }
        );

        state.report = report;
        state.phase = 'done';
        renderJiraModal();
    } catch (error) {
        ctmError('[JiraModal] Apply failed:', error);
        state.report = {
            project: state.payload.project,
            appliedAt: new Date().toISOString(),
            created: [],
            updated: [],
            skipped: [],
            failed: [
                {
                    localId: '(sync)',
                    title: '(sync)',
                    error: error instanceof Error ? error.message : String(error),
                },
            ],
            warnings: [],
        };
        state.phase = 'done';
        renderJiraModal();
    }
}

function updateProgress(phase: string, current: number, total: number): void {
    const label = document.getElementById('md-jira-phase-label');
    const fill = document.getElementById('md-jira-progress-fill');
    const detail = document.getElementById('md-jira-progress-detail');

    if (label) label.textContent = phase;
    if (detail) detail.textContent = `${current} / ${total}`;
    if (fill) {
        const pct = total > 0 ? Math.round((current / total) * 100) : 0;
        fill.style.width = `${pct}%`;
    }
}

// ============================================================================
// Checkbox helpers
// ============================================================================

function updateSelectedCount(modal: HTMLElement): void {
    const checks = modal.querySelectorAll<HTMLInputElement>('.md-jira-row-check');
    let count = 0;
    for (const check of checks) {
        if (check.checked && !check.disabled) count++;
    }

    const countEl = modal.querySelector('#md-jira-selected-count');
    if (countEl) countEl.textContent = `${count} issues selected`;

    const applyBtn = modal.querySelector('#md-jira-apply');
    if (applyBtn) {
        applyBtn.textContent = `Apply ${count} issues`;
        (applyBtn as HTMLButtonElement).disabled = count === 0;
    }

    updateSelectAllState(modal);
}

function updateSelectAllState(modal: HTMLElement): void {
    const selectAll = modal.querySelector('#md-jira-select-all') as HTMLInputElement | null;
    if (!selectAll) return;

    const checks = modal.querySelectorAll<HTMLInputElement>('.md-jira-row-check');
    let allChecked = true;
    let hasEnabled = false;
    for (const check of checks) {
        if (!check.disabled) {
            hasEnabled = true;
            if (!check.checked) {
                allChecked = false;
                break;
            }
        }
    }
    selectAll.checked = hasEnabled && allChecked;
}

// ============================================================================
// Download helpers
// ============================================================================

function downloadExport(exportData: JiraExport): void {
    const filename = `${exportData.project}-jira-export.json`;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function downloadReport(report: JiraReport): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `jira-sync-report-${timestamp}.json`;
    const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ============================================================================
// Helpers
// ============================================================================

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
