/**
 * Structured error reporting.
 *
 * On Tampermonkey, persists last 10 errors to `GM_setValue('export_error_history', ...)`
 * so users can paste their history when reporting bugs. Falls back to console
 * elsewhere. Always emits `ctmError` so caught exceptions are visible in dev tools.
 */

import { ctmError } from './logger';

const HISTORY_KEY = 'export_error_history';
const MAX_HISTORY = 10;

interface ErrorPayload {
    timestamp: string;
    version: string;
    context: string;
    message: string;
    stack?: string;
    [extra: string]: unknown;
}

function getScriptVersion(): string {
    try {
        if (typeof GM_info !== 'undefined' && GM_info?.script?.version) {
            return GM_info.script.version;
        }
    } catch {
        // GM_info not available — use fallback
    }
    return 'unknown';
}

function persistToHistory(payload: ErrorPayload): void {
    if (typeof GM_setValue === 'undefined') return;
    try {
        const raw = GM_getValue<string>(HISTORY_KEY, '[]');
        const history: ErrorPayload[] = raw ? JSON.parse(raw) : [];
        history.unshift(payload);
        if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
        GM_setValue(HISTORY_KEY, JSON.stringify(history));
    } catch {
        // ignore storage errors — history is best-effort
    }
}

/**
 * Log a structured error with context. Emits to console immediately and
 * persists to GM_setValue history when available.
 *
 * @param error - The thrown value (Error preferred, anything else is stringified)
 * @param context - Short string identifying the call site (e.g., 'pageExport:obsidian')
 * @param extra - Optional metadata (pageId, action, etc) — avoid PII
 */
export function logError(
    error: unknown,
    context: string,
    extra?: Record<string, unknown>
): void {
    const err = error instanceof Error ? error : new Error(String(error));
    const payload: ErrorPayload = {
        timestamp: new Date().toISOString(),
        version: getScriptVersion(),
        context,
        message: err.message,
        stack: err.stack,
        ...(extra ?? {}),
    };

    ctmError(`ERROR in ${context}:`, payload);
    persistToHistory(payload);
}
