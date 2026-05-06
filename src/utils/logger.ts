/** Centralized logger for Confluence To Markdown. Survives Terser minification. */
const _log = (typeof unsafeWindow !== 'undefined' ? unsafeWindow.console : console).log;
const _error = (typeof unsafeWindow !== 'undefined' ? unsafeWindow.console : console).error;
const _warn = (typeof unsafeWindow !== 'undefined' ? unsafeWindow.console : console).warn;

export function ctmLog(...args: unknown[]): void {
    _log('[CTM]', ...args);
}
export function ctmError(...args: unknown[]): void {
    _error('[CTM]', ...args);
}
export function ctmWarn(...args: unknown[]): void {
    _warn('[CTM]', ...args);
}
