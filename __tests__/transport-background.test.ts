/**
 * Unit tests for wrapBackgroundResponse and decodeBinaryResponse.
 *
 * Covers:
 *  1. Successful JSON response: text()/json() correct, blob() is JSON-string Blob
 *  2. Successful binary response with __binary_base64: blob() is decoded correctly
 *  3. Invalid __binary_base64: decodeBinaryResponse returns null → fallback to JSON blob
 *  4. Error response (success: false, status != 0): returns RawResponse with error status
 *  5. Error response (success: false, status: 0): throws ConfluenceApiError cors_network
 *  6. retryAfterMs in error response: encoded as retry-after in seconds in headers
 */

import { describe, it, expect } from 'vitest';
import { decodeBinaryResponse, wrapBackgroundResponse } from '../src/utils/transport';
import { ConfluenceApiError } from '../src/api/errors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Encode a Uint8Array to base64 via btoa (same path as background script would use). */
function encodeBase64(bytes: Uint8Array): string {
    let binary = '';
    for (const b of bytes) {
        binary += String.fromCharCode(b);
    }
    return btoa(binary);
}

/**
 * Read blob as text via FileReader.
 * jsdom's Blob may not expose the native .text() method so we use FileReader
 * which has broad support across jsdom versions.
 */
function readBlobAsText(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(blob);
    });
}

/**
 * Read blob as ArrayBuffer via FileReader.
 * Same reason as readBlobAsText — avoids relying on Blob.arrayBuffer().
 */
function readBlobAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(blob);
    });
}

// ---------------------------------------------------------------------------
// decodeBinaryResponse — unit tests
// ---------------------------------------------------------------------------

describe('decodeBinaryResponse', () => {
    it('returns null for null', () => {
        expect(decodeBinaryResponse(null)).toBeNull();
    });

    it('returns null for a plain string', () => {
        expect(decodeBinaryResponse('base64string')).toBeNull();
    });

    it('returns null for a number', () => {
        expect(decodeBinaryResponse(42)).toBeNull();
    });

    it('returns null for an object without __binary_base64 key', () => {
        expect(decodeBinaryResponse({ key: 'value', mimeType: 'image/png' })).toBeNull();
    });

    it('returns null when __binary_base64 is not a string', () => {
        expect(decodeBinaryResponse({ __binary_base64: 123, mimeType: 'image/png' })).toBeNull();
    });

    it('returns null for invalid base64 (atob throws)', () => {
        // '!!!' contains characters that are not valid base64
        expect(decodeBinaryResponse({ __binary_base64: '!!!invalid!!!', mimeType: 'image/png' })).toBeNull();
    });

    it('decodes valid base64 into a Blob with the correct mimeType', async () => {
        const originalBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // PNG header
        const base64 = encodeBase64(originalBytes);

        const blob = decodeBinaryResponse({ __binary_base64: base64, mimeType: 'image/png' });

        expect(blob).not.toBeNull();
        expect(blob!.type).toBe('image/png');
        expect(blob!.size).toBe(4);

        const buffer = await readBlobAsArrayBuffer(blob!);
        expect(new Uint8Array(buffer)).toEqual(originalBytes);
    });

    it('falls back to application/octet-stream when mimeType is absent', async () => {
        const originalBytes = new Uint8Array([0x00, 0xff]);
        const base64 = encodeBase64(originalBytes);

        const blob = decodeBinaryResponse({ __binary_base64: base64 });

        expect(blob).not.toBeNull();
        expect(blob!.type).toBe('application/octet-stream');
    });

    it('falls back to application/octet-stream when mimeType is not a string', async () => {
        const base64 = encodeBase64(new Uint8Array([0x01]));
        const blob = decodeBinaryResponse({ __binary_base64: base64, mimeType: 42 });

        expect(blob).not.toBeNull();
        expect(blob!.type).toBe('application/octet-stream');
    });
});

// ---------------------------------------------------------------------------
// wrapBackgroundResponse — tests
// ---------------------------------------------------------------------------

