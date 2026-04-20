import type { HubSettings } from '@/storage/hub-settings';
import type { HubCatalogPage, HubContentPage, HubAttachmentData, HubIngestResponse } from '@/api/types';
import { IS_TAMPERMONKEY } from '@/utils/env';

export class HubClient {
    constructor(private settings: HubSettings) {}

    async testConnection(): Promise<{ success: boolean; error?: string }> {
        try {
            const url = `${this.settings.url}/api/knowledge/sources/${this.settings.alias}/ingest-token`;
            const response = await this.hubFetch(url, { method: 'POST' });

            if (response.ok) {
                return { success: true };
            }
            return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Connection failed' };
        }
    }

    async pushCatalog(pages: HubCatalogPage[]): Promise<HubIngestResponse> {
        const formData = new FormData();
        formData.append('metadata', JSON.stringify({
            alias: this.settings.alias,
            api_token: this.settings.apiToken,
            mode: 'catalog',
            pages,
        }));

        return this.ingest(formData);
    }

    async pushContent(pages: HubContentPage[], attachments: HubAttachmentData[]): Promise<HubIngestResponse> {
        const formData = new FormData();
        formData.append('metadata', JSON.stringify({
            alias: this.settings.alias,
            api_token: this.settings.apiToken,
            mode: 'content',
            pages,
        }));

        for (const att of attachments) {
            const file = new File([att.blob], att.filename, { type: att.blob.type || 'application/octet-stream' });
            formData.append('files', file, `${att.pageId}/${att.filename}`);
        }

        return this.ingest(formData);
    }

    async pushSinglePage(page: HubContentPage, attachments: HubAttachmentData[]): Promise<HubIngestResponse> {
        return this.pushContent([page], attachments);
    }

    private async ingest(formData: FormData): Promise<HubIngestResponse> {
        const url = `${this.settings.url}/api/knowledge/ingest`;

        try {
            const response = await this.hubFetch(url, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const text = await response.text().catch(() => '');
                return {
                    errors: [`HTTP ${response.status}: ${text || response.statusText}`],
                };
            }

            const data = await response.json();
            return {
                cataloged: data.cataloged,
                indexed: data.indexed,
                errors: data.errors || [],
            };
        } catch (error) {
            return {
                errors: [error instanceof Error ? error.message : 'Ingest failed'],
            };
        }
    }

    private async hubFetch(url: string, options?: RequestInit): Promise<Response> {
        if (IS_TAMPERMONKEY) {
            return this.gmFetch(url, options);
        }

        // Try extension background fetch — typeof check avoids TS "always truthy" warning
        const hasChromeRuntime = typeof chrome !== 'undefined' && chrome.runtime?.sendMessage;
        if (hasChromeRuntime) {
            return this.backgroundFetch(url, options);
        }

        return fetch(url, {
            ...options,
            credentials: 'include',
        });
    }

    private gmFetch(url: string, options?: RequestInit): Promise<Response> {
        const method = (options?.method || 'GET') as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD';
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method,
                url,
                headers: options?.headers as Record<string, string> | undefined,
                data: options?.body as string | undefined,
                onload(response) {
                    const resp = new Response(response.responseText, {
                        status: response.status,
                        statusText: response.statusText,
                    });
                    resolve(resp);
                },
                onerror(response) {
                    reject(new Error(`Network error: ${response.statusText || 'Unknown'}`));
                },
            });
        });
    }

    private async backgroundFetch(url: string, options?: RequestInit): Promise<Response> {
        let serializedBody: string | null = null;

        if (options?.body instanceof FormData) {
            const entries: Array<[string, string]> = [];
            const fileEntries: Array<{ name: string; filename: string; type: string; data: string }> = [];

            for (const [key, value] of (options.body as FormData).entries()) {
                if (value instanceof Blob) {
                    const buffer = await value.arrayBuffer();
                    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
                    fileEntries.push({
                        name: key,
                        filename: (value as File).name || 'file',
                        type: value.type || 'application/octet-stream',
                        data: base64,
                    });
                } else {
                    entries.push([key, value]);
                }
            }

            serializedBody = JSON.stringify({ entries, fileEntries });
        } else if (typeof options?.body === 'string') {
            serializedBody = options.body;
        }

        const result = await chrome.runtime.sendMessage({
            type: 'HUB_PUSH',
            url,
            method: options?.method || 'POST',
            body: serializedBody,
            isMultipart: options?.body instanceof FormData,
        });

        if (result.success) {
            return new Response(JSON.stringify(result.data), { status: 200 });
        }

        return new Response(result.error || 'Hub push failed', { status: result.status || 500 });
    }
}
