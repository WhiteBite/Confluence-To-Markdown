/**
 * Space Sync Modal — UI for incremental space sync.
 *
 * Two targets:
 *   - Folder: via File System Access API (read/write a git repo folder)
 *   - Download: in-memory, emit a delta JSON
 *
 * Phases: pick → review → applying → done (mirrors sync-modal.ts).
 * Sets scanning=true BEFORE first review render to avoid null-plan crash.
 */

import { scanSpace, applySpaceSync, type ScanResult } from '@/core/space-sync';
import type { SpaceDiff, SpaceSyncReport } from '@/core/space-types';
import type { TreePageFile } from '@/core/space-types';
import {
    MemoryTreeStore,
    FsTreeStore,
    pickDirectory,
    type TreeStore,
} from '@/core/tree-io';
import { getSpaceKey } from '@/utils/helpers';
import { ctmError } from '@/utils/logger';

// ============================================================================
// Constants
// ============================================================================

const MODAL_ID = 'md-space-sync-modal';

// ============================================================================
// State
// ============================================================================

interface SpaceSyncModalState {
    phase: 'pick' | 'review' | 'applying' | 'done';
    spaceKey: string;
    target: 'folder' | 'download';
    store: TreeStore | null;
    scanResult: ScanResult | null;
    scanError: string | null;
    scanning: boolean;
    report: SpaceSyncReport | null;
    pickError: string | null;
}

let state: SpaceSyncModalState = createInitialState();

function createInitialState(): SpaceSyncModalState {
    return {
        phase: 'pick',
        spaceKey: getSpaceKey() ?? '',
        target: 'download',
        store: null,
        scanResult: null,
        scanError: null,
        scanning: false,
        report: null,
        pickError: null,
    };
}

// ============================================================================
// Public API
// ============================================================================

/** Open the space sync modal */
export function showSpaceSyncModal(): void {
    state = createInitialState();
    renderModal();
}

/** Close the space sync modal */
export function closeSpaceSyncModal(): void {
    const el = document.getElementById(MODAL_ID);
    if (el) el.remove();
}

// ============================================================================
// Render
// ============================================================================

function renderModal(): void {
    closeModal();

    const overlay = document.createElement('div');
    overlay.id = MODAL_ID;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Space Sync');
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
        if (e.target === overlay) closeModal();
    });

    document.body.appendChild(overlay);
    attachEventListeners();
}

