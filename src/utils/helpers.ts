/** Delay execution */
export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Get current page ID from URL */
export function getCurrentPageId(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get('pageId');
}

/** Safe error message extraction */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Unknown error';
}
