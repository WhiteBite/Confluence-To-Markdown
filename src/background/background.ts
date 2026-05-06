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

interface HubPushRequest {
    type: 'HUB_PUSH';
    url: string;
    method: string;
    body?: string;
    isMultipart?: boolean;
}

interface HubPushResponse {
    success: boolean;
    data?: unknown;
    error?: string;
    status?: number;
}

chrome.runtime.onMessage.addListener(
    (request: FetchRequest | HubPushRequest, _sender, sendResponse: (response: FetchResponse | HubPushResponse) => void) => {
        if (request.type === 'FETCH') {
            handleFetch(request.url, request.options)
                .then(sendResponse)
                .catch((error) => {
                    sendResponse({
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                });
            return true;
        }

        if (request.type === 'HUB_PUSH') {
            handleHubPush(request)
                .then(sendResponse)
                .catch((error) => {
                    sendResponse({
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                });
            return true;
        }

        return false;
    }
);

async function handleFetch(url: string, options?: RequestInit): Promise<FetchResponse> {
    try {
        const response = await fetch(url, {
            ...options,
            credentials: 'include',
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

async function handleHubPush(request: HubPushRequest): Promise<HubPushResponse> {
    try {
        const fetchOptions: RequestInit = {
            method: request.method || 'POST',
        };

        if (request.isMultipart && request.body) {
            const parsed = JSON.parse(request.body);
            const formData = new FormData();

            if (parsed.entries) {
                for (const [key, value] of parsed.entries as Array<[string, string]>) {
                    formData.append(key, value);
                }
            }

            if (parsed.fileEntries) {
                for (const fileEntry of parsed.fileEntries as Array<{ name: string; filename: string; type: string; data: string }>) {
                    const binaryString = atob(fileEntry.data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    const blob = new Blob([bytes], { type: fileEntry.type });
                    const file = new File([blob], fileEntry.filename, { type: fileEntry.type });
                    formData.append(fileEntry.name, file, `${fileEntry.filename}`);
                }
            }

            fetchOptions.body = formData;
        } else if (request.body) {
            fetchOptions.body = request.body;
            fetchOptions.headers = {
                'Content-Type': 'application/json',
            };
        }

        const response = await fetch(request.url, fetchOptions);

        if (!response.ok) {
            const text = await response.text().catch(() => '');
            return {
                success: false,
                error: `HTTP ${response.status}: ${text || response.statusText}`,
                status: response.status,
            };
        }

        let data: unknown;
        try {
            data = await response.json();
        } catch {
            data = { ok: true };
        }

        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}
