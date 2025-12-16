/** Max concurrent API requests (avoid 429 rate limiting) */
export const MAX_CONCURRENCY = 6;

/** API pagination limit */
export const PAGE_LIMIT = 50;

/** Enable debug logging */
export const DEBUG = false;

/** API expand parameters - only what we need */
export const EXPAND_CONTENT = 'body.view,ancestors,version';
