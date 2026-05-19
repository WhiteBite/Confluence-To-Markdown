/**
 * Import Modal — UI for importing .cfb.zip backups into Confluence.
 *
 * Features:
 *   - File picker (drag-and-drop or click)
 *   - Manifest preview (page count, space, date)
 *   - Target space key + parent page ID inputs
 *   - Skip existing / include attachments checkboxes
 *   - Progress bar during import
 *   - Result summary with error list
 */

import { unzipSync } from 'fflate';
import type { BackupManifest } from '@/core/backup-exporter';
import { importConfluenceBackup } from '@/core/backup-importer';
import type { ImportOptions, ImportResult } from '@/core/backup-importer';
import { getSpaceKey } from '@/utils/helpers';
import { ctmLog, ctmError } from '@/utils/logger';

// ============================================================================
// Constants
// ============================================================================

const MODAL_ID = 'md-import-modal';

// ============================================================================
// State
// ============================================================================

interface ImportModalState {
    file: File | null;
    manifest: BackupManifest | null;
    phase: 'pick' | 'configure' | 'importing' | 'done';
    result: ImportResult | null;
}

let state: ImportModalState = createInitialState();

function createInitialState(): ImportModalState {
    return { file: null, manifest: null, phase: 'pick', result: null };
}

// ============================================================================
// Public API
// ============================================================================

/** Open the import modal */
export function showImportModal(): void {
    state = createInitialState();
    renderImportModal();
}

/** Close the import modal */
export function closeImportModal(): void {
    const el = document.getElementById(MODAL_ID);
    if (el) el.remove();
}

// ============================================================================
// Render
// ============================================================================

function renderImportModal(): void {
    closeImportModal();

    const overlay = document.createElement('div');
    overlay.id = MODAL_ID;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Import Backup');
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
        width:32rem;max-width:95vw;height:auto;max-height:90vh;
        display:flex;flex-direction:column;overflow:hidden;
    `;

    content.innerHTML = buildHeader();
    content.innerHTML += buildBody();

    overlay.appendChild(content);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeImportModal();
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
                <h3>Import Backup</h3>
            </div>
            <div class="md-header-actions">
                <button class="md-btn-icon" id="md-import-close" title="Close">
                    <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>
            </div>
        </div>
    `;
}

function buildBody(): string {
    switch (state.phase) {
        case 'pick': return buildFilePicker();
        case 'configure': return buildConfigForm();
        case 'importing': return buildProgress();
        case 'done': return buildResult();
    }
}

// ============================================================================
// Phase: File Picker
// ============================================================================

function buildFilePicker(): string {
    return `
        <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem;">
            <div id="md-import-dropzone" style="
                border:2px dashed var(--md-border);border-radius:var(--md-radius-lg);
                padding:2.5rem 1.5rem;text-align:center;cursor:pointer;
                transition:all 0.15s ease;
            ">
                <div style="font-size:2rem;margin-bottom:0.5rem;">📦</div>
                <div style="font-size:0.875rem;color:var(--md-text);font-weight:500;">
                    Drop .cfb.zip file here
                </div>
                <div style="font-size:0.75rem;color:var(--md-text-muted);margin-top:0.25rem;">
                    or click to browse
                </div>
                <input type="file" id="md-import-file-input" accept=".zip,.cfb.zip"
                    style="display:none;" />
            </div>
        </div>
    `;
}

// ============================================================================
// Phase: Configure
// ============================================================================

