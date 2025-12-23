declare function GM_xmlhttpRequest(details: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD';
    url: string;
    headers?: Record<string, string>;
    data?: string;
    responseType?: 'blob' | 'arraybuffer' | 'json' | 'text';
    onload?: (response: {
        status: number;
        statusText: string;
        responseText: string;
        responseHeaders: string;
        response?: unknown;
    }) => void;
    onerror?: (response: {
        status: number;
        statusText: string;
    }) => void;
}): void;

declare function GM_addStyle(css: string): void;
