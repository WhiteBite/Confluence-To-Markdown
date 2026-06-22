/**
 * Unified transport layer for Confluence/Hub HTTP requests.
 *
 * Handles three runtime contexts:
 *  - Tampermonkey/Greasemonkey (uses GM_xmlhttpRequest)
 *  - Browser extension (uses fetch + chrome.runtime.sendMessage as CORS fallback)
 *  - Plain browser (uses fetch with AbortController for timeout/cancel)
 *
 * All non-2xx responses raise a {@link ConfluenceApiError} with a structured
 * category, retry hint (Retry-After), and the original URL/status. Caller-side
 * cancellation via `AbortSignal` propagates to backends and surfaces as
 * `AbortError` (not wrapped in ConfluenceApiError).
 */

import { IS_TAMPERMONKEY, IS_EXTENSION } from './env';
import { FETCH_TIMEOUT_MS } from '@/config';
import {
    ConfluenceApiError,
    parseRetryAfter,
    toConfluenceApiError,
} from '@/api/errors';

// ============================================================================
// Public types
// ============================================================================

export interface TransportOptions {
    /** Caller-side cancellation. Aborts propagate to underlying request. */
    signal?: AbortSignal;
    /** Request timeout in ms. Defaults to FETCH_TIMEOUT_MS (30s). */
    timeoutMs?: number;
    /** Extra request headers (case-insensitive on the wire). */
    headers?: Record<string, string>;
}

export type RawHttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface RawTransportRequest extends TransportOptions {
    url: string;
    method?: RawHttpMethod;
    /** Request body (string or FormData). */
    body?: string | FormData;
}

