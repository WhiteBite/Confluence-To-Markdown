/**
 * Tests for src/ui/modal/handlers/events.ts
 *
 * Covers:
 *   WP2 — backup mode always shows #md-attachment-filter-card
 *   WP6 — second export click while one is processing is blocked
 *         with a visual shake on .md-selection-count
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock all side-effectful module imports before importing the module under test.
// vi.mock() is hoisted — factory functions must not reference variables
// declared in the same file (they haven't been initialised yet at hoist time).
// Access mocks via vi.mocked() after import.
// ---------------------------------------------------------------------------

const mockObsidianSettings: Record<string, unknown> = { exportFormat: 'single' };

vi.mock('../src/ui/modal/handlers/settings', () => ({
    saveCurrentSettings: vi.fn(),
    updateObsidianSettingsUI: vi.fn(),
    updateCopyButtonState: vi.fn(),
    updateDiagramOptionsVisibility: vi.fn(),
    setRootNode: vi.fn(),
    getCurrentSettings: vi.fn(() => ({})),
    setCurrentSettings: vi.fn(),
    getCurrentObsidianSettings: vi.fn(() => mockObsidianSettings),
    setCurrentObsidianSettings: vi.fn(),
}));

vi.mock('@/storage/storage', () => ({
    loadSettings: vi.fn(() => ({})),
    saveSettings: vi.fn(),
    loadObsidianSettings: vi.fn(() => ({})),
    saveObsidianSettings: vi.fn(),
    applyPreset: vi.fn(() => ({})),
}));

vi.mock('../src/ui/modal/handlers/tree', () => ({
    getSelectedIds: vi.fn(() => []),
    filterTree: vi.fn(),
    applyFilter: vi.fn(),
}));

vi.mock('../src/ui/modal/handlers/interaction', () => ({
    shakeElement: vi.fn(),
    isInputFocused: vi.fn(() => false),
    togglePanel: vi.fn(),
    handleToggleTheme: vi.fn(),
}));

vi.mock('../src/ui/modal/view', () => ({
    updateSelectionCount: vi.fn(),
}));

vi.mock('../src/ui/i18n', () => ({
    t: vi.fn((key: string) => key),
    toggleLocale: vi.fn(() => 'en'),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks so vi.mocked() resolves the mock instances)
// ---------------------------------------------------------------------------

import { setupEventListeners } from '../src/ui/modal/handlers/events';
import type { HandlerDependencies } from '../src/ui/modal/handlers/events';
import * as interactionMod from '../src/ui/modal/handlers/interaction';
import * as treeMod from '../src/ui/modal/handlers/tree';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal modal DOM with every element the event handlers reference */
function buildModalElement(): HTMLElement {
    const el = document.createElement('div');
    el.innerHTML = `
        <!-- Format pills -->
        <button class="md-pill" data-format="single">Single MD</button>
        <button class="md-pill" data-format="obsidian">Obsidian</button>
        <button class="md-pill" data-format="backup">Backup</button>

        <!-- Cards toggled by format pills -->
        <div id="md-content-card"></div>
        <div id="md-diagrams-card"></div>
        <div id="md-obsidian-options"></div>
        <div id="md-attachment-filter-card" style="display: none;"></div>

        <!-- Action buttons -->
        <button id="md-download-btn" data-action="download">Download</button>
        <button data-action="copy">Copy</button>
        <button data-action="pdf">PDF</button>
        <button data-action="cancel">Cancel</button>

        <!-- Progress section -->
        <div id="md-progress-section" style="display: none;"></div>
        <button id="md-cancel-export">Cancel export</button>

        <!-- Selection count (shake target for WP6) -->
        <span class="md-selection-count">0</span>

        <!-- Search -->
        <input id="md-search-input" />
        <span id="md-search-clear" style="display: none;"></span>
    `;
    return el;
}

/** Minimal mock HandlerDependencies */
function buildDeps(element: HTMLElement, onAction = vi.fn(async () => undefined)): HandlerDependencies {
    return {
        element,
        rootNode: { id: '1', title: 'Root', children: [], spaceKey: '' } as never,
        callbacks: {
            onAction: onAction as never,
            onRefresh: vi.fn(async () => ({ id: '1', title: 'Root', children: [], spaceKey: '' } as never)),
            onScopeChange: vi.fn(),
        },
        getState: vi.fn(() => 'ready' as const),
        setState: vi.fn(),
        close: vi.fn(),
        updateTree: vi.fn(),
        updateStats: vi.fn(),
    };
}

