/**
 * Backwards-compatible facade over the unified transport layer.
 *
 * Historical callers imported `fetchJson`/`fetchBlob`/`fetchText` from here.
 * All real logic now lives in `./transport`. Use that module for new code,
 * especially when you need timeouts/cancellation/non-GET requests.
 */
export { fetchJson, fetchBlob, fetchText } from './transport';
export type { TransportOptions } from './transport';
