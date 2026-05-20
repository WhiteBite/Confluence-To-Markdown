/** Max concurrent API requests for metadata (avoid 429 rate limiting) */
export const MAX_CONCURRENCY = 6;

/** Max concurrent downloads for binary attachments (CDN-like, higher throughput) */
export const MAX_DOWNLOAD_CONCURRENCY = 12;

/** API pagination limit */
export const PAGE_LIMIT = 50;

/**
 * Verbose debug flag for legacy callers in core/. New code should use
 * `isCtmDebug()` from `@/utils/logger`. Kept here for backwards compatibility
 * with `attachment-handler`, `content-loader`, `diagram-processor`, `sanitizer`,
 * `diagrams/converter` which guard verbose `ctmError` with `if (DEBUG)`.
 */
export const DEBUG = false;

/** API expand parameters - only what we need */
export const EXPAND_CONTENT = 'body.view,ancestors,version';

/** API retry policy for rate limiting (429) */
export const RATE_LIMIT_MAX_RETRIES = 3;
/** Base backoff delay for 429 retry (ms) */
export const RATE_LIMIT_BASE_DELAY_MS = 1000;
/** Maximum backoff delay for 429 retry (ms) */
export const RATE_LIMIT_MAX_DELAY_MS = 10_000;

/** Default request timeout for all transport-level fetches (ms) */
export const FETCH_TIMEOUT_MS = 30_000;
