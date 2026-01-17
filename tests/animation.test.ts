/**
 * Animation Tests
 *
 * Tests for animation state management and dim level transitions.
 * Note: requestAnimationFrame tests require DOM environment (Puppeteer).
 */

import { describe, it, expect } from "../scripts/utils/test-runner";

// Re-implement clamp for testing
function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

// Re-implement createAnimationState for testing
interface AnimationState {
    frameId: number | null;
    currentLevel: number;
    targetLevel: number;
}

function createAnimationState(): AnimationState {
    return {
        frameId: null,
        currentLevel: 0,
        targetLevel: 0,
    };
}

// Linear interpolation helper (used in animation)
function lerp(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
}

describe("createAnimationState", () => {
    it("should create state with null frameId", () => {
        const state = createAnimationState();
        expect(state.frameId).toBeNull();
    });

    it("should create state with currentLevel of 0", () => {
        const state = createAnimationState();
        expect(state.currentLevel).toBe(0);
    });

    it("should create state with targetLevel of 0", () => {
        const state = createAnimationState();
        expect(state.targetLevel).toBe(0);
    });

    it("should create independent state objects", () => {
        const state1 = createAnimationState();
        const state2 = createAnimationState();
        state1.currentLevel = 0.5;
        expect(state2.currentLevel).toBe(0);
    });
});

describe("AnimationState properties", () => {
    it("should allow setting frameId", () => {
        const state = createAnimationState();
        state.frameId = 123;
        expect(state.frameId).toBe(123);
    });

    it("should allow setting currentLevel", () => {
        const state = createAnimationState();
        state.currentLevel = 0.75;
        expect(state.currentLevel).toBe(0.75);
    });

    it("should allow setting targetLevel", () => {
        const state = createAnimationState();
        state.targetLevel = 0.5;
        expect(state.targetLevel).toBe(0.5);
    });

    it("should allow resetting frameId to null", () => {
        const state = createAnimationState();
        state.frameId = 456;
        state.frameId = null;
        expect(state.frameId).toBeNull();
    });
});

describe("lerp (linear interpolation)", () => {
    describe("basic interpolation", () => {
        it("should return start when progress is 0", () => {
            expect(lerp(0, 1, 0)).toBe(0);
        });

        it("should return end when progress is 1", () => {
            expect(lerp(0, 1, 1)).toBe(1);
        });

        it("should return midpoint when progress is 0.5", () => {
            expect(lerp(0, 1, 0.5)).toBe(0.5);
        });

        it("should return quarter point when progress is 0.25", () => {
            expect(lerp(0, 1, 0.25)).toBe(0.25);
        });
    });

    describe("different ranges", () => {
        it("should interpolate from 0.2 to 0.8", () => {
            expect(lerp(0.2, 0.8, 0.5)).toBe(0.5);
        });

        it("should interpolate from higher to lower", () => {
            expect(lerp(1, 0, 0.5)).toBe(0.5);
        });

        it("should interpolate negative ranges", () => {
            expect(lerp(-1, 1, 0.5)).toBe(0);
        });

        it("should interpolate within negative range", () => {
            expect(lerp(-10, -5, 0.5)).toBe(-7.5);
        });
    });

    describe("edge cases", () => {
        it("should handle same start and end", () => {
            expect(lerp(0.5, 0.5, 0.5)).toBe(0.5);
        });

        it("should handle progress beyond 1", () => {
            expect(lerp(0, 1, 1.5)).toBe(1.5);
        });

        it("should handle negative progress", () => {
            expect(lerp(0, 1, -0.5)).toBe(-0.5);
        });

        it("should handle very small differences", () => {
            const result = lerp(0.5, 0.500001, 0.5);
            expect(Math.abs(result - 0.5000005)).toBeLessThan(0.0001);
        });
    });
});

describe("animation clamping", () => {
    it("should clamp target level to 0-1 range", () => {
        expect(clamp(-0.5, 0, 1)).toBe(0);
        expect(clamp(1.5, 0, 1)).toBe(1);
        expect(clamp(0.5, 0, 1)).toBe(0.5);
    });

    it("should clamp current level during animation", () => {
        // Simulate animation overshoot
        const overshoot = lerp(0.8, 1, 1.2); // Would be 1.04
        expect(clamp(overshoot, 0, 1)).toBe(1);
    });

    it("should clamp undershoot during animation", () => {
        // Simulate animation undershoot
        const undershoot = lerp(0.2, 0, 1.1); // Would be -0.02
        expect(clamp(undershoot, 0, 1)).toBe(0);
    });
});

describe("animation target change threshold", () => {
    const THRESHOLD = 0.01;

    function shouldSkipAnimation(newTarget: number, currentTarget: number): boolean {
        return Math.abs(newTarget - currentTarget) < THRESHOLD;
    }

    it("should skip animation for very small changes", () => {
        expect(shouldSkipAnimation(0.505, 0.5)).toBe(true);
    });

    it("should not skip animation for significant changes", () => {
        expect(shouldSkipAnimation(0.52, 0.5)).toBe(false);
    });

    it("should skip animation for zero change", () => {
        expect(shouldSkipAnimation(0.5, 0.5)).toBe(true);
    });

    it("should handle threshold boundary", () => {
        expect(shouldSkipAnimation(0.509, 0.5)).toBe(true); // 0.009 < 0.01
        expect(shouldSkipAnimation(0.511, 0.5)).toBe(false); // 0.011 >= 0.01
    });
});

describe("setDimLevelImmediate simulation", () => {
    function setDimLevelImmediate(
        state: AnimationState,
        level: number
    ): void {
        state.frameId = null; // cancelAnimation
        state.currentLevel = clamp(level, 0, 1);
        state.targetLevel = state.currentLevel;
    }

    it("should set current and target level immediately", () => {
        const state = createAnimationState();
        setDimLevelImmediate(state, 0.7);
        expect(state.currentLevel).toBe(0.7);
        expect(state.targetLevel).toBe(0.7);
    });

    it("should clamp level to valid range", () => {
        const state = createAnimationState();
        setDimLevelImmediate(state, 1.5);
        expect(state.currentLevel).toBe(1);
        expect(state.targetLevel).toBe(1);
    });

    it("should clamp negative levels", () => {
        const state = createAnimationState();
        setDimLevelImmediate(state, -0.5);
        expect(state.currentLevel).toBe(0);
        expect(state.targetLevel).toBe(0);
    });

    it("should cancel any running animation", () => {
        const state = createAnimationState();
        state.frameId = 123;
        setDimLevelImmediate(state, 0.5);
        expect(state.frameId).toBeNull();
    });

    it("should preserve state independence", () => {
        const state1 = createAnimationState();
        const state2 = createAnimationState();
        setDimLevelImmediate(state1, 0.8);
        expect(state2.currentLevel).toBe(0);
    });
});

describe("animation progress calculation", () => {
    function calculateProgress(elapsed: number, duration: number): number {
        return Math.min(elapsed / duration, 1);
    }

    it("should return 0 at start", () => {
        expect(calculateProgress(0, 500)).toBe(0);
    });

    it("should return 1 at end", () => {
        expect(calculateProgress(500, 500)).toBe(1);
    });

    it("should return 0.5 at halfway point", () => {
        expect(calculateProgress(250, 500)).toBe(0.5);
    });

    it("should cap at 1 for elapsed > duration", () => {
        expect(calculateProgress(1000, 500)).toBe(1);
    });

    it("should handle very short durations", () => {
        expect(calculateProgress(1, 1)).toBe(1);
    });

    it("should handle long durations", () => {
        expect(calculateProgress(500, 2000)).toBe(0.25);
    });
});
