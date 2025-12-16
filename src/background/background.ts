/**
 * Background Service Worker
 * Handles API requests to bypass CORS restrictions
 */

interface FetchRequest {
    type: 'FETCH';
    url: string;
    options?: RequestInit;
}

interface FetchResponse {
    success: boolean;
    data?: unknown;
    error?: string;
    status?: number;
}

chrome.runtime.onMessage.addListener(
    (request: FetchRequest, _sender, sendResponse: (response: FetchResponse) => void) => {
        if (request.type === 'FETCH') {
            handleFetch(request.url, request.options)
                .then(sendResponse)
                .catch((error) => {
                    sendResponse({
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                });
            return true; // Keep channel open for async response
        }
        return false;
    }
);

async function handleFetch(url: string, options?: RequestInit): Promise<FetchResponse> {
    try {
        const response = await fetch(url, {
            ...options,
            credentials: 'include', // Send cookies for auth
            headers: {
                Accept: 'application/json',
                ...options?.headers,
            },
        });

        if (!response.ok) {
            return {
                success: false,
                error: `HTTP ${response.status}: ${response.statusText}`,
                status: response.status,
            };
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}
