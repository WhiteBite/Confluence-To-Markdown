/**
 * UI interaction helpers for export modal
 * @module ui/modal/handlers/interaction
 */

import { updateSelectionCount } from './tree';

// ============================================================================
// Modal Interaction
// ============================================================================

/**
 * Disable modal interaction during export
 */
export function disableModalInteraction(element: HTMLElement): void {
    const downloadBtn = element.querySelector('#md-download-btn') as HTMLButtonElement;
    const copyBtn = element.querySelector('#md-copy-btn') as HTMLButtonElement;
    const pdfBtn = element.querySelector('#md-pdf-btn') as HTMLButtonElement;

    if (downloadBtn) {
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = `<span>Processing...</span>`;
    }

    if (copyBtn) copyBtn.disabled = true;
    if (pdfBtn) pdfBtn.disabled = true;

    element.querySelectorAll<HTMLButtonElement>('.md-controls button').forEach((btn) => {
        btn.disabled = true;
    });

    element.querySelectorAll<HTMLInputElement>('.md-tree-checkbox').forEach((cb) => {
        cb.disabled = true;
    });
}

/**
 * Enable modal interaction after export
 */
export function enableModalInteraction(element: HTMLElement, icons: { download: string; copy: string }): void {
    const downloadBtn = element.querySelector('#md-download-btn') as HTMLButtonElement;
    const copyBtn = element.querySelector('#md-copy-btn') as HTMLButtonElement;
    const pdfBtn = element.querySelector('#md-pdf-btn') as HTMLButtonElement;

    if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = `${icons.download}<span>Download</span><span class="md-btn-badge" id="md-download-badge">0</span>`;
    }

    if (copyBtn) {
        copyBtn.disabled = false;
        copyBtn.innerHTML = `${icons.copy}<span>Copy</span>`;
    }

    if (pdfBtn) {
        pdfBtn.disabled = false;
    }

    element.querySelectorAll<HTMLButtonElement>('.md-controls button').forEach((btn) => {
        btn.disabled = false;
    });

    element.querySelectorAll<HTMLInputElement>('.md-tree-checkbox').forEach((cb) => {
        cb.disabled = false;
    });

    // Hide progress section
    const progressSection = element.querySelector('#md-progress-section') as HTMLElement;
    if (progressSection) {
        progressSection.style.display = 'none';
    }

    updateSelectionCount(element);
}

// ============================================================================
// UI Helpers
// ============================================================================

/**
 * Shake element animation for validation feedback
 */
export function shakeElement(el: Element | null): void {
    if (!el) return;
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 500);
}

/**
 * Check if an input element is focused
 */
export function isInputFocused(): boolean {
    const active = document.activeElement;
    return active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA';
}

/**
 * Toggle a collapsible panel
 */
export function togglePanel(element: HTMLElement, contentSelector: string, btn: HTMLElement): void {
    const content = element.querySelector(contentSelector) as HTMLElement;
    const chevron = btn.querySelector('.md-chevron') as HTMLElement;
    if (content) {
        const isHidden = content.style.display === 'none';
        content.style.display = isHidden ? 'block' : 'none';
        chevron?.classList.toggle('expanded', isHidden);
    }
}

/**
 * Handle theme toggle
 */
export function handleToggleTheme(element: HTMLElement, btn: HTMLElement): void {
    const currentTheme = element.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    element.setAttribute('data-theme', newTheme);

    // Update button icon (sun for dark mode, moon for light mode)
    const sunIcon = `<svg viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 000-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>`;
    const moonIcon = `<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>`;
    btn.innerHTML = newTheme === 'dark' ? sunIcon : moonIcon;
}
