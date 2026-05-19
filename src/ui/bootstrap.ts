/**
 * UI bootstrap: inject export buttons into the Confluence page header,
 * watch for SPA navigation, retry on async meta-loading.
 *
 * Designed to be the SOLE entry-point UI logic — `main.ts` should call
 * `bootstrap(...)` once and never touch DOM directly.
 */

import { createButton, createStatus } from './components';
import {
    getCurrentPageId,
    getSpaceKey,
    findActionMenuContainer,
} from '@/utils/helpers';
import { ctmLog } from '@/utils/logger';
import { isHubConfigured } from '@/storage/hub-settings';

const PAGE_BUTTON_ID = 'md-export-trigger';
const SPACE_BUTTON_ID = 'md-space-export-trigger';
const IMPORT_BUTTON_ID = 'md-import-trigger';
const HUB_BUTTON_ID = 'md-hub-trigger';
const HUB_SETTINGS_ID = 'md-hub-settings-trigger';
const STATUS_ID = 'md-export-status';

const RETRY_INTERVAL_MS = 1000;
const MAX_RETRIES = 5;

export interface BootstrapCallbacks {
    /** Triggered when "Export to Markdown" is clicked */
    onPageExport: () => void;
    /** Triggered when "Export Space" is clicked */
    onSpaceExport: () => void;
    /** Triggered when "Import Backup" is clicked */
    onImport: () => void;
    /** Triggered when "Привязать к Hub" is clicked. Optional — button hidden if absent. */
    onHubLink?: () => void;
    /** Triggered when ⚙ Hub settings is clicked */
    onHubSettings: () => void;
}

/** Module-level callback storage so re-injection on SPA nav uses the same handlers. */
let activeCallbacks: BootstrapCallbacks | null = null;

/**
 * Initialize UI: inject buttons, observe SPA navigation. Idempotent.
 */
export function bootstrap(callbacks: BootstrapCallbacks): void {
    activeCallbacks = callbacks;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
}

// ============================================================================
// Init flow
// ============================================================================

function init(): void {
    ctmLog('init() called — readyState:', document.readyState, 'URL:', window.location.href);
    addExportButtons();
    scheduleRetry();
    setupSpaWatcher();
    triggerHubSyncCheck();
}

/** Retry button injection a few times for slow-loading Confluence Server pages. */
function scheduleRetry(): void {
    let retries = 0;
    const handle = setInterval(() => {
        retries++;
        if (hasButtonsInjected()) {
            ctmLog(`init retry ${retries}: buttons found, stopping retries`);
            clearInterval(handle);
            return;
        }
        ctmLog(`init retry ${retries}/${MAX_RETRIES}: buttons not found, trying again`);
        addExportButtons();
        if (retries >= MAX_RETRIES) {
            ctmLog('init: max retries reached');
            clearInterval(handle);
        }
    }, RETRY_INTERVAL_MS);
}

