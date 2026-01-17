/**
 * Overlay Tests
 *
 * Tests for overlay management utilities, primarily the clamp function.
 * DOM-related functions are tested via Puppeteer E2E tests.
 */

import { describe, it, expect } from "../scripts/utils/test-runner";

// Re-implement pure functions for testing
function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

describe("clamp", () => {
    describe("within range", () => {
        it("should return value when within range", () => {
            expect(clamp(0.5, 0, 1)).toBe(0.5);
        });

        it("should return exact min boundary value", () => {
            expect(clamp(0, 0, 1)).toBe(0);
        });

        it("should return exact max boundary value", () => {
            expect(clamp(1, 0, 1)).toBe(1);
        });

        it("should return value close to min", () => {
            expect(clamp(0.001, 0, 1)).toBe(0.001);
        });

        it("should return value close to max", () => {
            expect(clamp(0.999, 0, 1)).toBe(0.999);
        });
    });

    describe("below range", () => {
        it("should return min when value is below range", () => {
            expect(clamp(-0.5, 0, 1)).toBe(0);
        });

        it("should return min for very negative values", () => {
            expect(clamp(-1000, 0, 1)).toBe(0);
        });

        it("should return min when slightly below", () => {
            expect(clamp(-0.001, 0, 1)).toBe(0);
        });

        it("should handle negative infinity", () => {
            expect(clamp(-Infinity, 0, 1)).toBe(0);
        });
    });

    describe("above range", () => {
        it("should return max when value is above range", () => {
            expect(clamp(1.5, 0, 1)).toBe(1);
        });

        it("should return max for very large values", () => {
            expect(clamp(1000, 0, 1)).toBe(1);
        });

        it("should return max when slightly above", () => {
            expect(clamp(1.001, 0, 1)).toBe(1);
        });

        it("should handle positive infinity", () => {
            expect(clamp(Infinity, 0, 1)).toBe(1);
        });
    });

    describe("different ranges", () => {
        it("should work with negative range", () => {
            expect(clamp(-5, -10, -1)).toBe(-5);
            expect(clamp(-15, -10, -1)).toBe(-10);
            expect(clamp(0, -10, -1)).toBe(-1);
        });

        it("should work with range crossing zero", () => {
            expect(clamp(0, -5, 5)).toBe(0);
            expect(clamp(-10, -5, 5)).toBe(-5);
            expect(clamp(10, -5, 5)).toBe(5);
        });

        it("should work with large range", () => {
            expect(clamp(500, 0, 1000)).toBe(500);
            expect(clamp(-100, 0, 1000)).toBe(0);
            expect(clamp(1500, 0, 1000)).toBe(1000);
        });

        it("should work with percentage range (0-100)", () => {
            expect(clamp(50, 0, 100)).toBe(50);
            expect(clamp(-10, 0, 100)).toBe(0);
            expect(clamp(150, 0, 100)).toBe(100);
        });
    });

    describe("edge cases", () => {
        it("should handle min equals max", () => {
            expect(clamp(0.5, 0.5, 0.5)).toBe(0.5);
            expect(clamp(0, 0.5, 0.5)).toBe(0.5);
            expect(clamp(1, 0.5, 0.5)).toBe(0.5);
        });

        it("should handle zero range at zero", () => {
            expect(clamp(-1, 0, 0)).toBe(0);
            expect(clamp(0, 0, 0)).toBe(0);
            expect(clamp(1, 0, 0)).toBe(0);
        });

        it("should handle floating point precision", () => {
            const result = clamp(0.1 + 0.2, 0, 1);
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThanOrEqual(1);
        });

        it("should handle very small numbers", () => {
            expect(clamp(1e-10, 0, 1)).toBe(1e-10);
            expect(clamp(-1e-10, 0, 1)).toBe(0);
        });

        it("should handle very large numbers", () => {
            expect(clamp(1e10, 0, 1)).toBe(1);
            expect(clamp(-1e10, 0, 1)).toBe(0);
        });
    });

    describe("dim level scenarios", () => {
        it("should clamp negative dim levels to 0", () => {
            expect(clamp(-0.5, 0, 1)).toBe(0);
            expect(clamp(-351, 0, 1)).toBe(0); // The bug case
        });

        it("should clamp excessive dim levels to 1", () => {
            expect(clamp(1.5, 0, 1)).toBe(1);
            expect(clamp(3.51, 0, 1)).toBe(1);
        });

        it("should preserve valid dim levels", () => {
            expect(clamp(0.3, 0, 1)).toBe(0.3);
            expect(clamp(0.7, 0, 1)).toBe(0.7);
        });
    });
});
