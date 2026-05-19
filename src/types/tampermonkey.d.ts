interface GMXhrResponse {
    status: number;
    statusText: string;
    responseText: string;
    responseHeaders: string;
    response?: unknown;
    finalUrl?: string;
}

interface GMXhrErrorResponse {
    status: number;
    statusText: string;
    responseText?: string;
    responseHeaders?: string;
    error?: string;
}

interface GMXhrRequestDetails {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD';
    url: string;
    headers?: Record<string, string>;
    /** Body data for POST/PUT (string, FormData, Blob, etc.) */
    data?: string | FormData | Blob | ArrayBuffer | URLSearchParams;
    responseType?: 'blob' | 'arraybuffer' | 'json' | 'text';
    /** Timeout in ms; if exceeded, ontimeout fires. */
    timeout?: number;
    onload?: (response: GMXhrResponse) => void;
    onerror?: (response: GMXhrErrorResponse) => void;
    ontimeout?: (response: GMXhrErrorResponse) => void;
    onabort?: (response: GMXhrErrorResponse) => void;
}

interface GMXhrHandle {
    abort?: () => void;
}

declare function GM_xmlhttpRequest(details: GMXhrRequestDetails): GMXhrHandle | void;

declare function GM_addStyle(css: string): void;

interface GMDownloadOptions {
    url: string;
    name: string;
    saveAs?: boolean;
    headers?: Record<string, string>;
    onload?: () => void;
    onerror?: (error: { error: string; details?: string }) => void;
    ontimeout?: () => void;
}
declare function GM_download(options: GMDownloadOptions): void;

interface GMInfo {
    script: {
        version: string;
        name: string;
        namespace?: string;
    };
    scriptHandler?: string;
    version?: string;
}
declare const GM_info: GMInfo | undefined;

declare function GM_setValue(key: string, value: string | number | boolean): void;
declare function GM_getValue<T = unknown>(key: string, defaultValue?: T): T;
declare function GM_deleteValue(key: string): void;

/**
 * Tampermonkey/Greasemonkey: real `window` (page context), bypassing the
 * userscript sandbox. Some console-logging quirks require capturing `console`
 * via this; see `utils/logger.ts`.
 */
declare const unsafeWindow: (Window & typeof globalThis) | undefined;
