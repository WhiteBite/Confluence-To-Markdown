/**
 * Centralized logger for Confluence To Markdown.
 *
 * Captures `console.log/error/warn` references at module load to survive
 * Terser's `drop_console` (which only removes direct `console.xxx()` calls,
 * not calls through a captured reference). Without this trick the production
 * bundle would have NO logs at all — including ctmError for caught exceptions.
 *
 * Debug flag resolution (priority order):
 *   1. localStorage.getItem('ctm-debug') === '1'  (user override, persists)
 *   2. GM_info?.script?.version endsWith '-dev'   (Tampermonkey dev build)
 *   3. false                                       (production default)
 *
 * The flag is cached after first read; use `setCtmDebug(boolean)` to change at runtime.
 */

// --- Console capture (Terser-safe) ----------------------------------------
const _console = (typeof unsafeWindow !== 'undefined' ? unsafeWindow.console : console);
const _log = _console.log.bind(_console);
const _error = _console.error.bind(_console);
const _warn = _console.warn.bind(_console);

// --- Debug flag state -----------------------------------------------------
const STORAGE_KEY = 'ctm-debug';

let cachedDebug: boolean | null = null;

/** Read the debug flag from sources (priority: localStorage > GM_info dev > false). */
function readDebugFlag(): boolean {
    // 1. localStorage user override
    try {
        if (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === '1') {
            return true;
        }
    } catch {
        // localStorage may throw in sandboxed contexts — ignore
    }

    // 2. GM_info dev build heuristic
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const gm = (typeof GM_info !== 'undefined' ? GM_info : undefined) as any;
        const version: string | undefined = gm?.script?.version;
        if (typeof version === 'string' && version.endsWith('-dev')) {
            return true;
        }
    } catch {
        // GM_info might not exist in extension/test contexts
    }

    // 3. Default: off
    return false;
}

function getDebug(): boolean {
    if (cachedDebug === null) {
        cachedDebug = readDebugFlag();
    }
    return cachedDebug;
}

// --- Public API -----------------------------------------------------------

/** Verbose info log. Only emitted when debug is enabled. */
export function ctmLog(...args: unknown[]): void {
    if (!getDebug()) return;
    _log('[CTM]', ...args);
}

/** Warning log. Only emitted when debug is enabled. */
export function ctmWarn(...args: unknown[]): void {
    if (!getDebug()) return;
    _warn('[CTM]', ...args);
}

/** Error log. ALWAYS emitted (used for caught exceptions). */
export function ctmError(...args: unknown[]): void {
    _error('[CTM]', ...args);
}

/**
 * Enable/disable debug logging at runtime. Persists via localStorage so the
 * choice survives page reloads. Returns the new effective state.
 */
export function setCtmDebug(enabled: boolean): boolean {
    try {
        if (typeof localStorage !== 'undefined') {
            if (enabled) {
                localStorage.setItem(STORAGE_KEY, '1');
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    } catch {
        // ignore storage errors — fall back to in-memory cache only
    }
    cachedDebug = enabled;
    return cachedDebug;
}

/** Current debug state (re-reads cache). */
export function isCtmDebug(): boolean {
    return getDebug();
}

/**
 * Attach `window.__ctmDebug` helper for end-users / dev tools.
 *   window.__ctmDebug.enable()  -> turn on, persists
 *   window.__ctmDebug.disable() -> turn off, persists
 *   window.__ctmDebug.status()  -> current state (boolean)
 *
 * Idempotent: safe to call more than once.
 */
export function attachDebugHelpers(): void {
    if (typeof window === 'undefined') return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__ctmDebug = {
        enable: () => setCtmDebug(true),
        disable: () => setCtmDebug(false),
        status: () => isCtmDebug(),
    };
}
