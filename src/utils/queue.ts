/** Concurrency pool + retry logic for rate-limited API requests. */

import {
    RATE_LIMIT_MAX_RETRIES,
    RATE_LIMIT_BASE_DELAY_MS,
    RATE_LIMIT_MAX_DELAY_MS,
} from '@/config';
import { ConfluenceApiError } from '@/api/errors';

export interface QueueOptions {
    concurrency: number;
    onProgress?: (completed: number, total: number) => void;
    /**
     * If true (default), the first task error rejects the whole batch
     * (after all in-flight tasks settle). If false, errors are swallowed
     * into the result slot — callers MUST inspect entries with type guards.
     */
    bailOnError?: boolean;
    /** Caller-side cancellation. Stops scheduling new tasks. */
    signal?: AbortSignal;
}

/**
 * Run async tasks with limited concurrency.
 *
 * Properties:
 *  - One failing worker does NOT block siblings; failures surface after
 *    in-flight tasks finish (default `bailOnError: true`).
 *  - Order is preserved (results[i] aligns with items[i]).
 *  - With `bailOnError: false`, returns may include `Error` instances —
 *    use `instanceof Error` to discriminate.
 */
export function runWithConcurrency<T, R>(
    items: T[],
    fn: (item: T, index: number) => Promise<R>,
    options: QueueOptions & { bailOnError?: true | undefined }
): Promise<R[]>;
export function runWithConcurrency<T, R>(
    items: T[],
    fn: (item: T, index: number) => Promise<R>,
    options: QueueOptions & { bailOnError: false }
): Promise<Array<R | Error>>;
export async function runWithConcurrency<T, R>(
    items: T[],
    fn: (item: T, index: number) => Promise<R>,
    options: QueueOptions
): Promise<Array<R | Error>> {
    const { concurrency, onProgress, signal } = options;
    const bailOnError = options.bailOnError ?? true;
    const results: Array<R | Error> = new Array(items.length);
    let completed = 0;
    let currentIndex = 0;
    let aborted = false;

    if (signal?.aborted) throw makeAbortError();

    const onAbort = (): void => {
        aborted = true;
    };
    if (signal) signal.addEventListener('abort', onAbort, { once: true });

    async function worker(): Promise<void> {
        while (currentIndex < items.length) {
            if (aborted) return;
            const index = currentIndex++;
            const item = items[index];

            try {
                results[index] = await fn(item, index);
            } catch (err) {
                if (bailOnError) {
                    throw err;
                }
                results[index] = err instanceof Error ? err : new Error(String(err));
            } finally {
                completed++;
                onProgress?.(completed, items.length);
            }
        }
    }

    try {
        const workerCount = Math.max(1, Math.min(concurrency, items.length));
        const workers: Promise<void>[] = [];
        for (let i = 0; i < workerCount; i++) workers.push(worker());

        const settled = await Promise.allSettled(workers);
        if (signal?.aborted) throw makeAbortError();

        if (bailOnError) {
            const firstFailure = settled.find(
                (r): r is PromiseRejectedResult => r.status === 'rejected'
            );
            if (firstFailure) throw firstFailure.reason;
        }
        return results;
    } finally {
        if (signal) signal.removeEventListener('abort', onAbort);
    }
}

/** Delay helper for rate limiting. Aborts immediately on signal. */
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(makeAbortError());
            return;
        }
        const onAbort = (): void => {
            clearTimeout(timeoutId);
            reject(makeAbortError());
        };
        const timeoutId = setTimeout(() => {
            if (signal) signal.removeEventListener('abort', onAbort);
            resolve();
        }, ms);
        if (signal) signal.addEventListener('abort', onAbort, { once: true });
    });
}

export interface RetryOptions {
    /** Max retry attempts (after the initial try). Defaults to {@link RATE_LIMIT_MAX_RETRIES}. */
    maxRetries?: number;
    /** Base backoff delay in ms. Defaults to {@link RATE_LIMIT_BASE_DELAY_MS}. */
    baseDelayMs?: number;
    /** Hard cap on backoff delay in ms. Defaults to {@link RATE_LIMIT_MAX_DELAY_MS}. */
    maxDelayMs?: number;
    /** Caller-side cancellation. */
    signal?: AbortSignal;
}

