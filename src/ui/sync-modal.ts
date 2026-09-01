/**
 * Sync Modal — UI for importing a JSON "sync payload" into Confluence.
 *
 * Features:
 *   - File picker (drag-and-drop or click) for .json payload files
 *   - Payload validation with inline error list (no alert())
 *   - Review plan: table of create/update/skip rows with checkboxes
 *   - Editable Space Key (re-plans on change)
 *   - Progress bar during apply
 *   - Result summary with error/warning lists
 *   - Download JSON report
 *
 * Mirrors the structure/state machine of import-modal.ts.
 */

import { parseSyncPayload, type SyncPayload } from '@/core/sync-payload';
import {
    planSync,
    applySync,
    type SyncPlan,
    type SyncReport,
} from '@/core/sync-importer';
import { ctmLog, ctmError } from '@/utils/logger';

// ============================================================================
// Constants
// ============================================================================

const MODAL_ID = 'md-sync-modal';

// ============================================================================
// State
// ============================================================================

interface SyncModalState {
    file: File | null;
    payload: SyncPayload | null;
    parseErrors: string[];
    phase: 'pick' | 'review' | 'applying' | 'done';
    spaceKey: string;
    plan: SyncPlan | null;
    planError: string | null;
    planning: boolean;
    report: SyncReport | null;
}

let state: SyncModalState = createInitialState();

function createInitialState(): SyncModalState {
    return {
        file: null,
        payload: null,
        parseErrors: [],
        phase: 'pick',
        spaceKey: '',
        plan: null,
        planError: null,
        planning: false,
        report: null,
    };
}

// ============================================================================
// Public API
// ============================================================================

/** Open the sync modal */
export function showSyncModal(): void {
    state = createInitialState();
    renderSyncModal();
}

/** Close the sync modal */
export function closeSyncModal(): void {
    const el = document.getElementById(MODAL_ID);
    if (el) el.remove();
}

// ============================================================================
// Render
// ============================================================================

function renderSyncModal(): void {
    closeSyncModal();

    const overlay = document.createElement('div');
    overlay.id = MODAL_ID;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Sync Payload');
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
        if (e.target === overlay) closeSyncModal();
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
                <h3>Sync Payload</h3>
            </div>
            <div class="md-header-actions">
                <button class="md-btn-icon" id="md-sync-close" title="Close">
                    <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>
            </div>
        </div>
    `;
}

function buildBody(): string {
    switch (state.phase) {
        case 'pick': return buildFilePicker();
        case 'review': return buildReview();
        case 'applying': return buildProgress();
        case 'done': return buildResult();
    }
}

// ============================================================================
// Phase: File Picker
// ============================================================================

function buildFilePicker(): string {
    // Show parse errors if any
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
                Import a JSON sync payload (<code>onyx-sync/confluence-pages</code> format)
                to create or update pages in a Confluence space. The importer always
                applies the marker label <code>onyx-sync</code> to synced pages.
            </p>
            <div id="md-sync-dropzone" style="
                border:2px dashed var(--md-border);border-radius:var(--md-radius-lg);
                padding:2.5rem 1.5rem;text-align:center;cursor:pointer;
                transition:all 0.15s ease;
            ">
                <div style="font-size:2rem;margin-bottom:0.5rem;">🔄</div>
                <div style="font-size:0.875rem;color:var(--md-text);font-weight:500;">
                    Drop .json payload file here
                </div>
                <div style="font-size:0.75rem;color:var(--md-text-muted);margin-top:0.25rem;">
                    or click to browse
                </div>
                <input type="file" id="md-sync-file-input" accept=".json,application/json"
                    style="display:none;" />
            </div>
            ${errorBlock}
        </div>
    `;
}

