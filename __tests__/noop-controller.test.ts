import { describe, it, expect, vi } from 'vitest';
import type { ModalController } from '../src/ui/modal';

/**
 * Safe no-op controller for operations without a modal.
 * Exported here for testing; mirrored in main.ts for space export.
 */
const NOOP_CONTROLLER: ModalController = {
    show: () => {},
    close: () => {},
    setState: () => {},
    getState: () => 'idle',
    showProgress: () => {},
    hideProgress: () => {},
    showToast: () => {},
    updateTree: () => {},
};

describe('NOOP_CONTROLLER (space export safety)', () => {
    it('all methods should be callable without error', () => {
        expect(() => NOOP_CONTROLLER.show()).not.toThrow();
        expect(() => NOOP_CONTROLLER.close()).not.toThrow();
        expect(() => NOOP_CONTROLLER.setState('processing')).not.toThrow();
        expect(() => NOOP_CONTROLLER.getState()).not.toThrow();
        expect(() => NOOP_CONTROLLER.showProgress('content', 0, 10)).not.toThrow();
        expect(() => NOOP_CONTROLLER.hideProgress()).not.toThrow();
        expect(() => NOOP_CONTROLLER.showToast('Hello')).not.toThrow();
        expect(() => NOOP_CONTROLLER.updateTree({} as any)).not.toThrow();
    });

    it('getState should return idle', () => {
        expect(NOOP_CONTROLLER.getState()).toBe('idle');
    });

    it('showProgress should not throw with undefined args', () => {
        expect(() => NOOP_CONTROLLER.showProgress('content', undefined as any, undefined as any)).not.toThrow();
    });

    it('should safely chain in optional contexts', () => {
        // Simulates the exact pattern used in handleCopy/handleDownload
        const controller: ModalController | undefined = NOOP_CONTROLLER;

        expect(() => {
            if (controller?.showProgress) {
                controller.showProgress('content', 0, 5);
            }
        }).not.toThrow();

        expect(() => {
            if (controller?.showToast) {
                controller.showToast('Done!');
            }
        }).not.toThrow();
    });
});