function click(el: Element): void {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

// ---------------------------------------------------------------------------
// WP2 — backup pill shows the attachment filter card
// ---------------------------------------------------------------------------

describe('WP2: handleFormatPillClick — attachment filter visibility', () => {
    let element: HTMLElement;
    let cleanup: () => void;

    beforeEach(() => {
        mockObsidianSettings.exportFormat = 'single';
        vi.mocked(interactionMod.shakeElement).mockClear();

        element = buildModalElement();
        cleanup = setupEventListeners(buildDeps(element));
    });

    afterEach(() => cleanup());

    it('shows #md-attachment-filter-card when backup pill is clicked', () => {
        const card = element.querySelector<HTMLElement>('#md-attachment-filter-card')!;
        card.style.display = 'none';

        click(element.querySelector('.md-pill[data-format="backup"]')!);

        expect(card.style.display).toBe('block');
    });

    it('hides #md-attachment-filter-card when single pill is clicked', () => {
        const card = element.querySelector<HTMLElement>('#md-attachment-filter-card')!;
        card.style.display = 'block';

        mockObsidianSettings.exportFormat = 'single';
        click(element.querySelector('.md-pill[data-format="single"]')!);

        expect(card.style.display).toBe('none');
    });

    it('shows #md-attachment-filter-card when obsidian pill is clicked', () => {
        const card = element.querySelector<HTMLElement>('#md-attachment-filter-card')!;
        card.style.display = 'none';

        mockObsidianSettings.exportFormat = 'obsidian';
        click(element.querySelector('.md-pill[data-format="obsidian"]')!);

        expect(card.style.display).toBe('block');
    });

    it('overrides a previously hidden card when switching single → backup', () => {
        const card = element.querySelector<HTMLElement>('#md-attachment-filter-card')!;

        // Put UI into single mode (card hidden)
        mockObsidianSettings.exportFormat = 'single';
        click(element.querySelector('.md-pill[data-format="single"]')!);
        expect(card.style.display).toBe('none');

        // Switch to backup — card must appear regardless of prior state
        click(element.querySelector('.md-pill[data-format="backup"]')!);
        expect(card.style.display).toBe('block');
    });
});

// ---------------------------------------------------------------------------
// WP6 — parallel export protection
// ---------------------------------------------------------------------------

describe('WP6: handleActionClick — parallel export protection', () => {
    let element: HTMLElement;
    let cleanup: () => void;
    let onAction: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockObsidianSettings.exportFormat = 'single';
        vi.mocked(interactionMod.shakeElement).mockClear();

        // Return at least one selected page so export passes the empty-selection guard
        vi.mocked(treeMod.getSelectedIds).mockReturnValue(['page-1']);

        element = buildModalElement();
        onAction = vi.fn(() => new Promise<void>(() => { /* never resolves — simulates long-running export */ }));
        cleanup = setupEventListeners(buildDeps(element, onAction));
    });

    afterEach(() => cleanup());

    it('ignores a second export click while one is processing', () => {
        const btn = element.querySelector<HTMLButtonElement>('#md-download-btn')!;

        // First click starts the export
        click(btn);
        // Simulate the handler marking this button as in-progress
        btn.setAttribute('data-processing', 'true');

        // Second click must be rejected
        click(btn);

        expect(onAction).toHaveBeenCalledTimes(1);
    });

    it('shakes .md-selection-count when a second export click is blocked', () => {
        const btn = element.querySelector<HTMLButtonElement>('#md-download-btn')!;

        click(btn);
        btn.setAttribute('data-processing', 'true');

        click(btn);

        expect(vi.mocked(interactionMod.shakeElement)).toHaveBeenCalledWith(
            element.querySelector('.md-selection-count'),
        );
    });

    it('allows a new export once data-processing is cleared (guard is attr-based)', () => {
        const btn = element.querySelector<HTMLButtonElement>('#md-download-btn')!;

        // First export starts — guard sets data-processing
        click(btn);
        btn.setAttribute('data-processing', 'true');
        expect(onAction).toHaveBeenCalledTimes(1);

        // Simulate export completion: finally block removes data-processing
        btn.removeAttribute('data-processing');
        btn.disabled = false;

        // Second export must now be allowed
        click(btn);
        expect(onAction).toHaveBeenCalledTimes(2);
    });
});