// ============================================================================
// Phase: Review
// ============================================================================

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
                    <button class="md-btn md-btn-secondary" id="md-sync-back">Back</button>
                </div>
            </div>
        `;
    }

    const p = state.payload!;
    const plan = state.plan!;
    const dateStr = p.generatedAt
        ? new Date(p.generatedAt).toLocaleString()
        : '—';

    // Count actions
    const counts = { create: 0, update: 0, skip: 0 };
    for (const row of plan.rows) {
        counts[row.action]++;
    }

    // Build table rows
    const rowMap = new Map<string, { row: typeof plan.rows[number]; depth: number }>();
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

    for (const row of plan.rows) {
        rowMap.set(row.localId, { row, depth: computeDepth(row.localId) });
    }

    const tableRows = plan.rows.map(row => {
        const info = rowMap.get(row.localId)!;
        const indent = info.depth * 1.25;
        const checked = row.action === 'skip' ? '' : 'checked';
        const disabled = row.action === 'skip' ? 'disabled' : '';
        const badge = buildActionBadge(row.action);

        return `
            <tr style="border-bottom:1px solid var(--md-border);">
                <td style="padding:0.375rem 0.5rem;text-align:center;">
                    <input type="checkbox" class="md-sync-row-check"
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
                    <span style="color:var(--md-text-subtle);">Pages:</span>
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
                <div class="md-settings-title">Target Space</div>
                <label style="font-size:0.8125rem;color:var(--md-text-subtle);">
                    Space Key
                    <input id="md-sync-space" type="text" value="${escapeHtml(state.spaceKey)}"
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
                                <input type="checkbox" id="md-sync-select-all"
                                    style="cursor:pointer;accent-color:var(--md-primary);" />
                            </th>
                            <th style="padding:0.5rem;text-align:left;font-size:0.6875rem;font-weight:600;color:var(--md-text-muted);text-transform:uppercase;letter-spacing:0.5px;">
                                Title
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
                <button class="md-btn md-btn-secondary" id="md-sync-back">Back</button>
                <span style="font-size:0.75rem;color:var(--md-text-muted);" id="md-sync-selected-count">
                    ${selectedCount} pages selected
                </span>
                <button class="md-btn md-btn-primary" id="md-sync-apply">
                    Apply ${selectedCount} pages
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

// ============================================================================
// Phase: Progress
// ============================================================================

function buildProgress(): string {
    return `
        <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem;align-items:center;justify-content:center;min-height:10rem;">
            <div style="font-size:0.875rem;color:var(--md-text);font-weight:500;" id="md-sync-phase-label">
                Starting sync...
            </div>
            <div style="width:100%;">
                <div class="md-progress-bar" style="height:0.375rem;">
                    <div class="md-progress-fill" id="md-sync-progress-fill" style="width:0%;"></div>
                </div>
            </div>
            <div style="font-size:0.75rem;color:var(--md-text-muted);" id="md-sync-progress-detail">
                0 / 0
            </div>
        </div>
    `;
}

// ============================================================================
// Phase: Result
// ============================================================================

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
                <button class="md-btn md-btn-secondary" id="md-sync-done">Close</button>
                <button class="md-btn md-btn-primary" id="md-sync-download">Download report</button>
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
    modal.querySelector('#md-sync-close')?.addEventListener('click', closeSyncModal);

    // Escape key
    const onKeyDown = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') {
            closeSyncModal();
            document.removeEventListener('keydown', onKeyDown);
        }
    };
    document.addEventListener('keydown', onKeyDown);

    // Phase-specific listeners
    switch (state.phase) {
        case 'pick': attachFilePickerListeners(modal); break;
        case 'review': attachReviewListeners(modal); break;
        case 'done': attachResultListeners(modal); break;
    }
}

function attachFilePickerListeners(modal: HTMLElement): void {
    const dropzone = modal.querySelector('#md-sync-dropzone') as HTMLElement | null;
    const fileInput = modal.querySelector('#md-sync-file-input') as HTMLInputElement | null;
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
    modal.querySelector('#md-sync-back')?.addEventListener('click', () => {
        state.phase = 'pick';
        state.file = null;
        state.payload = null;
        state.parseErrors = [];
        state.plan = null;
        state.planError = null;
        renderSyncModal();
    });

    // Space key change → re-plan
    const spaceInput = modal.querySelector('#md-sync-space') as HTMLInputElement | null;
    if (spaceInput) {
        spaceInput.addEventListener('change', () => {
            const newKey = spaceInput.value.trim();
            if (newKey && newKey !== state.spaceKey) {
                state.spaceKey = newKey;
                state.payload = { ...state.payload!, space: newKey };
                void computePlan();
            }
        });
    }

    // Select all checkbox
    const selectAll = modal.querySelector('#md-sync-select-all') as HTMLInputElement | null;
    if (selectAll) {
        selectAll.addEventListener('change', () => {
            const checks = modal.querySelectorAll<HTMLInputElement>('.md-sync-row-check');
            for (const check of checks) {
                if (!check.disabled) {
                    check.checked = selectAll.checked;
                }
            }
            updateSelectedCount(modal);
        });
    }

    // Individual row checkboxes
    const rowChecks = modal.querySelectorAll<HTMLInputElement>('.md-sync-row-check');
    for (const check of rowChecks) {
        check.addEventListener('change', () => updateSelectedCount(modal));
    }

    // Sync select-all state with individual checks
    updateSelectAllState(modal);

    // Apply button
    modal.querySelector('#md-sync-apply')?.addEventListener('click', () => {
        void startApplyProcess(modal);
    });
}

