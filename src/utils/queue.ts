/** Concurrency pool for rate-limited API requests */

export interface QueueOptions {
    concurrency: number;
    onProgress?: (completed: number, total: number) => void;
}

/** Run async tasks with limited concurrency */
export async function runWithConcurrency<T, R>(
    items: T[],
    fn: (item: T, index: number) => Promise<R>,
    options: QueueOptions
): Promise<R[]> {
    const { concurrency, onProgress } = options;
    const results: R[] = new Array(items.length);
    let completed = 0;
    let currentIndex = 0;

    async function worker(): Promise<void> {
        while (currentIndex < items.length) {
            const index = currentIndex++;
            const item = items[index];

            try {
                results[index] = await fn(item, index);
            } catch (error) {
                // Re-throw to be handled by caller
                throw error;
            }

            completed++;
            onProgress?.(completed, items.length);
        }
    }

    // Start workers up to concurrency limit
    const workers: Promise<void>[] = [];
    const workerCount = Math.min(concurrency, items.length);

    for (let i = 0; i < workerCount; i++) {
        workers.push(worker());
    }

    await Promise.all(workers);
    return results;
}

/** Delay helper for rate limiting */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/** Retry with exponential backoff */
export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            // Check for rate limit (429)
            if (error instanceof Error && error.message.includes('429')) {
                const waitTime = baseDelay * Math.pow(2, attempt);
                await delay(waitTime);
                continue;
            }

            // For other errors, retry with backoff
            if (attempt < maxRetries) {
                await delay(baseDelay * (attempt + 1));
            }
        }
    }

    throw lastError;
}
