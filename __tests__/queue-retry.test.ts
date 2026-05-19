/**
 * Unit tests for withRetry — the retry logic with ConfluenceApiError support.
 */

import { describe, it, expect, vi } from 'vitest';
import { withRetry, delay } from '../src/utils/queue';
import { ConfluenceApiError } from '../src/api/errors';

describe('withRetry', () => {
    it('returns result on first success', async () => {
        const fn = vi.fn().mockResolvedValue('ok');
        const result = await withRetry(fn);
        expect(result).toBe('ok');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on transient error and succeeds', async () => {
        const fn = vi.fn()
            .mockRejectedValueOnce(new Error('HTTP 500: Internal Server Error'))
            .mockResolvedValue('recovered');

        const result = await withRetry(fn, { maxRetries: 2, baseDelayMs: 10 });
        expect(result).toBe('recovered');
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('retries on 429 rate limit with backoff', async () => {
        const rateLimitError = new ConfluenceApiError({
            category: 'rate_limited',
            status: 429,
            retryAfterMs: 50,
        });

        const fn = vi.fn()
            .mockRejectedValueOnce(rateLimitError)
            .mockResolvedValue('ok');

        const result = await withRetry(fn, { maxRetries: 2, baseDelayMs: 10 });
        expect(result).toBe('ok');
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('does NOT retry on 401 auth error', async () => {
        const authError = new ConfluenceApiError({
            category: 'auth',
            status: 401,
        });

        const fn = vi.fn().mockRejectedValue(authError);

        await expect(withRetry(fn, { maxRetries: 3, baseDelayMs: 10 }))
            .rejects.toThrow(authError);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('does NOT retry on 403 forbidden', async () => {
        const forbiddenError = new ConfluenceApiError({
            category: 'forbidden',
            status: 403,
        });

        const fn = vi.fn().mockRejectedValue(forbiddenError);

        await expect(withRetry(fn, { maxRetries: 3, baseDelayMs: 10 }))
            .rejects.toThrow(forbiddenError);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('does NOT retry on 404', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('HTTP 404: Not Found'));

        await expect(withRetry(fn, { maxRetries: 3, baseDelayMs: 10 }))
            .rejects.toThrow('404');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on network/CORS error', async () => {
        const corsError = new ConfluenceApiError({
            category: 'cors_network',
            technicalMessage: 'Failed to fetch',
        });

        const fn = vi.fn()
            .mockRejectedValueOnce(corsError)
            .mockRejectedValueOnce(corsError)
            .mockResolvedValue('ok');

        const result = await withRetry(fn, { maxRetries: 3, baseDelayMs: 10 });
        expect(result).toBe('ok');
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it('throws after max retries exhausted', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('HTTP 500: Server Error'));

        await expect(withRetry(fn, { maxRetries: 2, baseDelayMs: 10 }))
            .rejects.toThrow('500');
        expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
    });

    it('uses retryAfterMs from ConfluenceApiError when available', async () => {
        const error = new ConfluenceApiError({
            category: 'rate_limited',
            status: 429,
            retryAfterMs: 100,
        });

        const start = Date.now();
        const fn = vi.fn()
            .mockRejectedValueOnce(error)
            .mockResolvedValue('ok');

        await withRetry(fn, { maxRetries: 1, baseDelayMs: 10, maxDelayMs: 200 });
        const elapsed = Date.now() - start;

        // Should have waited ~100ms (retryAfterMs), not 10ms (baseDelay)
        expect(elapsed).toBeGreaterThanOrEqual(80);
    });

    it('caps delay at maxDelayMs', async () => {
        const error = new ConfluenceApiError({
            category: 'rate_limited',
            status: 429,
            retryAfterMs: 99999,
        });

        const start = Date.now();
        const fn = vi.fn()
            .mockRejectedValueOnce(error)
            .mockResolvedValue('ok');

        await withRetry(fn, { maxRetries: 1, baseDelayMs: 10, maxDelayMs: 50 });
        const elapsed = Date.now() - start;

        // Should be capped at 50ms, not 99999ms
        expect(elapsed).toBeLessThan(200);
    });

    it('supports legacy positional arguments', async () => {
        const fn = vi.fn()
            .mockRejectedValueOnce(new Error('HTTP 500'))
            .mockResolvedValue('ok');

        // Legacy: withRetry(fn, maxRetries, baseDelay)
        const result = await withRetry(fn, 2, 10);
        expect(result).toBe('ok');
    });
});

describe('delay', () => {
    it('resolves after specified time', async () => {
        const start = Date.now();
        await delay(50);
        expect(Date.now() - start).toBeGreaterThanOrEqual(40);
    });

    it('rejects immediately if signal already aborted', async () => {
        const controller = new AbortController();
        controller.abort();
        await expect(delay(1000, controller.signal)).rejects.toThrow();
    });
});