function attachResultListeners(modal: HTMLElement): void {
    modal.querySelector('#md-sync-done')?.addEventListener('click', closeSyncModal);
    modal.querySelector('#md-sync-download')?.addEventListener('click', () => {
        if (state.report) downloadReport(state.report);
    });
}

// ============================================================================
// File handling
// ============================================================================

async function handleFileSelected(file: File): Promise<void> {
    ctmLog('[SyncModal] File selected:', file.name, file.size);

    try {
        const text = await file.text();
        let raw: unknown;
        try {
            raw = JSON.parse(text);
        } catch {
            state.parseErrors = ['File is not valid JSON.'];
            state.file = null;
            state.payload = null;
            renderSyncModal();
            return;
        }

        const result = parseSyncPayload(raw);
        if (!result.ok) {
            state.parseErrors = [...result.errors];
            state.file = null;
            state.payload = null;
            renderSyncModal();
            return;
        }

        // Valid payload → move to review phase. planning=true is set BEFORE the
        // first review render so buildReview shows the spinner instead of
        // dereferencing the still-null plan.
        state.file = file;
        state.payload = result.payload;
        state.parseErrors = [];
        state.spaceKey = result.payload.space;
        state.phase = 'review';
        state.planning = true;
        renderSyncModal();

        // Compute plan lazily
        void computePlan();
    } catch (error) {
        ctmError('[SyncModal] Failed to read file:', error);
        state.parseErrors = [
            `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
        ];
        state.file = null;
        state.payload = null;
        // Reset to pick phase — the failure may have happened mid-review-render,
        // and rendering review without a payload would throw again.
        state.phase = 'pick';
        renderSyncModal();
    }
}

// ============================================================================
// Plan computation
// ============================================================================

async function computePlan(): Promise<void> {
    if (!state.payload) return;

    state.planning = true;
    state.planError = null;
    renderSyncModal();

    try {
        const plan = await planSync(state.payload);
        state.plan = plan;
        state.planning = false;
        renderSyncModal();
    } catch (error) {
        ctmError('[SyncModal] Plan failed:', error);
        state.planError = error instanceof Error ? error.message : String(error);
        state.planning = false;
        renderSyncModal();
    }
}

// ============================================================================
// Apply process
// ============================================================================

async function startApplyProcess(modal: HTMLElement): Promise<void> {
    if (!state.payload || !state.plan) return;

    // Collect selected local ids
    const checks = modal.querySelectorAll<HTMLInputElement>('.md-sync-row-check');
    const selectedLocalIds = new Set<string>();
    for (const check of checks) {
        if (check.checked && !check.disabled) {
            const id = check.getAttribute('data-local-id');
            if (id) selectedLocalIds.add(id);
        }
    }

    if (selectedLocalIds.size === 0) return;

    state.phase = 'applying';
    renderSyncModal();

    try {
        const report = await applySync(
            state.payload,
            state.plan,
            selectedLocalIds,
            (phase, current, total) => {
                updateProgress(phase, current, total);
            }
        );

        state.report = report;
        state.phase = 'done';
        renderSyncModal();
    } catch (error) {
        ctmError('[SyncModal] Apply failed:', error);
        state.report = {
            space: state.payload.space,
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
        renderSyncModal();
    }
}

function updateProgress(phase: string, current: number, total: number): void {
    const label = document.getElementById('md-sync-phase-label');
    const fill = document.getElementById('md-sync-progress-fill');
    const detail = document.getElementById('md-sync-progress-detail');

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
    const checks = modal.querySelectorAll<HTMLInputElement>('.md-sync-row-check');
    let count = 0;
    for (const check of checks) {
        if (check.checked && !check.disabled) count++;
    }

    const countEl = modal.querySelector('#md-sync-selected-count');
    if (countEl) countEl.textContent = `${count} pages selected`;

    const applyBtn = modal.querySelector('#md-sync-apply');
    if (applyBtn) {
        applyBtn.textContent = `Apply ${count} pages`;
        (applyBtn as HTMLButtonElement).disabled = count === 0;
    }

    updateSelectAllState(modal);
}

function updateSelectAllState(modal: HTMLElement): void {
    const selectAll = modal.querySelector('#md-sync-select-all') as HTMLInputElement | null;
    if (!selectAll) return;

    const checks = modal.querySelectorAll<HTMLInputElement>('.md-sync-row-check');
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
// Report download
// ============================================================================

function downloadReport(report: SyncReport): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `sync-report-${timestamp}.json`;
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