/** Internal representation: status + lazy body accessors. */
export interface RawResponse {
    status: number;
    statusText: string;
    headers: Headers | Record<string, string>;
    text: () => Promise<string>;
    blob: () => Promise<Blob>;
    json: <T>() => Promise<T>;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * GET JSON. Throws {@link ConfluenceApiError} on non-2xx or transport failure.
 * Caller-aborted requests throw `AbortError`.
 */
export async function fetchJson<T>(url: string, opts?: TransportOptions): Promise<T> {
    const res = await rawRequest(url, {
        method: 'GET',
        headers: { Accept: 'application/json', ...opts?.headers },
        timeoutMs: opts?.timeoutMs,
        signal: opts?.signal,
    });
    if (!isOk(res.status)) throw await toApiError(res, url);
    return parseJsonResponse<T>(res, url);
}

/** GET binary blob. Throws {@link ConfluenceApiError} on non-2xx or transport failure. */
export async function fetchBlob(url: string, opts?: TransportOptions): Promise<Blob> {
    const res = await rawRequest(url, {
        method: 'GET',
        headers: opts?.headers,
        timeoutMs: opts?.timeoutMs,
        signal: opts?.signal,
        responseType: 'blob',
    });
    if (!isOk(res.status)) throw await toApiError(res, url);
    return res.blob();
}

/** GET text. Throws {@link ConfluenceApiError} on non-2xx or transport failure. */
export async function fetchText(url: string, opts?: TransportOptions): Promise<string> {
    const res = await rawRequest(url, {
        method: 'GET',
        headers: opts?.headers,
        timeoutMs: opts?.timeoutMs,
        signal: opts?.signal,
    });
    if (!isOk(res.status)) throw await toApiError(res, url);
    return res.text();
}

/**
 * Generic request returning parsed JSON. Use for non-GET (e.g., Hub push).
 * Throws {@link ConfluenceApiError} on non-2xx; AbortError on caller cancel.
 */
export async function transportRequest<T>(req: RawTransportRequest): Promise<T> {
    const res = await rawRequest(req.url, {
        method: req.method ?? 'GET',
        headers: req.headers,
        body: req.body ?? null,
        timeoutMs: req.timeoutMs,
        signal: req.signal,
    });
    if (!isOk(res.status)) throw await toApiError(res, req.url);
    return parseJsonResponse<T>(res, req.url);
}

// ============================================================================
// rawRequest — dispatches to the proper backend
// ============================================================================

interface RawRequestOptions extends TransportOptions {
    method?: string;
    body?: BodyInit | null;
    /** Internal hint for TM backend to use blob response type. */
    responseType?: 'blob' | 'text' | 'arraybuffer' | 'json';
}

async function rawRequest(url: string, init?: RawRequestOptions): Promise<RawResponse> {
    const timeoutMs = init?.timeoutMs ?? FETCH_TIMEOUT_MS;
    const method = (init?.method ?? 'GET').toUpperCase();
    const headers = init?.headers;
    const body = init?.body ?? null;
    const signal = init?.signal;
    const responseType = init?.responseType;

    if (signal?.aborted) throw makeAbortError();

    const args: BackendArgs = { url, method, headers, body, timeoutMs, signal, responseType };

    if (IS_TAMPERMONKEY) return gmRequest(args);
    if (IS_EXTENSION) return extensionRequest(args);
    return browserRequest(args);
}

// ============================================================================
// Tampermonkey backend
// ============================================================================

interface BackendArgs {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body: BodyInit | null;
    timeoutMs: number;
    signal?: AbortSignal;
    responseType?: 'blob' | 'text' | 'arraybuffer' | 'json';
}

function gmRequest(args: BackendArgs): Promise<RawResponse> {
    const { url, method, headers, body, timeoutMs, signal, responseType } = args;

    return new Promise<RawResponse>((resolve, reject) => {
        let abortListener: (() => void) | null = null;
        const cleanupAbort = (): void => {
            if (signal && abortListener) {
                signal.removeEventListener('abort', abortListener);
                abortListener = null;
            }
        };

        // GM_xmlhttpRequest accepts string/Blob/FormData/ArrayBuffer/URLSearchParams
        // for `data`. Anything else → coerce to string.
        const data: string | Blob | FormData | ArrayBuffer | URLSearchParams | undefined =
            body == null
                ? undefined
                : (body as string | Blob | FormData | ArrayBuffer | URLSearchParams);

        const handle = GM_xmlhttpRequest({
            method: method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD',
            url,
            headers,
            data,
            timeout: timeoutMs,
            responseType: responseType === 'blob' ? 'blob' : undefined,
            onload(response) {
                cleanupAbort();
                const parsedHeaders = parseHeaderString(response.responseHeaders);
                const responseText = response.responseText ?? '';
                const responseBlob =
                    response.response instanceof Blob ? (response.response as Blob) : null;

                resolve({
                    status: response.status,
                    statusText: response.statusText,
                    headers: parsedHeaders,
                    text: async () => responseText,
                    blob: async () => {
                        if (responseBlob) return responseBlob;
                        // Fallback for old TM: responseText may be a binary string
                        // (latin1-encoded). Using charCodeAt preserves correct byte
                        // values instead of producing a garbled UTF-16 blob.
                        const bytes = Uint8Array.from(responseText, c => c.charCodeAt(0));
                        return new Blob([bytes]);
                    },
                    json: async <T>() => JSON.parse(responseText) as T,
                });
            },
            onerror(response) {
                cleanupAbort();
                reject(
                    new ConfluenceApiError({
                        category: 'cors_network',
                        status: response.status || undefined,
                        url,
                        technicalMessage: `GM_xmlhttpRequest network error: ${response.statusText || response.error || 'Unknown'
                            }`,
                    })
                );
            },
            ontimeout() {
                cleanupAbort();
                reject(timeoutError(url, timeoutMs));
            },
            onabort() {
                cleanupAbort();
                reject(makeAbortError());
            },
        });

        if (signal) {
            abortListener = (): void => {
                if (handle && typeof (handle as GMXhrHandle).abort === 'function') {
                    (handle as GMXhrHandle).abort?.();
                }
                cleanupAbort();
                reject(makeAbortError());
            };
            signal.addEventListener('abort', abortListener);
        }
    });
}

// ============================================================================
// Extension backend (fetch first, fall back to background script on CORS)
// ============================================================================

async function extensionRequest(args: BackendArgs): Promise<RawResponse> {
    try {
        return await browserRequest(args);
    } catch (error) {
        // ConfluenceApiError + cors_network OR raw network/CORS error → background fallback.
        if (!isCorsLikeError(error)) throw error;
        return backgroundRequest(args, error);
    }
}

interface BgFetchSuccess { success: true; data: unknown; status?: number; retryAfterMs?: number }
interface BgFetchFailure { success: false; error?: string; status?: number; retryAfterMs?: number }
type BgFetchResult = BgFetchSuccess | BgFetchFailure;

/**
 * Binary payload contract used when the background script serialises a blob response.
 * The background script encodes the raw bytes as Base64 and sets the MIME type so
 * `wrapBackgroundResponse` can reconstruct the original `Blob`.
 * @internal
 */
export interface BinaryBase64Payload {
    /** Base64-encoded binary data. */
    __binary_base64: string;
    /** MIME type of the original blob. */
    mimeType: string;
}

/**
 * Decode a binary response from the background script.
 *
 * Returns a `Blob` when `data` matches the {@link BinaryBase64Payload} contract,
 * or `null` when the format is not recognised (caller falls back to legacy behaviour).
 *
 * @internal Exported for unit-testing only.
 */
export function decodeBinaryResponse(data: unknown): Blob | null {
    if (typeof data !== 'object' || data === null || !('__binary_base64' in data)) {
        return null;
    }
    const record = data as Record<string, unknown>;
    const base64 = record['__binary_base64'];
    const mimeType =
        typeof record['mimeType'] === 'string' ? record['mimeType'] : 'application/octet-stream';
    if (typeof base64 !== 'string') return null;
    try {
        const binary = atob(base64);
        const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
        return new Blob([bytes], { type: mimeType });
    } catch {
        return null;
    }
}

async function backgroundRequest(args: BackendArgs, originalError: unknown): Promise<RawResponse> {
    const hasChromeRuntime =
        typeof chrome !== 'undefined' &&
        !!chrome.runtime &&
        typeof chrome.runtime.sendMessage === 'function';
    if (!hasChromeRuntime) {
        // Cannot fall back; bubble the original error wrapped.
        throw toConfluenceApiError(originalError, { url: args.url });
    }

    const isMultipart = args.body instanceof FormData;
    const serializedBody = await serializeBodyForBackground(args.body);

    const result: BgFetchResult = await chrome.runtime.sendMessage({
        type: isMultipart ? 'HUB_PUSH' : 'FETCH',
        url: args.url,
        method: args.method,
        body: serializedBody,
        isMultipart,
        responseType: args.responseType,
        options: { method: args.method, headers: args.headers },
    });

    return wrapBackgroundResponse(result, args.url);
}

/**
 * Wrap a background-script fetch result as a {@link RawResponse}.
 *
 * ### Binary contract
 * When the background script handles a `responseType: 'blob'` request it encodes
 * the response as `{ __binary_base64: string; mimeType: string }` in `data`.
 * `wrapBackgroundResponse` detects this shape via {@link decodeBinaryResponse} and
 * reconstructs the original `Blob`.  If decoding fails or the payload does not match
 * the contract, `blob()` falls back to returning the JSON-stringified `data` wrapped
 * in an `application/json` blob (legacy behaviour preserved for JSON API responses).
 *
 * @internal Exported for unit-testing only.
 */
export function wrapBackgroundResponse(result: BgFetchResult, url: string): RawResponse {
    if (result?.success) {
        const data = result.data;
        const status = result.status ?? 200;
        const json = JSON.stringify(data ?? null);
        const binaryBlob = decodeBinaryResponse(data);
        return {
            status,
            statusText: 'OK',
            headers: {},
            text: async () => json,
            blob: async () => binaryBlob ?? new Blob([json], { type: 'application/json' }),
            json: async <T>() => data as T,
        };
    }

    const errMsg = result?.error ?? 'Background fetch failed';
    const status = result?.status ?? 0;
    const retryHeaders: Record<string, string> = {};
    if (typeof result?.retryAfterMs === 'number' && Number.isFinite(result.retryAfterMs)) {
        // Re-encode Retry-After in seconds so toApiError → parseRetryAfter round-trips.
        retryHeaders['retry-after'] = String(Math.max(0, Math.ceil(result.retryAfterMs / 1000)));
    }

    // Status 0 means transport failure — bubble as cors_network from the caller side.
    if (status === 0) {
        throw new ConfluenceApiError({
            category: 'cors_network',
            url,
            technicalMessage: errMsg,
        });
    }

    return {
        status,
        statusText: errMsg,
        headers: retryHeaders,
        text: async () => errMsg,
        blob: async () => new Blob([errMsg], { type: 'text/plain' }),
        json: async <T>() => ({ error: errMsg }) as unknown as T,
    };
}

async function serializeBodyForBackground(body: BodyInit | null): Promise<string | null> {
    if (body == null) return null;
    if (typeof body === 'string') return body;

    if (body instanceof FormData) {
        const entries: Array<[string, string]> = [];
        const fileEntries: Array<{ name: string; filename: string; type: string; data: string }> = [];

        for (const [key, value] of body.entries()) {
            if (value instanceof Blob) {
                const buffer = await value.arrayBuffer();
                const file = value as File;
                fileEntries.push({
                    name: key,
                    filename: file.name || 'file',
                    type: value.type || 'application/octet-stream',
                    data: arrayBufferToBase64(buffer),
                });
            } else {
                entries.push([key, String(value)]);
            }
        }

        return JSON.stringify({ entries, fileEntries });
    }

    if (body instanceof Blob) return body.text();
    if (body instanceof ArrayBuffer) return arrayBufferToBase64(body);

    return String(body);
}

function arrayBufferToBase64(buffer: ArrayBufferLike): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
}