describe('wrapBackgroundResponse — success: JSON response', () => {
    it('returns status 200 and statusText OK', () => {
        const res = wrapBackgroundResponse(
            { success: true, data: { key: 'value' } },
            'https://example.com',
        );
        expect(res.status).toBe(200);
        expect(res.statusText).toBe('OK');
    });

    it('uses status from result when provided', () => {
        const res = wrapBackgroundResponse(
            { success: true, data: null, status: 201 },
            'https://example.com',
        );
        expect(res.status).toBe(201);
    });

    it('text() returns JSON-stringified data', async () => {
        const res = wrapBackgroundResponse(
            { success: true, data: { hello: 'world' } },
            'https://example.com',
        );
        expect(await res.text()).toBe(JSON.stringify({ hello: 'world' }));
    });

    it('json() returns the original data object', async () => {
        const data = { items: [1, 2, 3] };
        const res = wrapBackgroundResponse(
            { success: true, data },
            'https://example.com',
        );
        expect(await res.json()).toBe(data);
    });

    it('blob() returns an application/json Blob containing the JSON string', async () => {
        const data = { msg: 'hello' };
        const res = wrapBackgroundResponse(
            { success: true, data },
            'https://example.com',
        );
        const blob = await res.blob();
        expect(blob.type).toBe('application/json');
        expect(await readBlobAsText(blob)).toBe(JSON.stringify(data));
    });

    it('blob() returns application/json Blob when data is null', async () => {
        const res = wrapBackgroundResponse(
            { success: true, data: null },
            'https://example.com',
        );
        const blob = await res.blob();
        expect(blob.type).toBe('application/json');
        expect(await readBlobAsText(blob)).toBe('null');
    });
});

describe('wrapBackgroundResponse — success: binary __binary_base64 response', () => {
    it('blob() returns a Blob with correct mimeType and decoded bytes', async () => {
        // Simulate a PNG header (4 bytes: 0x89 0x50 0x4e 0x47)
        const originalBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
        const base64 = encodeBase64(originalBytes);

        const res = wrapBackgroundResponse(
            {
                success: true,
                data: { __binary_base64: base64, mimeType: 'image/png' },
                status: 200,
            },
            'https://example.com/image.png',
        );

        const blob = await res.blob();
        expect(blob.type).toBe('image/png');
        expect(blob.size).toBe(4);

        const buffer = await readBlobAsArrayBuffer(blob);
        expect(new Uint8Array(buffer)).toEqual(originalBytes);
    });

    it('blob() preserves all byte values including high bytes (>127)', async () => {
        const originalBytes = new Uint8Array([0x00, 0x7f, 0x80, 0xff]);
        const base64 = encodeBase64(originalBytes);

        const res = wrapBackgroundResponse(
            {
                success: true,
                data: { __binary_base64: base64, mimeType: 'application/octet-stream' },
            },
            'https://example.com/file.bin',
        );

        const blob = await res.blob();
        const buffer = await readBlobAsArrayBuffer(blob);
        expect(new Uint8Array(buffer)).toEqual(originalBytes);
    });

    it('text() still returns JSON-stringified __binary_base64 payload', async () => {
        const base64 = encodeBase64(new Uint8Array([0x01]));
        const data = { __binary_base64: base64, mimeType: 'image/png' };

        const res = wrapBackgroundResponse(
            { success: true, data },
            'https://example.com',
        );
        // text() always returns JSON representation of data (contract for API callers)
        expect(await res.text()).toBe(JSON.stringify(data));
    });
});

describe('wrapBackgroundResponse — success: invalid __binary_base64 falls back to JSON blob', () => {
    it('blob() falls back to application/json Blob when base64 is malformed', async () => {
        const data = { __binary_base64: '!!!not-valid!!!', mimeType: 'image/png' };

        const res = wrapBackgroundResponse(
            { success: true, data },
            'https://example.com',
        );

        const blob = await res.blob();
        // decodeBinaryResponse returned null → fallback to JSON blob
        expect(blob.type).toBe('application/json');
        expect(await readBlobAsText(blob)).toBe(JSON.stringify(data));
    });

    it('blob() falls back to application/json Blob when __binary_base64 value is not a string', async () => {
        const data = { __binary_base64: 999, mimeType: 'image/png' };

        const res = wrapBackgroundResponse(
            { success: true, data },
            'https://example.com',
        );

        const blob = await res.blob();
        expect(blob.type).toBe('application/json');
    });
});