function buildConfigForm(): string {
    const m = state.manifest!;
    const currentSpace = getSpaceKey() ?? m.spaceKey ?? '';
    const dateStr = new Date(m.exportDate).toLocaleString();

    return `
        <div style="padding:1.25rem;display:flex;flex-direction:column;gap:1rem;overflow-y:auto;">
            <div style="background:var(--md-bg-subtle);border-radius:var(--md-radius);padding:0.75rem 1rem;">
                <div style="font-size:0.6875rem;font-weight:600;color:var(--md-text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:0.5rem;">
                    Backup Info
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.375rem;font-size:0.8125rem;">
                    <span style="color:var(--md-text-subtle);">Pages:</span>
                    <span style="color:var(--md-text);font-weight:500;">${m.pageCount}</span>
                    <span style="color:var(--md-text-subtle);">Space:</span>
                    <span style="color:var(--md-text);font-weight:500;">${escapeHtml(m.spaceName ?? m.spaceKey ?? '—')}</span>
                    <span style="color:var(--md-text-subtle);">Date:</span>
                    <span style="color:var(--md-text);font-weight:500;">${dateStr}</span>
                    <span style="color:var(--md-text-subtle);">Attachments:</span>
                    <span style="color:var(--md-text);font-weight:500;">${m.attachmentCount}</span>
                </div>
            </div>

            <div class="md-settings-section">
                <div class="md-settings-title">Target</div>
                <div style="display:flex;flex-direction:column;gap:0.5rem;">
                    <label style="font-size:0.8125rem;color:var(--md-text-subtle);">
                        Space Key
                        <input id="md-import-space" type="text" value="${escapeHtml(currentSpace)}"
                            style="display:block;width:100%;margin-top:0.25rem;padding:0.375rem 0.5rem;
                            border:1px solid var(--md-border);border-radius:var(--md-radius);
                            font-size:0.8125rem;font-family:var(--md-font);
                            background:var(--md-bg);color:var(--md-text);box-sizing:border-box;" />
                    </label>
                    <label style="font-size:0.8125rem;color:var(--md-text-subtle);">
                        Parent Page ID <span style="color:var(--md-text-muted);">(optional, empty = space root)</span>
                        <input id="md-import-parent" type="text" value="" placeholder="e.g. 12345678"
                            style="display:block;width:100%;margin-top:0.25rem;padding:0.375rem 0.5rem;
                            border:1px solid var(--md-border);border-radius:var(--md-radius);
                            font-size:0.8125rem;font-family:var(--md-font);
                            background:var(--md-bg);color:var(--md-text);box-sizing:border-box;" />
                    </label>
                </div>
            </div>

            <div class="md-settings-section">
                <div class="md-settings-title">Options</div>
                <label class="md-checkbox-label">
                    <input type="checkbox" id="md-import-skip-existing" checked />
                    Skip existing pages
                </label>
                <label class="md-checkbox-label">
                    <input type="checkbox" id="md-import-attachments" checked />
                    Include attachments
                </label>
            </div>

            <div style="display:flex;justify-content:flex-end;gap:0.5rem;padding-top:0.5rem;">
                <button class="md-btn md-btn-secondary" id="md-import-back">Back</button>
                <button class="md-btn md-btn-primary" id="md-import-start">Import</button>
            </div>
        </div>
    `;
}

// ============================================================================
// Phase: Progress
// ============================================================================

function buildProgress(): string {
    return `
        <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem;align-items:center;justify-content:center;min-height:10rem;">
            <div style="font-size:0.875rem;color:var(--md-text);font-weight:500;" id="md-import-phase-label">
                Starting import...
            </div>
            <div style="width:100%;">
                <div class="md-progress-bar" style="height:0.375rem;">
                    <div class="md-progress-fill" id="md-import-progress-fill" style="width:0%;"></div>
                </div>
            </div>
            <div style="font-size:0.75rem;color:var(--md-text-muted);" id="md-import-progress-detail">
                0 / 0
            </div>
        </div>
    `;
}

// ============================================================================
// Phase: Result
// ============================================================================

