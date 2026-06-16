import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getCurrentPageId,
    getSpaceKey,
} from '../src/utils/helpers';
import { findActionMenuContainer } from '../src/utils/helpers';

describe('Confluence Server URL patterns', () => {
    beforeEach(() => {
        // Reset window.location
        vi.stubGlobal('window', {
            location: {
                href: '',
                pathname: '',
                search: '',
            },
        });
        // Clear AJS
        vi.stubGlobal('AJS', undefined);
    });

    it('should detect spaceKey from /display/SPC/PageTitle (Server)', () => {
        window.location.pathname = '/display/SPC/11111111';
        window.location.href = 'http://localhost:8090/display/SPC/11111111';

        expect(getSpaceKey()).toBe('SPC');
    });

    it('should NOT detect pageId from /display/SPC/PageTitle (Server) without AJS', () => {
        window.location.pathname = '/display/SPC/11111111';
        window.location.href = 'http://localhost:8090/display/SPC/11111111';

        expect(getCurrentPageId()).toBeNull();
    });

    it('should detect pageId from /display/SPC/PageTitle with AJS.Meta', () => {
        const mockAJS = {
            Meta: {
                get: vi.fn((key: string) => {
                    if (key === 'page-id') return '12345';
                    if (key === 'space-key') return 'SPC';
                    return null;
                }),
            },
        };
        vi.stubGlobal('window', {
            location: {
                href: 'http://localhost:8090/display/SPC/11111111',
                pathname: '/display/SPC/11111111',
                search: '',
            },
            AJS: mockAJS,
        });
        vi.stubGlobal('AJS', mockAJS);

        expect(getCurrentPageId()).toBe('12345');
        expect(getSpaceKey()).toBe('SPC');
    });

    it('should detect pageId from /pages/123/PageTitle (Cloud)', () => {
        window.location.pathname = '/wiki/spaces/SPC/pages/123/PageTitle';
        window.location.href = 'https://company.atlassian.net/wiki/spaces/SPC/pages/123/PageTitle';

        expect(getCurrentPageId()).toBe('123');
        expect(getSpaceKey()).toBe('SPC');
    });

    it('should detect pageId from ?pageId=123', () => {
        window.location.search = '?pageId=123&spaceKey=SPC';
        window.location.href = 'http://localhost:8090/pages/viewpage.action?pageId=123&spaceKey=SPC';

        expect(getCurrentPageId()).toBe('123');
        expect(getSpaceKey()).toBe('SPC');
    });
});

describe('DOM container detection for Server vs Cloud', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('should find Cloud container (#action-menu-link)', () => {
        document.body.innerHTML = `
            <div id="page-metadata-bar">
                <div class="cp-header-actions">
                    <a id="action-menu-link">Actions</a>
                </div>
            </div>
        `;

        const container = findActionMenuContainer();
        expect(container).not.toBeNull();
        expect(container?.querySelector('#action-menu-link')).not.toBeNull();
    });

    it('should find Server container (#toolbar)', () => {
        document.body.innerHTML = `
            <div id="toolbar" class="aui-toolbar">
                <button>Edit</button>
            </div>
        `;

        const container = findActionMenuContainer();
        expect(container).not.toBeNull();
        expect(container?.id).toBe('toolbar');
    });

    it('should find Server container (.page-metadata)', () => {
        document.body.innerHTML = `
            <div class="page-metadata">
                <span>Created by admin</span>
            </div>
        `;

        const container = findActionMenuContainer();
        expect(container).not.toBeNull();
    });

    it('should return null when no container exists', () => {
        document.body.innerHTML = '<div>Just some content</div>';

        const container = findActionMenuContainer();
        expect(container).toBeNull();
    });
});
