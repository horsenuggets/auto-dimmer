/**
 * Animation utilities
 *
 * Functions for smooth dim level transitions.
 */

import { clamp } from "./overlay";

export interface AnimationState {
    frameId: number | null;
    currentLevel: number;
    targetLevel: number;
}

/**
 * Create a new animation state.
 */
export function createAnimationState(): AnimationState {
    return {
        frameId: null,
        currentLevel: 0,
        targetLevel: 0,
    };
}

/**
 * Cancel any running animation.
 */
export function cancelAnimation(state: AnimationState): void {
    if (state.frameId !== null) {
        cancelAnimationFrame(state.frameId);
        state.frameId = null;
    }
}

/**
 * Animate from current level to target level over a duration.
 * Calls onUpdate with the current level on each frame.
 * Uses linear interpolation for stability.
 */
export function animateDimLevel(
    state: AnimationState,
    targetLevel: number,
    duration: number,
    onUpdate: (level: number) => void
): void {
    const newTarget = clamp(targetLevel, 0, 1);

    // Skip if target hasn't changed significantly (5% threshold)
    if (Math.abs(newTarget - state.targetLevel) < 0.05) {
        return;
    }

    state.targetLevel = newTarget;

    // Cancel any existing animation
    cancelAnimation(state);

    const startLevel = clamp(state.currentLevel, 0, 1);
    const startTime = performance.now();

    function animate(currentTime: number): void {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Linear interpolation
        state.currentLevel = startLevel + (state.targetLevel - startLevel) * progress;
        state.currentLevel = clamp(state.currentLevel, 0, 1);

        onUpdate(state.currentLevel);

        if (progress < 1) {
            state.frameId = requestAnimationFrame(animate);
        } else {
            state.frameId = null;
        }
    }

    state.frameId = requestAnimationFrame(animate);
}

/**
 * Set dim level immediately without animation.
 */
export function setDimLevelImmediate(
    state: AnimationState,
    level: number,
    onUpdate: (level: number) => void
): void {
    cancelAnimation(state);
    state.currentLevel = clamp(level, 0, 1);
    state.targetLevel = state.currentLevel;
    onUpdate(state.currentLevel);
}
