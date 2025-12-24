/**
 * Modal state machine implementation
 * @module ui/modal/state
 */

import type { ModalState, StateChangeEvent, StateChangeListener } from './types';

// ============================================================================
// Valid State Transitions
// ============================================================================

/**
 * Valid state transitions map
 * Defines which states can transition to which other states
 */
const VALID_TRANSITIONS: Readonly<Record<ModalState, readonly ModalState[]>> = {
    idle: ['ready'],
    ready: ['processing', 'idle'],
    processing: ['ready', 'error', 'idle'],
    error: ['ready', 'idle'],
} as const;

// ============================================================================
// State Machine Class
// ============================================================================

/**
 * Modal state machine
 * 
 * Manages modal state transitions with validation and event emission.
 * Prevents invalid state changes and notifies listeners of transitions.
 * 
 * @example
 * ```typescript
 * const machine = new ModalStateMachine();
 * 
 * // Subscribe to state changes
 * const unsubscribe = machine.subscribe((event) => {
 *   console.log(`State changed: ${event.from} -> ${event.to}`);
 * });
 * 
 * // Transition states
 * machine.setState('ready');  // idle -> ready (valid)
 * machine.setState('processing');  // ready -> processing (valid)
 * machine.setState('idle');  // processing -> idle (valid, e.g., cancel)
 * 
 * // Cleanup
 * unsubscribe();
 * ```
 */
export class ModalStateMachine {
    private state: ModalState = 'idle';
    private readonly listeners: Set<StateChangeListener> = new Set();

    /**
     * Get current state
     */
    getState(): ModalState {
        return this.state;
    }

    /**
     * Attempt to transition to a new state
     * 
     * @param newState - Target state to transition to
     * @returns true if transition was successful, false if invalid
     */
    setState(newState: ModalState): boolean {
        // Same state - no-op, but not an error
        if (this.state === newState) {
            return true;
        }

        // Validate transition
        if (!this.isValidTransition(this.state, newState)) {
            console.warn(
                `[ModalStateMachine] Invalid state transition: ${this.state} -> ${newState}. ` +
                `Valid transitions from '${this.state}': [${VALID_TRANSITIONS[this.state].join(', ')}]`
            );
            return false;
        }

        const previousState = this.state;
        this.state = newState;
        this.notifyListeners(previousState, newState);
        return true;
    }

    /**
     * Check if a transition is valid
     * 
     * @param from - Current state
     * @param to - Target state
     * @returns true if transition is allowed
     */
    isValidTransition(from: ModalState, to: ModalState): boolean {
        const validTargets = VALID_TRANSITIONS[from];
        return validTargets?.includes(to) ?? false;
    }

    /**
     * Get valid transitions from current state
     * 
     * @returns Array of valid target states
     */
    getValidTransitions(): readonly ModalState[] {
        return VALID_TRANSITIONS[this.state] ?? [];
    }

    /**
     * Subscribe to state changes
     * 
     * @param listener - Callback function for state changes
     * @returns Unsubscribe function
     */
    subscribe(listener: StateChangeListener): () => void {
        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Reset state machine to initial state
     * Forces reset without transition validation (use for cleanup)
     */
    reset(): void {
        const previousState = this.state;
        this.state = 'idle';

        if (previousState !== 'idle') {
            this.notifyListeners(previousState, 'idle');
        }
    }

    /**
     * Check if currently in a specific state
     * 
     * @param state - State to check
     * @returns true if current state matches
     */
    isInState(state: ModalState): boolean {
        return this.state === state;
    }

    /**
     * Check if modal is in an active state (not idle)
     */
    isActive(): boolean {
        return this.state !== 'idle';
    }

    /**
     * Check if modal is processing
     */
    isProcessing(): boolean {
        return this.state === 'processing';
    }

    /**
     * Check if modal has an error
     */
    hasError(): boolean {
        return this.state === 'error';
    }

    /**
     * Notify all listeners of state change
     */
    private notifyListeners(from: ModalState, to: ModalState): void {
        const event: StateChangeEvent = {
            from,
            to,
            timestamp: Date.now(),
        };

        this.listeners.forEach((listener) => {
            try {
                listener(event);
            } catch (error) {
                console.error('[ModalStateMachine] Error in state change listener:', error);
            }
        });
    }

    /**
     * Get number of active listeners
     * Useful for debugging/testing
     */
    getListenerCount(): number {
        return this.listeners.size;
    }

    /**
     * Clear all listeners
     * Use for cleanup when destroying the modal
     */
    clearListeners(): void {
        this.listeners.clear();
    }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new modal state machine instance
 * 
 * @returns New ModalStateMachine instance
 */
export function createModalStateMachine(): ModalStateMachine {
    return new ModalStateMachine();
}
