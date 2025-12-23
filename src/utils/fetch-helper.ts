import { IS_TAMPERMONKEY } from './env';
import { withRetry } from './queue';

/**
 * Unified fetch helper that works in both Tampermonkey and browser contexts
 */

/** Fetch JSON data */
export async function fetchJson<T>(url: string): Promise<T> {
    return withRetry(async () => {
        if (IS_TAMPERMONKEY) {
            return gmFetchJson<T>(url);
        }
        return browserFetchJson<T>(url);
    });
}

/** Fetch blob data (images, files) */
export async function fetchBlob(url: string): Promise<Blob> {
    return withRetry(async () => {
        if (IS_TAMPERMONKEY) {
            return gmFetchBlob(url);
        }
        return browserFetchBlob(url);
    });
}

/** Fetch text data */
export async function fetchText(url: string): Promise<string> {
    return withRetry(async () => {
        if (IS_TAMPERMONKEY) {
            return gmFetchText(url);
        }
        return browserFetchText(url);
    });
}

// ============================================================================
// Tampermonkey implementations
// ============================================================================

function gmFetchJson<T>(url: string): Promise<T> {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'GET',
            url,
            headers: { Accept: 'application/json' },
            onload(response) {
                if (response.status >= 200 && response.status < 300) {
                    try {
                        resolve(JSON.parse(response.responseText) as T);
                    } catch (e) {
                        reject(new Error(`JSON parse error: ${e}`));
                    }
                } else {
                    reject(new Error(`HTTP ${response.status}: ${response.statusText}`));
                }
            },
            onerror(response) {
                reject(new Error(`Network error: ${response.statusText || 'Unknown'}`));
            },
        });
    });
}

function gmFetchBlob(url: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'GET',
            url,
            responseType: 'blob',
            onload(response) {
                if (response.status >= 200 && response.status < 300) {
                    resolve(response.response as Blob);
                } else {
                    reject(new Error(`HTTP ${response.status}: ${response.statusText}`));
                }
            },
            onerror(response) {
                reject(new Error(`Network error: ${response.statusText || 'Unknown'}`));
            },
        });
    });
}

function gmFetchText(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'GET',
            url,
            onload(response) {
                if (response.status >= 200 && response.status < 300) {
                    resolve(response.responseText);
                } else {
                    reject(new Error(`HTTP ${response.status}: ${response.statusText}`));
                }
            },
            onerror(response) {
                reject(new Error(`Network error: ${response.statusText || 'Unknown'}`));
            },
        });
    });
}

// ============================================================================
// Browser implementations
// ============================================================================

async function browserFetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
}

async function browserFetchBlob(url: string): Promise<Blob> {
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.blob();
}

async function browserFetchText(url: string): Promise<string> {
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.text();
}
