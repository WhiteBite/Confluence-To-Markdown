import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadObsidianSettings, saveObsidianSettings } from '../src/storage/storage';
import { STORAGE_KEYS } from '../src/storage/types';

describe('Bug: localStorage migration for convertDiagrams', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });

    it('should migrate old convertDiagrams=true to diagramExportMode=convert', () => {
        // Simulate old settings saved by user
        const oldSettings = {
            convertDiagrams: true,
            diagramTargetFormat: 'mermaid',
            exportDiagrams: true,
        };
        localStorage.setItem(STORAGE_KEYS.OBSIDIAN_SETTINGS, JSON.stringify(oldSettings));

        // Load settings (should migrate)
        const settings = loadObsidianSettings();

        // Should have migrated
        expect(settings.diagramExportMode).toBe('convert');
        expect(settings.convertDiagrams).toBe(false);
    });

    it('should migrate old convertDiagrams=false to diagramExportMode=copy-as-is', () => {
        // Simulate old settings
        const oldSettings = {
            convertDiagrams: false,
            exportDiagrams: true,
        };
        localStorage.setItem(STORAGE_KEYS.OBSIDIAN_SETTINGS, JSON.stringify(oldSettings));

        // Load settings
        const settings = loadObsidianSettings();

        // Should default to copy-as-is
        expect(settings.diagramExportMode).toBe('copy-as-is');
        expect(settings.convertDiagrams).toBe(false);
    });

    it('BUG: migration should persist to localStorage', () => {
        // This test SHOULD FAIL initially - reproducing the bug!

        // User has old settings
        const oldSettings = {
            convertDiagrams: true,
            diagramTargetFormat: 'mermaid',
        };
        localStorage.setItem(STORAGE_KEYS.OBSIDIAN_SETTINGS, JSON.stringify(oldSettings));

        // Load settings (migrates in memory)
        const settings1 = loadObsidianSettings();
        expect(settings1.diagramExportMode).toBe('convert');

        // Load again (should still be migrated)
        const settings2 = loadObsidianSettings();
        expect(settings2.diagramExportMode).toBe('convert');

        // Check localStorage directly - BUG: migration not saved!
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.OBSIDIAN_SETTINGS)!);
        expect(stored.diagramExportMode).toBe('convert'); // This will FAIL
        expect(stored.convertDiagrams).toBe(false); // This will FAIL
    });

    it('should NOT override explicit diagramExportMode setting', () => {
        // User already has new settings
        const newSettings = {
            diagramExportMode: 'svg-preview',
            convertDiagrams: false,
        };
        localStorage.setItem(STORAGE_KEYS.OBSIDIAN_SETTINGS, JSON.stringify(newSettings));

        // Load settings
        const settings = loadObsidianSettings();

        // Should keep explicit setting
        expect(settings.diagramExportMode).toBe('svg-preview');
    });

    it('should handle missing localStorage gracefully', () => {
        // No settings in localStorage
        const settings = loadObsidianSettings();

        // Should return defaults
        expect(settings.diagramExportMode).toBe('copy-as-is');
        expect(settings.convertDiagrams).toBe(false);
    });
});
