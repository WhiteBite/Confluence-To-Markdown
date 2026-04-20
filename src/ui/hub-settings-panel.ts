import { HubClient } from '@/api/hub-client';
import { getHubSettings, saveHubSettings } from '@/storage/hub-settings';
import type { HubSettings, LinkedSpace } from '@/storage/types';

let settingsPanelElement: HTMLElement | null = null;

function closeSettingsPanel(): void {
    if (settingsPanelElement) {
        settingsPanelElement.remove();
        settingsPanelElement = null;
    }
}

function renderLinkedSpaces(spaces: LinkedSpace[]): string {
    if (spaces.length === 0) {
        return '<div class="md-hint">Нет привязанных спейсов</div>';
    }

    return spaces.map(space => {
        let timeAgo = 'никогда';
        if (space.lastSyncTimestamp) {
            const diff = Date.now() - new Date(space.lastSyncTimestamp).getTime();
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(hours / 24);
            if (days > 0) timeAgo = `${days}д назад`;
            else if (hours > 0) timeAgo = `${hours}ч назад`;
            else timeAgo = 'только что';
        }

        return `<div class="md-hub-linked-space">
            <span class="md-hub-space-name">${space.spaceName} (${space.spaceKey})</span>
            <span class="md-hub-space-sync">Синхронизация: ${timeAgo}</span>
            <button class="md-btn-icon-sm md-hub-remove-space" data-space-key="${space.spaceKey}" title="Удалить">
                <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
        </div>`;
    }).join('');
}

export function showHubSettingsPanel(): void {
    closeSettingsPanel();

    const settings = getHubSettings() || {
        url: '',
        apiToken: '',
        alias: '',
        connected: false,
        linkedSpaces: [],
        autoUpdateBadge: true,
    };

    const overlay = document.createElement('div');
    overlay.id = 'md-hub-settings-modal';
    overlay.className = 'md-hub-modal-overlay';

    const statusText = settings.connected ? '✅ Подключено' : '❌ Не подключено';
    const statusClass = settings.connected ? 'md-hub-status-ok' : 'md-hub-status-err';

    overlay.innerHTML = `
        <div class="md-hub-modal-content md-hub-settings-content">
            <div class="md-hub-modal-header">
                <h3>⚙️ Hub Settings</h3>
                <button class="md-btn-icon md-hub-close-btn" title="Закрыть">
                    <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>
            </div>
            <div class="md-hub-modal-body">
                <div class="md-settings-section">
                    <div class="md-settings-title">Подключение</div>
                    <div class="md-hub-field">
                        <label class="md-config-label">Hub URL</label>
                        <input type="url" id="md-hub-url" class="md-hub-input" value="${settings.url}" placeholder="https://your-midas.ai">
                    </div>
                    <div class="md-hub-field">
                        <label class="md-config-label">API Token</label>
                        <input type="password" id="md-hub-token" class="md-hub-input" value="${settings.apiToken}" placeholder="hub_xxxxxxxx">
                    </div>
                    <div class="md-hub-field">
                        <label class="md-config-label">Source Alias</label>
                        <input type="text" id="md-hub-alias" class="md-hub-input" value="${settings.alias}" placeholder="acme-wiki">
                    </div>
                    <div class="md-hub-test-row">
                        <button class="md-btn md-btn-secondary md-hub-test-btn">Проверить связь</button>
                        <span class="md-hub-connection-status ${statusClass}" id="md-hub-conn-status">${statusText}</span>
                    </div>
                </div>

                <div class="md-settings-section">
                    <div class="md-settings-title">Привязанные спейсы</div>
                    <div id="md-hub-linked-spaces">
                        ${renderLinkedSpaces(settings.linkedSpaces)}
                    </div>
                </div>
            </div>
            <div class="md-hub-modal-footer">
                <button class="md-btn md-btn-primary md-hub-save-btn">Сохранить</button>
            </div>
        </div>`;

    document.body.appendChild(overlay);
    settingsPanelElement = overlay;

    overlay.querySelector('.md-hub-close-btn')?.addEventListener('click', closeSettingsPanel);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeSettingsPanel();
    });

    overlay.querySelector('.md-hub-test-btn')?.addEventListener('click', async () => {
        const urlInput = overlay.querySelector('#md-hub-url') as HTMLInputElement;
        const tokenInput = overlay.querySelector('#md-hub-token') as HTMLInputElement;
        const aliasInput = overlay.querySelector('#md-hub-alias') as HTMLInputElement;
        const statusEl = overlay.querySelector('#md-hub-conn-status') as HTMLElement;

        const tempSettings: HubSettings = {
            url: urlInput.value.trim(),
            apiToken: tokenInput.value.trim(),
            alias: aliasInput.value.trim(),
            connected: false,
            linkedSpaces: settings.linkedSpaces,
            autoUpdateBadge: settings.autoUpdateBadge,
        };

        if (!tempSettings.url || !tempSettings.apiToken || !tempSettings.alias) {
            statusEl.textContent = '❌ Заполните все поля';
            statusEl.className = 'md-hub-connection-status md-hub-status-err';
            return;
        }

        statusEl.textContent = '🔄 Проверка...';
        statusEl.className = 'md-hub-connection-status';

        const client = new HubClient(tempSettings);
        const result = await client.testConnection();

        if (result.success) {
            statusEl.textContent = '✅ Подключено';
            statusEl.className = 'md-hub-connection-status md-hub-status-ok';
        } else {
            statusEl.textContent = `❌ ${result.error || 'Ошибка подключения'}`;
            statusEl.className = 'md-hub-connection-status md-hub-status-err';
        }
    });

    overlay.querySelector('.md-hub-save-btn')?.addEventListener('click', () => {
        const urlInput = overlay.querySelector('#md-hub-url') as HTMLInputElement;
        const tokenInput = overlay.querySelector('#md-hub-token') as HTMLInputElement;
        const aliasInput = overlay.querySelector('#md-hub-alias') as HTMLInputElement;
        const statusEl = overlay.querySelector('#md-hub-conn-status') as HTMLElement;

        const newSettings: HubSettings = {
            url: urlInput.value.trim(),
            apiToken: tokenInput.value.trim(),
            alias: aliasInput.value.trim(),
            connected: statusEl?.classList.contains('md-hub-status-ok') || false,
            linkedSpaces: settings.linkedSpaces,
            autoUpdateBadge: settings.autoUpdateBadge,
        };

        saveHubSettings(newSettings);
        closeSettingsPanel();
    });

    overlay.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.closest('.md-hub-remove-space')) {
            const btn = target.closest('.md-hub-remove-space') as HTMLElement;
            const spaceKey = btn.dataset.spaceKey;
            if (spaceKey) {
                const current = getHubSettings();
                if (current) {
                    current.linkedSpaces = current.linkedSpaces.filter(s => s.spaceKey !== spaceKey);
                    saveHubSettings(current);
                    const container = overlay.querySelector('#md-hub-linked-spaces');
                    if (container) {
                        container.innerHTML = renderLinkedSpaces(current.linkedSpaces);
                    }
                }
            }
        }
    });
}
