export type ConfluenceErrorCategory =
    | 'auth'
    | 'forbidden'
    | 'rate_limited'
    | 'cors_network'
    | 'unknown';

export interface ConfluenceErrorDetails {
    category: ConfluenceErrorCategory;
    /** Optional HTTP status code when available */
    status?: number;
    /** Request URL (useful for debugging/logging) */
    url?: string;
    /** Retry-After hint (milliseconds) when available */
    retryAfterMs?: number;
    /** Technical message (for logs); user message is derived from category */
    technicalMessage?: string;
}

export class ConfluenceApiError extends Error {
    public readonly category: ConfluenceErrorCategory;
    public readonly status?: number;
    public readonly url?: string;
    public readonly retryAfterMs?: number;
    public readonly technicalMessage?: string;

    constructor(details: ConfluenceErrorDetails, options?: { cause?: unknown }) {
        super(getUserMessageForConfluenceError(details));
        this.name = 'ConfluenceApiError';
        this.category = details.category;
        this.status = details.status;
        this.url = details.url;
        this.retryAfterMs = details.retryAfterMs;
        this.technicalMessage = details.technicalMessage;

        // Preserve cause for debugging in supported runtimes
        if (options?.cause !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this as any).cause = options.cause;
        }
    }
}

export function categorizeConfluenceStatus(status?: number): ConfluenceErrorCategory {
    if (status === 401) return 'auth';
    if (status === 403) return 'forbidden';
    if (status === 429) return 'rate_limited';
    return 'unknown';
}

export function getUserMessageForConfluenceError(details: ConfluenceErrorDetails): string {
    switch (details.category) {
        case 'auth':
            return 'Not authenticated in Confluence. Please sign in in this browser tab and try again.';
        case 'forbidden':
            return 'Access forbidden (403). You may not have permission to view this content.';
        case 'rate_limited': {
            const extra =
                typeof details.retryAfterMs === 'number' && Number.isFinite(details.retryAfterMs)
                    ? ` Please wait ~${Math.max(1, Math.ceil(details.retryAfterMs / 1000))}s and retry.`
                    : ' Please wait a bit and retry.';
            return `Rate limited by Confluence (429).${extra}`;
        }
        case 'cors_network':
            return 'Network/CORS error while contacting Confluence. Try reloading the page; if using the extension, ensure it is enabled.';
        case 'unknown':
        default:
            return 'Unexpected error while contacting Confluence.';
    }
}

function tryParseHttpStatusFromMessage(message: string): number | undefined {
    // Common patterns used in this codebase: "HTTP 403: Forbidden", "API error 403: ..."
    const m = message.match(/\b(?:HTTP|API\s+error)\s+(\d{3})\b/i);
    if (!m) return undefined;
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : undefined;
}

function looksLikeCorsOrNetworkErrorMessage(message: string): boolean {
    const m = message.toLowerCase();
    return (
        m.includes('failed to fetch') ||
        m.includes('network error') ||
        m.includes('networkerror') ||
        m.includes('cors')
    );
}

/**
 * Convert an unknown error into a structured ConfluenceApiError.
 * This is intentionally conservative: if status/category are unknown, we fall back to 'unknown'.
 */
export function toConfluenceApiError(
    error: unknown,
    context?: { url?: string; status?: number; retryAfterMs?: number }
): ConfluenceApiError {
    if (error instanceof ConfluenceApiError) {
        return error;
    }

    const technicalMessage = error instanceof Error ? error.message : String(error);
    const inferredStatus = context?.status ?? tryParseHttpStatusFromMessage(technicalMessage);
    const inferredCategory =
        inferredStatus !== undefined
            ? categorizeConfluenceStatus(inferredStatus)
            : looksLikeCorsOrNetworkErrorMessage(technicalMessage)
              ? 'cors_network'
              : technicalMessage.includes('429')
                ? 'rate_limited'
                : 'unknown';

    return new ConfluenceApiError(
        {
            category: inferredCategory,
            status: inferredStatus,
            url: context?.url,
            retryAfterMs: context?.retryAfterMs,
            technicalMessage,
        },
        { cause: error }
    );
}

/**
 * Parse a `Retry-After` header value into milliseconds.
 *
 * Supports both forms from RFC 7231 §7.1.3:
 *  - delta-seconds (integer): `"120"` → 120_000
 *  - HTTP-date: `"Wed, 21 Oct 2015 07:28:00 GMT"` → ms until that point (>=0)
 *
 * Returns `undefined` for null/empty/unparseable input.
 */
export function parseRetryAfter(value: string | null | undefined): number | undefined {
    if (value == null) return undefined;
    const trimmed = String(value).trim();
    if (trimmed.length === 0) return undefined;

    // delta-seconds — pure integer (RFC allows only integers, no decimals)
    if (/^\d+$/.test(trimmed)) {
        const seconds = Number(trimmed);
        if (Number.isFinite(seconds)) return seconds * 1000;
    }

    // HTTP-date
    const dateMs = Date.parse(trimmed);
    if (!Number.isNaN(dateMs)) {
        const delta = dateMs - Date.now();
        return delta > 0 ? delta : 0;
    }

    return undefined;
}
