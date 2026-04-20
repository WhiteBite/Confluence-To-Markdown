import {
    type HubSettings,
    type LinkedSpace,
    DEFAULT_HUB_SETTINGS,
    STORAGE_KEYS,
} from './types';

export type { HubSettings, LinkedSpace };

export function getHubSettings(): HubSettings | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.HUB_SETTINGS);
        if (stored) {
            return { ...DEFAULT_HUB_SETTINGS, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.warn('[HubSettings] Failed to load:', e);
    }
    return null;
}

export function saveHubSettings(settings: HubSettings): void {
    try {
        localStorage.setItem(STORAGE_KEYS.HUB_SETTINGS, JSON.stringify(settings));
    } catch (e) {
        console.warn('[HubSettings] Failed to save:', e);
    }
}

export function isHubConfigured(): boolean {
    const settings = getHubSettings();
    return !!(settings?.url && settings?.apiToken && settings?.alias);
}

export function addLinkedSpace(space: LinkedSpace): void {
    const settings = getHubSettings() || { ...DEFAULT_HUB_SETTINGS };
    const idx = settings.linkedSpaces.findIndex(s => s.spaceKey === space.spaceKey);
    if (idx >= 0) {
        settings.linkedSpaces[idx] = space;
    } else {
        settings.linkedSpaces.push(space);
    }
    saveHubSettings(settings);
}

export function removeLinkedSpace(spaceKey: string): void {
    const settings = getHubSettings();
    if (!settings) return;
    settings.linkedSpaces = settings.linkedSpaces.filter(s => s.spaceKey !== spaceKey);
    saveHubSettings(settings);
}

export function updateLastSync(spaceKey: string, timestamp: string): void {
    const settings = getHubSettings();
    if (!settings) return;
    const space = settings.linkedSpaces.find(s => s.spaceKey === spaceKey);
    if (space) {
        space.lastSyncTimestamp = timestamp;
        saveHubSettings(settings);
    }
}