function buildResult(): string {
    const r = state.result!;
    const hasErrors = r.errors.length > 0;

    let errorList = '';
    if (hasErrors) {
        const items = r.errors
            .slice(0, 20)
            .map(e => `<li style="margin-bottom:0.25rem;"><strong>${escapeHtml(e.pageTitle)}</strong>: ${escapeHtml(e.error)}</li>`)
            .join('');
        const moreNote = r.errors.length > 20
            ? `<li style="color:var(--md-text-muted);">...and ${r.errors.length - 20} more</li>`
            : '';
        errorList = `
            <div style="margin-top:0.75rem;max-height:10rem;overflow-y:auto;
                background:var(--md-danger-light);border-radius:var(--md-radius);padding:0.75rem;">
                <ul style="margin:0;padding-left:1.25rem;font-size:0.75rem;color:var(--md-text);">
                    ${items}${moreNote}
                </ul>
            </div>
        `;
    }

    return `
        <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem;">
            <div style="text-align:center;font-size:1.5rem;">${hasErrors ? '⚠️' : '✅'}</div>
            <div style="display:flex;justify-content:center;gap:1.5rem;font-size:0.875rem;">
                <span style="color:var(--md-success);font-weight:500;">Created: ${r.created}</span>
                <span style="color:var(--md-text-muted);font-weight:500;">Skipped: ${r.skipped}</span>
                <span style="color:var(--md-danger);font-weight:500;">Failed: ${r.failed}</span>
            </div>
            ${errorList}
            <div style="display:flex;justify-content:center;padding-top:0.5rem;">
                <button class="md-btn md-btn-primary" id="md-import-done">Close</button>
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
    modal.querySelector('#md-import-close')?.addEventListener('click', closeImportModal);

    // Escape key
    const onKeyDown = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') {
            closeImportModal();
            document.removeEventListener('keydown', onKeyDown);
        }
    };
    document.addEventListener('keydown', onKeyDown);

    // Phase-specific listeners
    switch (state.phase) {
        case 'pick': attachFilePickerListeners(modal); break;
        case 'configure': attachConfigListeners(modal); break;
        case 'done': attachResultListeners(modal); break;
    }
}

function attachFilePickerListeners(modal: HTMLElement): void {
    const dropzone = modal.querySelector('#md-import-dropzone') as HTMLElement | null;
    const fileInput = modal.querySelector('#md-import-file-input') as HTMLInputElement | null;
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
        if (file) handleFileSelected(file);
    });

    fileInput.addEventListener('change', () => {
        const file = fileInput.files?.[0];
        if (file) handleFileSelected(file);
    });
}

function attachConfigListeners(modal: HTMLElement): void {
    modal.querySelector('#md-import-back')?.addEventListener('click', () => {
        state.phase = 'pick';
        state.file = null;
        state.manifest = null;
        renderImportModal();
    });

    modal.querySelector('#md-import-start')?.addEventListener('click', () => {
        void startImportProcess();
    });
}

function attachResultListeners(modal: HTMLElement): void {
    modal.querySelector('#md-import-done')?.addEventListener('click', closeImportModal);
}

// ============================================================================
// File handling
// ============================================================================

async function handleFileSelected(file: File): Promise<void> {
    ctmLog('[ImportModal] File selected:', file.name, file.size);

    try {
        const buffer = await file.arrayBuffer();
        const entries = unzipSync(new Uint8Array(buffer));
        const manifestData = entries['manifest.json'];

        if (!manifestData || manifestData.length === 0) {
            alert('Invalid backup file: manifest.json not found.');
            return;
        }

        const text = new TextDecoder().decode(manifestData);
        const manifest = JSON.parse(text) as BackupManifest;

        state.file = file;
        state.manifest = manifest;
        state.phase = 'configure';
        renderImportModal();
    } catch (error) {
        ctmError('[ImportModal] Failed to parse file:', error);
        alert('Failed to read backup file. Make sure it is a valid .cfb.zip.');
    }
}

// ============================================================================
// Import process
// ============================================================================

async function startImportProcess(): Promise<void> {
    const modal = document.getElementById(MODAL_ID);
    if (!modal || !state.file) return;

    const spaceInput = modal.querySelector('#md-import-space') as HTMLInputElement;
    const parentInput = modal.querySelector('#md-import-parent') as HTMLInputElement;
    const skipCheckbox = modal.querySelector('#md-import-skip-existing') as HTMLInputElement;
    const attachCheckbox = modal.querySelector('#md-import-attachments') as HTMLInputElement;

    const spaceKey = spaceInput?.value.trim();
    if (!spaceKey) {
        alert('Space Key is required.');
        return;
    }

    const options: ImportOptions = {
        targetSpaceKey: spaceKey,
        parentPageId: parentInput?.value.trim() || null,
        skipExisting: skipCheckbox?.checked ?? true,
        includeAttachments: attachCheckbox?.checked ?? true,
    };

    state.phase = 'importing';
    renderImportModal();

    try {
        const result = await importConfluenceBackup(
            state.file,
            options,
            (phase, current, total) => {
                updateProgress(phase, current, total);
            }
        );

        state.result = result;
        state.phase = 'done';
        renderImportModal();
    } catch (error) {
        ctmError('[ImportModal] Import failed:', error);
        state.result = {
            created: 0,
            skipped: 0,
            failed: 1,
            errors: [{ pageTitle: '(import)', error: error instanceof Error ? error.message : String(error) }],
        };
        state.phase = 'done';
        renderImportModal();
    }
}

function updateProgress(phase: string, current: number, total: number): void {
    const label = document.getElementById('md-import-phase-label');
    const fill = document.getElementById('md-import-progress-fill');
    const detail = document.getElementById('md-import-progress-detail');

    if (label) label.textContent = phase;
    if (detail) detail.textContent = `${current} / ${total}`;
    if (fill) {
        const pct = total > 0 ? Math.round((current / total) * 100) : 0;
        fill.style.width = `${pct}%`;
    }
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