function setupSpaWatcher(): void {
    let lastHref = location.href;
    const observer = new MutationObserver(() => {
        if (location.href !== lastHref) {
            lastHref = location.href;
            ctmLog('SPA navigation detected:', window.location.href);
            setTimeout(addExportButtons, 500);
            setTimeout(triggerHubSyncCheck, 1000);
            return;
        }
        // Buttons may have been wiped by Confluence DOM updates (filter changes etc).
        if (
            !document.getElementById(PAGE_BUTTON_ID) &&
            findActionMenuContainer()
        ) {
            ctmLog('MutationObserver: buttons missing but container found, retrying');
            setTimeout(addExportButtons, 200);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function triggerHubSyncCheck(): void {
    if (!isHubConfigured()) return;
    void import('@/hub/sync-checker').then(({ checkForUpdates, updateBadge }) => {
        checkForUpdates().then(updateBadge);
    });
}

// ============================================================================
// Button injection
// ============================================================================

function hasButtonsInjected(): boolean {
    return !!(
        document.getElementById(PAGE_BUTTON_ID) ||
        document.getElementById(SPACE_BUTTON_ID)
    );
}

function addExportButtons(): void {
    if (!activeCallbacks) return;
    if (document.getElementById(PAGE_BUTTON_ID)) {
        ctmLog('addExportButtons: already injected');
        return;
    }

    const pageId = getCurrentPageId();
    const spaceKey = getSpaceKey();
    ctmLog('addExportButtons: pageId=', pageId, 'spaceKey=', spaceKey);

    const container = findActionMenuContainer();
    if (!container) {
        ctmLog('addExportButtons: container NOT found');
        return;
    }
    ctmLog(
        'addExportButtons: container found, tagName=',
        container.tagName,
        'class=',
        container.className?.substring(0, 50)
    );

    if (pageId) injectPageButton(container);
    if (spaceKey) injectSpaceButton(container);
    injectImportButton(container);
    if (isHubConfigured() && activeCallbacks.onHubLink) injectHubButton(container);
    injectHubSettingsButton(container);
}

function injectPageButton(container: Element): void {
    if (!activeCallbacks) return;
    const btn = createButton(
        'Export to Markdown',
        'aui-button',
        activeCallbacks.onPageExport
    );
    btn.id = PAGE_BUTTON_ID;
    container.appendChild(btn);

    if (!document.getElementById(STATUS_ID)) {
        container.appendChild(createStatus());
    }
    ctmLog('addExportButtons: PAGE export button added');
}

function injectSpaceButton(container: Element): void {
    if (!activeCallbacks) return;
    if (document.getElementById(SPACE_BUTTON_ID)) return;

    const btn = createButton(
        'Export Space',
        'aui-button aui-button-secondary',
        activeCallbacks.onSpaceExport
    );
    btn.id = SPACE_BUTTON_ID;
    btn.style.marginLeft = '8px';

    const pageBtn = document.getElementById(PAGE_BUTTON_ID);
    if (pageBtn) {
        pageBtn.parentElement?.insertBefore(btn, pageBtn.nextSibling);
    } else {
        container.appendChild(btn);
    }
    ctmLog('addExportButtons: SPACE export button added');
}

function injectImportButton(container: Element): void {
    if (!activeCallbacks) return;
    if (document.getElementById(IMPORT_BUTTON_ID)) return;

    const btn = createButton(
        'Import Backup',
        'aui-button aui-button-secondary',
        activeCallbacks.onImport
    );
    btn.id = IMPORT_BUTTON_ID;
    btn.style.marginLeft = '8px';

    const spaceBtn = document.getElementById(SPACE_BUTTON_ID);
    if (spaceBtn) {
        spaceBtn.parentElement?.insertBefore(btn, spaceBtn.nextSibling);
    } else {
        const pageBtn = document.getElementById(PAGE_BUTTON_ID);
        if (pageBtn) {
            pageBtn.parentElement?.insertBefore(btn, pageBtn.nextSibling);
        } else {
            container.appendChild(btn);
        }
    }
    ctmLog('addExportButtons: IMPORT button added');
}

function injectHubButton(container: Element): void {
    if (!activeCallbacks?.onHubLink) return;
    if (document.getElementById(HUB_BUTTON_ID)) return;
    const btn = createButton(
        '📡 Привязать к Hub',
        'aui-button hub-button',
        activeCallbacks.onHubLink
    );
    btn.id = HUB_BUTTON_ID;
    container.appendChild(btn);
}

function injectHubSettingsButton(container: Element): void {
    if (!activeCallbacks) return;
    if (document.getElementById(HUB_SETTINGS_ID)) return;

    const btn = document.createElement('button');
    btn.id = HUB_SETTINGS_ID;
    btn.className = 'aui-button md-hub-settings-btn-inline';
    btn.title = 'Hub Settings';
    btn.textContent = '⚙️';
    btn.style.cssText =
        'margin-left:4px;padding:0 6px;min-width:auto;font-size:0.85em;';
    btn.addEventListener('click', activeCallbacks.onHubSettings);
    container.appendChild(btn);
}