// ============================================================================
// Plain-browser backend (fetch + AbortController for timeout/cancel)
// ============================================================================

async function browserRequest(args: BackendArgs): Promise<RawResponse> {
    const { url, method, headers, body, timeoutMs, signal } = args;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort(new DOMException(`Request timeout (${timeoutMs}ms)`, 'TimeoutError'));
    }, timeoutMs);

    const onExternalAbort = (): void => controller.abort(signal?.reason);
    if (signal) {
        if (signal.aborted) {
            clearTimeout(timeoutId);
            throw makeAbortError();
        }
        signal.addEventListener('abort', onExternalAbort, { once: true });
    }

    try {
        const init: RequestInit = {
            method,
            headers,
            credentials: 'include',
            signal: controller.signal,
        };
        if (body != null) init.body = body;

        const response = await fetch(url, init);
        return wrapFetchResponse(response);
    } catch (error) {
        if (isAbortLikeError(error)) {
            // Distinguish caller-aborted vs timeout.
            if (signal?.aborted) throw makeAbortError();
            throw timeoutError(url, timeoutMs);
        }
        // Re-throw raw errors (e.g., TypeError "Failed to fetch") so the
        // extension backend can detect CORS and try background fallback.
        throw error;
    } finally {
        clearTimeout(timeoutId);
        if (signal) signal.removeEventListener('abort', onExternalAbort);
    }
}