/** Backwards-compat positional signature: withRetry(fn, maxRetries?, baseDelay?). */
export function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries?: number,
    baseDelay?: number
): Promise<T>;
/** Options-object signature: withRetry(fn, { maxRetries, baseDelayMs, maxDelayMs, signal }). */
export function withRetry<T>(fn: () => Promise<T>, opts?: RetryOptions): Promise<T>;
export async function withRetry<T>(
    fn: () => Promise<T>,
    optsOrMaxRetries?: RetryOptions | number,
    legacyBaseDelay?: number
): Promise<T> {
    const opts = normalizeRetryOptions(optsOrMaxRetries, legacyBaseDelay);
    const { maxRetries, baseDelayMs, maxDelayMs, signal } = opts;

    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (signal?.aborted) throw makeAbortError();

        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Caller-aborted (AbortError) bypasses retry policy entirely.
            if (isAbortError(error)) throw error;

            if (!isRetryable(error)) throw error;
            if (attempt === maxRetries) break;

            const wait = computeRetryDelay(error, attempt, baseDelayMs, maxDelayMs);
            await delay(wait, signal);
        }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

// ============================================================================
// Internal helpers
// ============================================================================

function normalizeRetryOptions(
    optsOrMaxRetries: RetryOptions | number | undefined,
    legacyBaseDelay: number | undefined
): Required<Omit<RetryOptions, 'signal'>> & { signal?: AbortSignal } {
    if (typeof optsOrMaxRetries === 'number') {
        return {
            maxRetries: optsOrMaxRetries,
            baseDelayMs: legacyBaseDelay ?? RATE_LIMIT_BASE_DELAY_MS,
            maxDelayMs: RATE_LIMIT_MAX_DELAY_MS,
        };
    }
    const o = optsOrMaxRetries ?? {};
    return {
        maxRetries: o.maxRetries ?? RATE_LIMIT_MAX_RETRIES,
        baseDelayMs: o.baseDelayMs ?? RATE_LIMIT_BASE_DELAY_MS,
        maxDelayMs: o.maxDelayMs ?? RATE_LIMIT_MAX_DELAY_MS,
        signal: o.signal,
    };
}

/** Decide whether an error category is worth retrying. */
function isRetryable(error: unknown): boolean {
    if (error instanceof ConfluenceApiError) {
        switch (error.category) {
            case 'rate_limited':
            case 'cors_network':
                return true;
            case 'unknown':
                // Retry on 5xx / timeout / unknown transport failures.
                if (error.status === undefined) return true;
                if (error.status === 404) return false;
                return error.status >= 500;
            case 'auth':
            case 'forbidden':
                return false;
            default:
                return false;
        }
    }

    if (error instanceof Error) {
        const msg = error.message;
        // 4xx (other than 429) — fatal.
        if (/\b40[01345]\b/.test(msg)) return false;
        if (/\b404\b/.test(msg)) return false;
        if (/\b429\b/.test(msg)) return true;
        if (/\b5\d{2}\b/.test(msg)) return true;
        if (/failed to fetch|network error|networkerror|cors|timeout|timed out/i.test(msg))
            return true;
    }

    return false;
}

function computeRetryDelay(
    error: unknown,
    attempt: number,
    baseDelayMs: number,
    maxDelayMs: number
): number {
    if (
        error instanceof ConfluenceApiError &&
        typeof error.retryAfterMs === 'number' &&
        Number.isFinite(error.retryAfterMs) &&
        error.retryAfterMs >= 0
    ) {
        return Math.min(error.retryAfterMs, maxDelayMs);
    }
    const exp = baseDelayMs * Math.pow(2, attempt);
    return Math.min(exp, maxDelayMs);
}

function isAbortError(error: unknown): boolean {
    if (!error) return false;
    const e = error as { name?: string };
    return e.name === 'AbortError';
}

function makeAbortError(): Error {
    if (typeof DOMException !== 'undefined') {
        return new DOMException('Aborted', 'AbortError');
    }
    const err = new Error('Aborted');
    err.name = 'AbortError';
    return err;
}
