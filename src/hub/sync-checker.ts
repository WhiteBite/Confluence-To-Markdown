/**
 * Checks for updated Confluence pages in linked spaces.
 * Shows a badge on the Hub button when updates are detected.
 */

import { getHubSettings } from '@/storage/hub-settings';
import { fetchJson } from '@/api/confluence';

export interface SyncUpdate {
  spaceKey: string;
  updatedCount: number;
  pageIds: string[];
}

/** Check all linked spaces for updates since last sync */
export async function checkForUpdates(): Promise<SyncUpdate[]> {
  const settings = getHubSettings();
  if (!settings || !settings.linkedSpaces.length) return [];

  const updates: SyncUpdate[] = [];

  for (const space of settings.linkedSpaces) {
    try {
      const cql = `space="${space.spaceKey}" AND type=page AND lastmodified > "${space.lastSyncTimestamp}"`;
      const url = `/rest/api/content/search?cql=${encodeURIComponent(cql)}&limit=50`;
      const data = await fetchJson<{ results: Array<{ content: { id: string } } }>(url);

      if (data.results && data.results.length > 0) {
        updates.push({
          spaceKey: space.spaceKey,
          updatedCount: data.results.length,
          pageIds: data.results.map(r => r.content.id),
        });
      }
    } catch (e) {
      console.warn(`[SyncChecker] Failed to check space ${space.spaceKey}:`, e);
    }
  }

  return updates;
}

/** Update badge on the Hub button */
export function updateBadge(updates: SyncUpdate[]): void {
  const hubButton = document.getElementById('md-hub-trigger');
  if (!hubButton) return;

  const totalUpdates = updates.reduce((sum, u) => sum + u.updatedCount, 0);

  const existingBadge = hubButton.querySelector('.hub-badge');
  if (existingBadge) existingBadge.remove();

  if (totalUpdates > 0) {
    const badge = document.createElement('span');
    badge.className = 'hub-badge';
    badge.textContent = `🔄 ${totalUpdates}`;
    hubButton.style.position = 'relative';
    hubButton.appendChild(badge);
  }
}