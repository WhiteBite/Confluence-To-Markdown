/**
 * Tests for runWithConcurrency and withRetry in src/utils/queue.ts.
 *
 * Covers:
 *  - Bug 1: bailOnError: true must stop other workers from picking up new tasks
 *  - Bug 2: ConfluenceApiError.retryAfterMs must NOT be capped by maxDelayMs
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfluenceApiError } from '@/api/errors';
import { runWithConcurrency, withRetry } from '@/utils/queue';

// ============================================================================
// Bug 1: runWithConcurrency — bailOnError stops new task scheduling
// ============================================================================

describe('runWithConcurrency — bailOnError', () => {
    it('does not schedule new tasks after the first failure (bailOnError: true)', async () => {
        // 6 items, concurrency 3.
        // Items 0/1/2 are picked up immediately (in-flight).
        // Item 0 rejects first. Items 3/4/5 must never start.

        let rejectItem0!: (e: Error) => void;
        let resolveItem1!: (v: number) => void;
        let resolveItem2!: (v: number) => void;

        const fn = vi.fn((item: number): Promise<number> => {
            if (item === 0)
                return new Promise<number>((_, reject) => {
                    rejectItem0 = reject;
                });
            if (item === 1)
                return new Promise<number>((resolve) => {
                    resolveItem1 = resolve;
                });
            if (item === 2)
                return new Promise<number>((resolve) => {
                    resolveItem2 = resolve;
                });
            // Items 3-5 should never be reached
            return Promise.resolve(item);
        });

        const promise = runWithConcurrency([0, 1, 2, 3, 4, 5], fn, {
            concurrency: 3,
            bailOnError: true,
        });

        // Workers run synchronously up to the first await — fn called 3 times
        expect(fn).toHaveBeenCalledTimes(3);

        // Fail item 0 first so hasFailed is set before workers 1/2 resume
        rejectItem0(new Error('item0 failed'));
        // Resolve in-flight items so allSettled can settle
        resolveItem1(1);
        resolveItem2(2);

        await expect(promise).rejects.toThrow('item0 failed');

        // Items 3, 4, 5 must never have been passed to fn
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it('in-flight tasks complete even when another worker fails (bailOnError: true)', async () => {
        // Item 0 rejects synchronously (Promise.reject).
        // Items 1 and 2 are still in-flight — they must complete.

        let resolveItem1!: (v: number) => void;
        let resolveItem2!: (v: number) => void;

        const fn = vi.fn((item: number): Promise<number> => {
            if (item === 0) return Promise.reject(new Error('item0 failed'));
            if (item === 1)
                return new Promise<number>((resolve) => {
                    resolveItem1 = resolve;
                });
            if (item === 2)
                return new Promise<number>((resolve) => {
                    resolveItem2 = resolve;
                });
            return Promise.resolve(item);
        });

        const onProgress = vi.fn();
        const promise = runWithConcurrency([0, 1, 2, 3, 4, 5], fn, {
            concurrency: 3,
            bailOnError: true,
            onProgress,
        });

        // Yield once so worker 0's synchronous rejection propagates
        await Promise.resolve();

        // Resolve the two in-flight tasks
        resolveItem1(1);
        resolveItem2(2);

        await expect(promise).rejects.toThrow('item0 failed');

        // fn called only for items 0, 1, 2
        expect(fn).toHaveBeenCalledTimes(3);
        // onProgress fired for all three completed tasks (items 0/1/2 each hit finally)
        expect(onProgress).toHaveBeenCalledTimes(3);
    });

    it('runs all tasks and stores errors in results when bailOnError: false', async () => {
        const fn = vi.fn((item: number): Promise<number> => {
            if (item === 1) return Promise.reject(new Error('item1 error'));
            if (item === 3) return Promise.reject(new Error('item3 error'));
            return Promise.resolve(item * 10);
        });

        const results = await runWithConcurrency([0, 1, 2, 3, 4], fn, {
            concurrency: 2,
            bailOnError: false,
        });

        expect(fn).toHaveBeenCalledTimes(5);
        expect(results[0]).toBe(0);
        expect(results[1]).toBeInstanceOf(Error);
        expect((results[1] as Error).message).toBe('item1 error');
        expect(results[2]).toBe(20);
        expect(results[3]).toBeInstanceOf(Error);
        expect((results[3] as Error).message).toBe('item3 error');
        expect(results[4]).toBe(40);
    });

    it('AbortSignal stops scheduling independently of hasFailed', async () => {
        const controller = new AbortController();

        // Item 0 aborts the controller when called; items 1-4 would succeed
        const fn = vi.fn(async (item: number): Promise<number> => {
            if (item === 0) {
                controller.abort();
                return 0;
            }
            return item;
        });

        const promise = runWithConcurrency([0, 1, 2, 3, 4], fn, {
            concurrency: 1,
            signal: controller.signal,
        });

        await expect(promise).rejects.toMatchObject({ name: 'AbortError' });

        // Only item 0 was processed; remaining items never started
        expect(fn).toHaveBeenCalledTimes(1);
    });
});

// ============================================================================
// Bug 2: computeRetryDelay — Retry-After must not be capped by maxDelayMs
// ============================================================================

describe('withRetry — Retry-After vs maxDelayMs', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('respects Retry-After even when it exceeds maxDelayMs', async () => {
        // Server says wait 60s; maxDelayMs is only 5s.
        // With the bug: retry fires after 5s (too early → wastes an attempt).
        // With the fix:  retry fires after 60s.

        const rateLimitError = new ConfluenceApiError({
            category: 'rate_limited',
            retryAfterMs: 60_000,
        });

        let callCount = 0;
        const fn = vi.fn(async () => {
            callCount++;
            if (callCount === 1) throw rateLimitError;
            return 'ok';
        });

        const promise = withRetry(fn, {
            maxRetries: 3,
            baseDelayMs: 100,
            maxDelayMs: 5_000,
        });

        // First call executes synchronously up to the await in withRetry
        await Promise.resolve();
        expect(fn).toHaveBeenCalledTimes(1);

        // Advance only to maxDelayMs (5s) — retry must NOT have fired yet
        await vi.advanceTimersByTimeAsync(5_000);
        expect(fn).toHaveBeenCalledTimes(1);

        // Advance the remaining 55s to reach the full Retry-After window
        await vi.advanceTimersByTimeAsync(55_000);
        expect(fn).toHaveBeenCalledTimes(2);

        const result = await promise;
        expect(result).toBe('ok');
    });

    it('caps exponential backoff at maxDelayMs when no Retry-After header is present', async () => {
        // ConfluenceApiError without retryAfterMs → exponential backoff applies.
        // baseDelayMs=1_000, maxDelayMs=3_000:
        //   attempt 0: 1_000 * 2^0 = 1_000ms  (< 3_000 → not capped)
        //   attempt 1: 1_000 * 2^1 = 2_000ms  (< 3_000 → not capped)
        //   attempt 2: 1_000 * 2^2 = 4_000ms  (> 3_000 → capped to 3_000)

        const serverError = new ConfluenceApiError({ category: 'unknown', status: 500 });

        let callCount = 0;
        const fn = vi.fn(async () => {
            callCount++;
            if (callCount <= 3) throw serverError;
            return 'done';
        });

        const promise = withRetry(fn, {
            maxRetries: 5,
            baseDelayMs: 1_000,
            maxDelayMs: 3_000,
        });

        // First call
        await Promise.resolve();
        expect(fn).toHaveBeenCalledTimes(1);

        // 1st retry after 1_000ms
        await vi.advanceTimersByTimeAsync(1_000);
        expect(fn).toHaveBeenCalledTimes(2);

        // 2nd retry after another 2_000ms
        await vi.advanceTimersByTimeAsync(2_000);
        expect(fn).toHaveBeenCalledTimes(3);

        // 3rd retry after 3_000ms (capped from 4_000)
        // Advance only 2_999ms — should NOT have fired yet
        await vi.advanceTimersByTimeAsync(2_999);
        expect(fn).toHaveBeenCalledTimes(3);

        // One more ms to cross the cap
        await vi.advanceTimersByTimeAsync(1);
        expect(fn).toHaveBeenCalledTimes(4);

        const result = await promise;
        expect(result).toBe('done');
    });
});