function wrapFetchResponse(response: Response): RawResponse {
    return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        text: () => response.text(),
        blob: () => response.blob(),
        json: <T>() => response.json() as Promise<T>,
    };
}

// ============================================================================
// Helpers
// ============================================================================

function isOk(status: number): boolean {
    return status >= 200 && status < 300;
}

async function parseJsonResponse<T>(res: RawResponse, url: string): Promise<T> {
    try {
        return await res.json<T>();
    } catch (parseError) {
        throw new ConfluenceApiError(
            {
                category: 'unknown',
                status: res.status,
                url,
                technicalMessage: `JSON parse error: ${parseError instanceof Error ? parseError.message : String(parseError)
                    }`,
            },
            { cause: parseError }
        );
    }
}

async function toApiError(res: RawResponse, url: string): Promise<ConfluenceApiError> {
    const retryAfterRaw = readHeader(res.headers, 'retry-after');
    const retryAfterMs = parseRetryAfter(retryAfterRaw);

    let bodyPreview = '';
    try {
        bodyPreview = await res.text();
    } catch {
        bodyPreview = '';
    }
    const technicalMessage =
        bodyPreview.length > 0
            ? `HTTP ${res.status}: ${res.statusText || ''} — ${truncate(bodyPreview, 500)}`
            : `HTTP ${res.status}: ${res.statusText || ''}`;

    return toConfluenceApiError(new Error(technicalMessage), {
        url,
        status: res.status,
        retryAfterMs,
    });
}

function truncate(s: string, max: number): string {
    return s.length > max ? `${s.slice(0, max)}…` : s;
}

function readHeader(headers: Headers | Record<string, string>, name: string): string | null {
    if (typeof (headers as Headers).get === 'function') {
        return (headers as Headers).get(name);
    }
    const map = headers as Record<string, string>;
    const lower = name.toLowerCase();
    for (const key of Object.keys(map)) {
        if (key.toLowerCase() === lower) return map[key];
    }
    return null;
}

function parseHeaderString(raw: string | undefined): Record<string, string> {
    const out: Record<string, string> = {};
    if (!raw) return out;
    for (const line of raw.split(/\r?\n/)) {
        const idx = line.indexOf(':');
        if (idx <= 0) continue;
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        if (key) out[key.toLowerCase()] = value;
    }
    return out;
}

function isCorsLikeError(error: unknown): boolean {
    if (error instanceof ConfluenceApiError) return error.category === 'cors_network';
    if (!(error instanceof Error)) return false;
    const msg = error.message.toLowerCase();
    return (
        msg.includes('failed to fetch') ||
        msg.includes('network error') ||
        msg.includes('networkerror') ||
        msg.includes('cors')
    );
}

function isAbortLikeError(error: unknown): boolean {
    if (!error) return false;
    const e = error as { name?: string };
    return e.name === 'AbortError' || e.name === 'TimeoutError';
}

function makeAbortError(): Error {
    if (typeof DOMException !== 'undefined') {
        return new DOMException('Aborted', 'AbortError');
    }
    const err = new Error('Aborted');
    err.name = 'AbortError';
    return err;
}

function timeoutError(url: string, timeoutMs: number): ConfluenceApiError {
    return new ConfluenceApiError({
        category: 'unknown',
        url,
        technicalMessage: `Request timed out after ${timeoutMs}ms`,
    });
}