describe('wrapBackgroundResponse — failure: non-zero status', () => {
    it('returns RawResponse with the error status', () => {
        const res = wrapBackgroundResponse(
            { success: false, error: 'Not Found', status: 404 },
            'https://example.com',
        );
        expect(res.status).toBe(404);
    });

    it('statusText is the error message', () => {
        const res = wrapBackgroundResponse(
            { success: false, error: 'Forbidden', status: 403 },
            'https://example.com',
        );
        expect(res.statusText).toBe('Forbidden');
    });

    it('text() returns the error message', async () => {
        const res = wrapBackgroundResponse(
            { success: false, error: 'Rate limited', status: 429 },
            'https://example.com',
        );
        expect(await res.text()).toBe('Rate limited');
    });

    it('uses default message when error is absent', () => {
        const res = wrapBackgroundResponse(
            { success: false, status: 503 },
            'https://example.com',
        );
        expect(res.statusText).toBe('Background fetch failed');
    });
});

describe('wrapBackgroundResponse — failure: status 0 (transport/CORS failure)', () => {
    it('throws ConfluenceApiError', () => {
        expect(() =>
            wrapBackgroundResponse(
                { success: false, error: 'Network failure', status: 0 },
                'https://example.com',
            ),
        ).toThrow(ConfluenceApiError);
    });

    it('thrown error has category cors_network', () => {
        try {
            wrapBackgroundResponse(
                { success: false, error: 'CORS blocked', status: 0 },
                'https://example.com',
            );
            expect.fail('Expected ConfluenceApiError to be thrown');
        } catch (e) {
            expect(e).toBeInstanceOf(ConfluenceApiError);
            expect((e as ConfluenceApiError).category).toBe('cors_network');
        }
    });

    it('thrown error includes technicalMessage from the error field', () => {
        try {
            wrapBackgroundResponse(
                { success: false, error: 'Connection refused', status: 0 },
                'https://example.com',
            );
            expect.fail('Expected ConfluenceApiError to be thrown');
        } catch (e) {
            expect((e as ConfluenceApiError).technicalMessage).toBe('Connection refused');
        }
    });

    it('throws even when error field is absent', () => {
        expect(() =>
            wrapBackgroundResponse(
                { success: false, status: 0 },
                'https://example.com',
            ),
        ).toThrow(ConfluenceApiError);
    });
});

describe('wrapBackgroundResponse — failure: retryAfterMs propagated as retry-after seconds', () => {
    it('sets retry-after header in whole seconds (rounded up)', () => {
        const res = wrapBackgroundResponse(
            { success: false, error: 'Rate limited', status: 429, retryAfterMs: 90_000 },
            'https://example.com',
        );
        const headers = res.headers as Record<string, string>;
        expect(headers['retry-after']).toBe('90');
    });

    it('rounds fractional seconds up', () => {
        const res = wrapBackgroundResponse(
            { success: false, error: 'Rate limited', status: 429, retryAfterMs: 1_500 },
            'https://example.com',
        );
        const headers = res.headers as Record<string, string>;
        expect(headers['retry-after']).toBe('2');
    });

    it('clamps to 0 for negative retryAfterMs', () => {
        const res = wrapBackgroundResponse(
            { success: false, error: 'Rate limited', status: 429, retryAfterMs: -100 },
            'https://example.com',
        );
        const headers = res.headers as Record<string, string>;
        expect(headers['retry-after']).toBe('0');
    });

    it('does not set retry-after when retryAfterMs is absent', () => {
        const res = wrapBackgroundResponse(
            { success: false, error: 'Not Found', status: 404 },
            'https://example.com',
        );
        const headers = res.headers as Record<string, string>;
        expect(headers['retry-after']).toBeUndefined();
    });
});
