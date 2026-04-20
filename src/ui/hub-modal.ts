import { HubClient } from '@/api/hub-client';
import { fetchPageForHub, fetchSpaceCatalog } from '@/api/confluence';
import { getHubSettings, isHubConfigured } from '@/storage/hub-settings';
import type { HubContentPage, PageTreeNode } from '@/api/types';
import { showHubSettingsPanel } from './hub-settings-panel';

type HubLinkMode = 'page' | 'space' | 'tree';

let hubModalElement: HTMLElement | null = null;

function closeHubModal(): void {
    if (hubModalElement) {
        hubModalElement.remove();
        hubModalElement = null;
    }
}

function showToast(message: string, type: 'success' | 'error' = 'success'): void {
    if (!hubModalElement) return;
    const existing = hubModalElement.querySelector('.md-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'md-toast show';
    if (type === 'error') {
        (toast as HTMLElement).style.background = 'var(--md-danger)';
    }
    toast.textContent = message;
    const content = hubModalElement.querySelector('.md-hub-modal-body');
    content?.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}

function setProgress(text: string): void {
    if (!hubModalElement) return;
    const progressEl = hubModalElement.querySelector('.md-hub-progress') as HTMLElement;
    if (progressEl) {
        progressEl.textContent = text;
        progressEl.style.display = text ? 'block' : 'none';
    }
}

async function pushCurrentPage(pageId: string, settings: ReturnType<typeof getHubSettings>): Promise<void> {
    if (!settings) return;
    setProgress('Загрузка страницы...');
    const pageData = await fetchPageForHub(pageId);
    if (!pageData) {
        showToast('Не удалось загрузить страницу', 'error');
        setProgress('');
        return;
    }

    const contentPage: HubContentPage = {
        id: pageData.id,
        title: pageData.title,
        space: pageData.space,
        ancestors: pageData.ancestors.map(a => ({ id: a.id, title: a.title })),
        labels: pageData.labels,
        last_modified: pageData.version?.when || new Date().toISOString(),
        html_content: pageData.htmlContent,
        content_format: 'storage',
        has_attachments: false,
    };

    setProgress('Отправка в Hub...');
    const client = new HubClient(settings);
    const result = await client.pushSinglePage(contentPage, []);

    if (result.errors.length > 0) {
        showToast(`Ошибки: ${result.errors.join(', ')}`, 'error');
    } else {
        showToast(`Привязано! Индексировано: ${result.indexed ?? 1}`);
    }
    setProgress('');
}

async function pushSpaceCatalog(spaceKey: string, _spaceName: string, settings: ReturnType<typeof getHubSettings>): Promise<void> {
    if (!settings) return;
    setProgress('Загрузка каталога спейса...');
    try {
        const catalogPages = await fetchSpaceCatalog(spaceKey);
        setProgress(`Отправка ${catalogPages.length} страниц в Hub...`);

        const client = new HubClient(settings);
        const result = await client.pushCatalog(catalogPages);

        if (result.errors.length > 0) {
            showToast(`Ошибки: ${result.errors.join(', ')}`, 'error');
        } else {
            showToast(`Каталог отправлен! Записей: ${result.cataloged ?? catalogPages.length}`);
        }
    } catch (error) {
        showToast(`Ошибка: ${error instanceof Error ? error.message : 'Не удалось загрузить каталог'}`, 'error');
    }
    setProgress('');
}

async function pushTreeSelection(selectedIds: string[], settings: ReturnType<typeof getHubSettings>): Promise<void> {
    if (!settings) return;
    setProgress(`Загрузка ${selectedIds.length} страниц...`);

    const contentPages: HubContentPage[] = [];
    let loaded = 0;

    for (const pageId of selectedIds) {
        const pageData = await fetchPageForHub(pageId);
        if (pageData) {
            contentPages.push({
                id: pageData.id,
                title: pageData.title,
                space: pageData.space,
                ancestors: pageData.ancestors.map(a => ({ id: a.id, title: a.title })),
                labels: pageData.labels,
                last_modified: pageData.version?.when || new Date().toISOString(),
                html_content: pageData.htmlContent,
                content_format: 'storage',
                has_attachments: false,
            });
        }
        loaded++;
        setProgress(`Загрузка: ${loaded}/${selectedIds.length}`);
    }

    setProgress('Отправка в Hub...');
    const client = new HubClient(settings);
    const result = await client.pushContent(contentPages, []);

    if (result.errors.length > 0) {
        showToast(`Ошибки: ${result.errors.join(', ')}`, 'error');
    } else {
        showToast(`Привязано! Индексировано: ${result.indexed ?? contentPages.length}`);
    }
    setProgress('');
}

function renderTreeCheckboxes(nodes: PageTreeNode[]): string {
    let html = '<ul class="md-tree md-hub-tree">';
    for (const node of nodes) {
        html += `<li data-page-id="${node.id}">`;
        html += `<div class="md-tree-item">`;
        html += `<input type="checkbox" class="md-tree-checkbox" data-page-id="${node.id}">`;
        html += `<span class="md-tree-icon page"><svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg></span>`;
        html += `<span class="md-tree-label">${node.title}</span>`;
        if (node.children.length > 0) {
            html += `<span class="md-child-count">${node.children.length}</span>`;
        }
        html += `</div>`;
        if (node.children.length > 0) {
            html += renderTreeCheckboxes(node.children);
        }
        html += '</li>';
    }
    html += '</ul>';
    return html;
}

export interface HubModalOptions {
    pageId: string;
    spaceKey: string;
    spaceName: string;
    pageTree?: PageTreeNode | null;
}

export function showHubModal(options: HubModalOptions): void {
    closeHubModal();

    const settings = getHubSettings();
    if (!settings || !isHubConfigured()) {
        showHubSettingsPanel();
        return;
    }

    const { pageId, spaceKey, spaceName, pageTree } = options;

    const overlay = document.createElement('div');
    overlay.id = 'md-hub-modal';
    overlay.className = 'md-hub-modal-overlay';

    const isConnected = settings.connected;
    const statusIcon = isConnected ? '✅' : '⚠️';

    let treeSectionHtml = '';
    if (pageTree) {
        const nodeCount = countNodes(pageTree);
        treeSectionHtml = `
            <label class="md-radio-label">
                <input type="radio" name="hub-mode" value="tree" class="md-hub-radio">
                Выбрать из дерева (${nodeCount} стр.)
            </label>
            <div class="md-hub-tree-container" style="display:none;">
                ${renderTreeCheckboxes([pageTree])}
            </div>`;
    }

    overlay.innerHTML = `
        <div class="md-hub-modal-content">
            <div class="md-hub-modal-header">
                <h3>📡 Привязать к Knowledge Hub</h3>
                <button class="md-btn-icon md-hub-close-btn" title="Закрыть">
                    <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>
            </div>
            <div class="md-hub-modal-body">
                <div class="md-hub-status">
                    Hub: <strong>${settings.url}</strong> ${statusIcon}
                    <button class="md-btn-xs md-hub-settings-btn" style="margin-left:auto;">⚙️ Настройки</button>
                </div>

                <div class="md-settings-section">
                    <div class="md-settings-title">Что привязать?</div>
                    <div class="md-hub-radio-group">
                        <label class="md-radio-label">
                            <input type="radio" name="hub-mode" value="page" class="md-hub-radio" checked>
                            Эту страницу
                        </label>
                        <label class="md-radio-label">
                            <input type="radio" name="hub-mode" value="space" class="md-hub-radio">
                            Весь спейс "${spaceName}"
                        </label>
                        ${treeSectionHtml}
                    </div>
                </div>

                <div class="md-hub-progress" style="display:none;"></div>
            </div>
            <div class="md-hub-modal-footer">
                <button class="md-btn md-btn-secondary md-hub-cancel-btn">Отмена</button>
                <button class="md-btn md-btn-primary md-hub-link-btn">Привязать</button>
            </div>
        </div>`;

    document.body.appendChild(overlay);
    hubModalElement = overlay;

    overlay.querySelector('.md-hub-close-btn')?.addEventListener('click', closeHubModal);
    overlay.querySelector('.md-hub-cancel-btn')?.addEventListener('click', closeHubModal);
    overlay.querySelector('.md-hub-settings-btn')?.addEventListener('click', () => {
        closeHubModal();
        showHubSettingsPanel();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeHubModal();
    });

    const radios = overlay.querySelectorAll<HTMLInputElement>('.md-hub-radio');
    const treeContainer = overlay.querySelector<HTMLElement>('.md-hub-tree-container');

    radios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (treeContainer) {
                treeContainer.style.display = radio.value === 'tree' && radio.checked ? 'block' : 'none';
            }
        });
    });

    const linkBtn = overlay.querySelector('.md-hub-link-btn') as HTMLButtonElement;
    linkBtn?.addEventListener('click', async () => {
        const selected = overlay.querySelector<HTMLInputElement>('.md-hub-radio:checked');
        if (!selected) return;

        const mode = selected.value as HubLinkMode;
        linkBtn.disabled = true;

        try {
            if (mode === 'page') {
                await pushCurrentPage(pageId, settings);
            } else if (mode === 'space') {
                await pushSpaceCatalog(spaceKey, spaceName, settings);
            } else if (mode === 'tree') {
                const checkedIds: string[] = [];
                overlay.querySelectorAll<HTMLInputElement>('.md-hub-tree .md-tree-checkbox:checked').forEach(cb => {
                    if (cb.dataset.pageId) checkedIds.push(cb.dataset.pageId);
                });
                if (checkedIds.length === 0) {
                    showToast('Выберите хотя бы одну страницу', 'error');
                    linkBtn.disabled = false;
                    return;
                }
                await pushTreeSelection(checkedIds, settings);
            }
        } catch (error) {
            showToast(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`, 'error');
        } finally {
            linkBtn.disabled = false;
        }
    });
}

function countNodes(node: PageTreeNode): number {
    let count = 1;
    for (const child of node.children) {
        count += countNodes(child);
    }
    return count;
}