function closeModal(): void {
    const el = document.getElementById(MODAL_ID);
    if (el) el.remove();
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
                <h3>Space Sync</h3>
            </div>
            <div class="md-header-actions">
                <button class="md-btn-icon" id="md-space-close" title="Close">
                    <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>
            </div>
        </div>
    `;
}

function buildBody(): string {
    switch (state.phase) {
        case 'pick': return buildPick();
        case 'review': return buildReview();
        case 'applying': return buildProgress();
        case 'done': return buildResult();
    }
}

// ============================================================================
// Phase: Pick
// ============================================================================

function buildPick(): string {
    let errorBlock = '';
    if (state.pickError) {
        errorBlock = `
            <div style="background:var(--md-danger-light);border-radius:var(--md-radius);padding:0.75rem;margin-top:0.5rem;">
                <div style="font-size:0.75rem;color:var(--md-danger);">
                    ${escapeHtml(state.pickError)}
                </div>
            </div>
        `;
    }

    const folderActive = state.target === 'folder';
    const downloadActive = state.target === 'download';

    return `
        <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem;">
            <p style="font-size:0.8125rem;color:var(--md-text-subtle);margin:0;line-height:1.4;">
                Incrementally sync a Confluence space to a git-friendly folder tree
                or a delta JSON file. Only changed pages (added/updated/removed) are
                fetched — unchanged pages are skipped.
            </p>
            <div class="md-settings-section">
                <div class="md-settings-title">Space</div>
                <label style="font-size:0.8125rem;color:var(--md-text-subtle);">
                    Space Key
                    <input id="md-space-key" type="text" value="${escapeHtml(state.spaceKey)}"
                        placeholder="e.g. SPC"
                        style="display:block;width:100%;margin-top:0.25rem;padding:0.375rem 0.5rem;
                        border:1px solid var(--md-border);border-radius:var(--md-radius);
                        font-size:0.8125rem;font-family:var(--md-font);
                        background:var(--md-bg);color:var(--md-text);box-sizing:border-box;" />
                </label>
            </div>
            <div class="md-settings-section">
                <div class="md-settings-title">Target</div>
                <div style="display:flex;gap:0.25rem;">
                    <button class="md-segment ${folderActive ? 'active' : ''}" id="md-space-target-folder"
                        style="padding:0.375rem 1rem;border-radius:var(--md-radius);border:1px solid var(--md-border);
                        background:${folderActive ? 'var(--md-primary)' : 'var(--md-bg)'};
                        color:${folderActive ? '#fff' : 'var(--md-text-subtle)'};
                        cursor:pointer;font-size:0.8125rem;font-weight:500;font-family:var(--md-font);">
                        Folder
                    </button>
                    <button class="md-segment ${downloadActive ? 'active' : ''}" id="md-space-target-download"
                        style="padding:0.375rem 1rem;border-radius:var(--md-radius);border:1px solid var(--md-border);
                        background:${downloadActive ? 'var(--md-primary)' : 'var(--md-bg)'};
                        color:${downloadActive ? '#fff' : 'var(--md-text-subtle)'};
                        cursor:pointer;font-size:0.8125rem;font-weight:500;font-family:var(--md-font);">
                        Download
                    </button>
                </div>
            </div>
            ${errorBlock}
            <div style="display:flex;justify-content:flex-end;padding-top:0.5rem;">
                <button class="md-btn md-btn-primary" id="md-space-scan">Scan</button>
            </div>
        </div>
    `;
}

// ============================================================================
// Phase: Review
// ============================================================================

function buildReview(): string {
    // Scanning spinner — also when scan result is not computed yet (first render).
    if (state.scanning || (!state.scanResult && !state.scanError)) {
        return `
            <div style="padding:2rem;display:flex;flex-direction:column;gap:1rem;align-items:center;justify-content:center;min-height:12rem;">
                <div class="md-btn-icon spinning" style="width:2rem;height:2rem;">
                    <svg viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>
                </div>
                <div style="font-size:0.875rem;color:var(--md-text-subtle);">
                    ${escapeHtml(state.scanError ?? 'Scanning...')}
                </div>
            </div>
        `;
    }

    // Scan error
    if (state.scanError && !state.scanResult) {
        return `
            <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem;">
                <div style="background:var(--md-danger-light);border-radius:var(--md-radius);padding:0.75rem;">
                    <div style="font-size:0.75rem;color:var(--md-danger);">
                        ${escapeHtml(state.scanError)}
                    </div>
                </div>
                <div style="display:flex;justify-content:flex-end;gap:0.5rem;">
                    <button class="md-btn md-btn-secondary" id="md-space-back">Back</button>
                </div>
            </div>
        `;
    }

    const diff: SpaceDiff = state.scanResult!.diff;
    const catalog = state.scanResult!.catalog;

    // Build changelog rows
    const rows: string[] = [];

    for (const entry of diff.added) {
        rows.push(buildChangelogRow(entry.id, entry.title, 'add', `v${entry.version}`));
    }
    for (const entry of diff.changed) {
        rows.push(buildChangelogRow(
            entry.id,
            entry.title,
            'update',
            `v${entry.oldVersion} → v${entry.version}`
        ));
    }
    for (const entry of diff.removed) {
        rows.push(buildChangelogRow(entry.id, entry.title, 'delete', `v${entry.version}`));
    }

    const totalChanges = diff.added.length + diff.changed.length + diff.removed.length;
    const selectedCount = totalChanges; // all checked by default

    return `
        <div style="padding:1.25rem;display:flex;flex-direction:column;gap:1rem;overflow-y:auto;">
            <div style="background:var(--md-bg-subtle);border-radius:var(--md-radius);padding:0.75rem 1rem;">
                <div style="font-size:0.6875rem;font-weight:600;color:var(--md-text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.5rem;">
                    Space Summary
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.375rem;font-size:0.8125rem;">
                    <span style="color:var(--md-text-subtle);">Total pages:</span>
                    <span style="color:var(--md-text);font-weight:500;">${catalog.length}</span>
                    <span></span>
                    <span style="color:var(--md-success);">Added:</span>
                    <span style="color:var(--md-success);font-weight:500;">${diff.added.length}</span>
                    <span></span>
                    <span style="color:var(--md-warning);">Changed:</span>
                    <span style="color:var(--md-warning);font-weight:500;">${diff.changed.length}</span>
                    <span></span>
                    <span style="color:var(--md-danger);">Removed:</span>
                    <span style="color:var(--md-danger);font-weight:500;">${diff.removed.length}</span>
                    <span></span>
                    <span style="color:var(--md-text-muted);">Unchanged:</span>
                    <span style="color:var(--md-text-muted);font-weight:500;">${diff.unchangedCount}</span>
                    <span></span>
                </div>
            </div>

            ${totalChanges === 0 ? `
                <div style="text-align:center;padding:1.5rem;color:var(--md-text-subtle);font-size:0.875rem;">
                    No changes detected. Space is up to date.
                </div>
            ` : `
                <div style="border:1px solid var(--md-border);border-radius:var(--md-radius);overflow:hidden;max-height:20rem;overflow-y:auto;">
                    <table style="width:100%;border-collapse:collapse;">
                        <thead>
                            <tr style="background:var(--md-bg-subtle);border-bottom:1px solid var(--md-border);position:sticky;top:0;">
                                <th style="padding:0.5rem;text-align:center;width:2.5rem;">
                                    <input type="checkbox" id="md-space-select-all" checked
                                        style="cursor:pointer;accent-color:var(--md-primary);" />
                                </th>
                                <th style="padding:0.5rem;text-align:left;font-size:0.6875rem;font-weight:600;color:var(--md-text-muted);text-transform:uppercase;letter-spacing:0.5px;">
                                    Title
                                </th>
                                <th style="padding:0.5rem;text-align:center;font-size:0.6875rem;font-weight:600;color:var(--md-text-muted);text-transform:uppercase;letter-spacing:0.5px;width:5rem;">
                                    Action
                                </th>
                                <th style="padding:0.5rem;text-align:right;font-size:0.6875rem;font-weight:600;color:var(--md-text-muted);text-transform:uppercase;letter-spacing:0.5px;width:6rem;">
                                    Version
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.join('')}
                        </tbody>
                    </table>
                </div>
            `}

            <div style="display:flex;justify-content:space-between;align-items:center;padding-top:0.5rem;">
                <button class="md-btn md-btn-secondary" id="md-space-back">Back</button>
                <span style="font-size:0.75rem;color:var(--md-text-muted);" id="md-space-selected-count">
                    ${selectedCount} changes selected
                </span>
                <button class="md-btn md-btn-primary" id="md-space-apply" ${totalChanges === 0 ? 'disabled' : ''}>
                    Apply ${selectedCount} changes
                </button>
            </div>
        </div>
    `;
}

function buildChangelogRow(
    id: string,
    title: string,
    action: 'add' | 'update' | 'delete',
    versionInfo: string
): string {
    const badge = buildChangeBadge(action);
    return `
        <tr style="border-bottom:1px solid var(--md-border);">
            <td style="padding:0.375rem 0.5rem;text-align:center;">
                <input type="checkbox" class="md-space-row-check"
                    data-id="${escapeHtml(id)}" checked
                    style="cursor:pointer;accent-color:var(--md-primary);" />
            </td>
            <td style="padding:0.375rem 0.5rem;color:var(--md-text);font-size:0.8125rem;">
                ${escapeHtml(title)}
            </td>
            <td style="padding:0.375rem 0.5rem;text-align:center;">
                ${badge}
            </td>
            <td style="padding:0.375rem 0.5rem;text-align:right;color:var(--md-text-muted);font-size:0.75rem;">
                ${escapeHtml(versionInfo)}
            </td>
        </tr>
    `;
}

function buildChangeBadge(action: 'add' | 'update' | 'delete'): string {
    const styles: Record<'add' | 'update' | 'delete', string> = {
        add: 'background:var(--md-success-light);color:var(--md-success);',
        update: 'background:var(--md-warning-light);color:var(--md-warning);',
        delete: 'background:var(--md-danger-light);color:var(--md-danger);',
    };
    const labels: Record<'add' | 'update' | 'delete', string> = {
        add: 'ADD',
        update: 'UPDATE',
        delete: 'DELETE',
    };
    return `<span style="${styles[action]}padding:0.125rem 0.5rem;border-radius:0.25rem;font-size:0.625rem;font-weight:600;letter-spacing:0.5px;">${labels[action]}</span>`;
}

// ============================================================================
// Phase: Progress
// ============================================================================

function buildProgress(): string {
    return `
        <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem;align-items:center;justify-content:center;min-height:10rem;">
            <div style="font-size:0.875rem;color:var(--md-text);font-weight:500;" id="md-space-phase-label">
                Starting sync...
            </div>
            <div style="width:100%;">
                <div class="md-progress-bar" style="height:0.375rem;">
                    <div class="md-progress-fill" id="md-space-progress-fill" style="width:0%;"></div>
                </div>
            </div>
            <div style="font-size:0.75rem;color:var(--md-text-muted);" id="md-space-progress-detail">
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

    const downloadBtn = state.target === 'download'
        ? `<button class="md-btn md-btn-primary" id="md-space-download-delta">Download delta</button>`
        : '';

    return `
        <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem;">
            <div style="text-align:center;font-size:1.5rem;">${hasErrors ? '⚠️' : '✅'}</div>
            <div style="display:flex;justify-content:center;gap:1.5rem;font-size:0.875rem;flex-wrap:wrap;">
                <span style="color:var(--md-success);font-weight:500;">Added: ${r.added}</span>
                <span style="color:var(--md-warning);font-weight:500;">Changed: ${r.changed}</span>
                <span style="color:var(--md-danger);font-weight:500;">Removed: ${r.removed}</span>
                <span style="color:var(--md-text-muted);font-weight:500;">Written: ${r.written}</span>
            </div>
            ${errorList}
            <div style="display:flex;justify-content:center;gap:0.5rem;padding-top:0.5rem;">
                <button class="md-btn md-btn-secondary" id="md-space-done">Close</button>
                ${downloadBtn}
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

    modal.querySelector('#md-space-close')?.addEventListener('click', closeModal);

    const onKeyDown = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', onKeyDown);
        }
    };
    document.addEventListener('keydown', onKeyDown);

    switch (state.phase) {
        case 'pick': attachPickListeners(modal); break;
        case 'review': attachReviewListeners(modal); break;
        case 'done': attachResultListeners(modal); break;
    }
}

function attachPickListeners(modal: HTMLElement): void {
    // Target toggle
    modal.querySelector('#md-space-target-folder')?.addEventListener('click', () => {
        state.target = 'folder';
        state.pickError = null;
        renderModal();
    });
    modal.querySelector('#md-space-target-download')?.addEventListener('click', () => {
        state.target = 'download';
        state.pickError = null;
        renderModal();
    });

    // Space key input
    const keyInput = modal.querySelector('#md-space-key') as HTMLInputElement | null;
    if (keyInput) {
        keyInput.addEventListener('input', () => {
            state.spaceKey = keyInput.value.trim().toUpperCase();
        });
    }

    // Scan button
    modal.querySelector('#md-space-scan')?.addEventListener('click', () => {
        void startScan();
    });
}

function attachReviewListeners(modal: HTMLElement): void {
    modal.querySelector('#md-space-back')?.addEventListener('click', () => {
        state.phase = 'pick';
        state.scanResult = null;
        state.scanError = null;
        state.store = null;
        renderModal();
    });

    // Select all
    const selectAll = modal.querySelector('#md-space-select-all') as HTMLInputElement | null;
    if (selectAll) {
        selectAll.addEventListener('change', () => {
            const checks = modal.querySelectorAll<HTMLInputElement>('.md-space-row-check');
            for (const check of checks) {
                check.checked = selectAll.checked;
            }
            updateSelectedCount(modal);
        });
    }

    // Individual checkboxes
    const rowChecks = modal.querySelectorAll<HTMLInputElement>('.md-space-row-check');
    for (const check of rowChecks) {
        check.addEventListener('change', () => updateSelectedCount(modal));
    }

    updateSelectAllState(modal);

    // Apply button
    modal.querySelector('#md-space-apply')?.addEventListener('click', () => {
        void startApply(modal);
    });
}

function attachResultListeners(modal: HTMLElement): void {
    modal.querySelector('#md-space-done')?.addEventListener('click', closeModal);
    modal.querySelector('#md-space-download-delta')?.addEventListener('click', () => {
        void downloadDelta();
    });
}

// ============================================================================
// Scan process
// ============================================================================

async function startScan(): Promise<void> {
    const spaceKey = state.spaceKey.trim().toUpperCase();
    if (!spaceKey) return;

    // Create store based on target
    let store: TreeStore;
    if (state.target === 'folder') {
        const dirHandle = await pickDirectory();
        if (!dirHandle) {
            state.pickError = 'Directory picker cancelled or File System Access API unavailable.';
            renderModal();
            return;
        }
        store = new FsTreeStore(dirHandle);
    } else {
        store = new MemoryTreeStore();
    }

    state.store = store;
    state.phase = 'review';
    state.scanning = true;
    state.scanError = null;
    renderModal();

    try {
        const result = await scanSpace(store, spaceKey);
        state.scanResult = result;
        state.scanning = false;
        renderModal();
    } catch (error) {
        ctmError('[SpaceSyncModal] Scan failed:', error);
        state.scanError = error instanceof Error ? error.message : String(error);
        state.scanning = false;
        renderModal();
    }
}

// ============================================================================
// Apply process
// ============================================================================

async function startApply(modal: HTMLElement): Promise<void> {
    if (!state.store || !state.scanResult) return;

    const checks = modal.querySelectorAll<HTMLInputElement>('.md-space-row-check');
    const selectedIds = new Set<string>();
    for (const check of checks) {
        if (check.checked) {
            const id = check.getAttribute('data-id');
            if (id) selectedIds.add(id);
        }
    }

    if (selectedIds.size === 0) return;

    state.phase = 'applying';
    renderModal();

    try {
        const report = await applySpaceSync(
            state.store,
            state.spaceKey,
            state.scanResult.catalog,
            state.scanResult.diff,
            selectedIds,
            (phase, current, total) => {
                updateProgress(phase, current, total);
            }
        );

        state.report = report;
        state.phase = 'done';
        renderModal();
    } catch (error) {
        ctmError('[SpaceSyncModal] Apply failed:', error);
        state.report = {
            space: state.spaceKey,
            scannedAt: new Date().toISOString(),
            added: 0,
            changed: 0,
            removed: 0,
            unchangedCount: 0,
            failed: [{
                id: '(sync)',
                title: '(sync)',
                error: error instanceof Error ? error.message : String(error),
            }],
            written: 0,
        };
        state.phase = 'done';
        renderModal();
    }
}

function updateProgress(phase: string, current: number, total: number): void {
    const label = document.getElementById('md-space-phase-label');
    const fill = document.getElementById('md-space-progress-fill');
    const detail = document.getElementById('md-space-progress-detail');

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
    const checks = modal.querySelectorAll<HTMLInputElement>('.md-space-row-check');
    let count = 0;
    for (const check of checks) {
        if (check.checked) count++;
    }

    const countEl = modal.querySelector('#md-space-selected-count');
    if (countEl) countEl.textContent = `${count} changes selected`;

    const applyBtn = modal.querySelector('#md-space-apply');
    if (applyBtn) {
        applyBtn.textContent = `Apply ${count} changes`;
        (applyBtn as HTMLButtonElement).disabled = count === 0;
    }

    updateSelectAllState(modal);
}

function updateSelectAllState(modal: HTMLElement): void {
    const selectAll = modal.querySelector('#md-space-select-all') as HTMLInputElement | null;
    if (!selectAll) return;

    const checks = modal.querySelectorAll<HTMLInputElement>('.md-space-row-check');
    let allChecked = true;
    let hasAny = false;
    for (const check of checks) {
        hasAny = true;
        if (!check.checked) {
            allChecked = false;
            break;
        }
    }
    selectAll.checked = hasAny && allChecked;
}

// ============================================================================
// Delta download (Download mode)
// ============================================================================

async function downloadDelta(): Promise<void> {
    if (!state.store || !state.scanResult) return;

    const store = state.store;
    const diff = state.scanResult.diff;
    const spaceKey = state.spaceKey;

    // Read state from store
    const deltaState = await store.readState();
    if (!deltaState) return;

    // Read written pages for added/changed
    const addedPages: TreePageFile[] = [];
    const changedPages: TreePageFile[] = [];

    for (const entry of diff.added) {
        const page = await store.readPage(entry.id);
        if (page) addedPages.push(page);
    }
    for (const entry of diff.changed) {
        const page = await store.readPage(entry.id);
        if (page) changedPages.push(page);
    }

    const removedIds = diff.removed.map(r => r.id);

    const delta = {
        format: 'onyx-sync/space-delta' as const,
        version: 1,
        space: spaceKey,
        added: addedPages,
        changed: changedPages,
        removed: removedIds,
        state: deltaState,
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `space-delta-${timestamp}.json`;
    const blob = new Blob([JSON.stringify(delta, null, 2)], {
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
