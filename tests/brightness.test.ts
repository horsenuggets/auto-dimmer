/**
 * Brightness Tests
 *
 * Comprehensive tests for brightness detection and calculation utilities.
 */

import { describe, it, expect } from "../scripts/utils/test-runner";

// Re-implement pure functions for testing (avoiding DOM-dependent code)
function getColorBrightness(colorStr: string): number | null {
    if (!colorStr || colorStr === "transparent" || colorStr === "rgba(0, 0, 0, 0)") {
        return null;
    }

    const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (rgbMatch) {
        const r = parseInt(rgbMatch[1], 10) / 255;
        const g = parseInt(rgbMatch[2], 10) / 255;
        const b = parseInt(rgbMatch[3], 10) / 255;

        return 0.299 * r + 0.587 * g + 0.114 * b;
    }

    return null;
}

function calculateDimAmount(
    brightness: number,
    threshold: number,
    maxIntensity: number,
    dynamicMode: boolean
): number {
    if (brightness <= threshold) {
        return 0;
    }

    if (!dynamicMode) {
        return maxIntensity;
    }

    const brightnessOverThreshold = brightness - threshold;
    const maxOverThreshold = 1 - threshold;
    const scaleFactor = maxOverThreshold > 0 ? brightnessOverThreshold / maxOverThreshold : 1;

    return maxIntensity * scaleFactor;
}

describe("getColorBrightness", () => {
    describe("transparent colors", () => {
        it("should return null for 'transparent'", () => {
            expect(getColorBrightness("transparent")).toBeNull();
        });

        it("should return null for 'rgba(0, 0, 0, 0)'", () => {
            expect(getColorBrightness("rgba(0, 0, 0, 0)")).toBeNull();
        });

        it("should return null for empty string", () => {
            expect(getColorBrightness("")).toBeNull();
        });
    });

    describe("pure colors", () => {
        it("should return 0 for pure black rgb(0, 0, 0)", () => {
            expect(getColorBrightness("rgb(0, 0, 0)")).toBe(0);
        });

        it("should return ~1 for pure white rgb(255, 255, 255)", () => {
            const brightness = getColorBrightness("rgb(255, 255, 255)");
            expect(brightness).not.toBeNull();
            expect(Math.abs(brightness! - 1)).toBeLessThan(0.001);
        });

        it("should return 0.299 for pure red rgb(255, 0, 0)", () => {
            const brightness = getColorBrightness("rgb(255, 0, 0)");
            expect(brightness).not.toBeNull();
            expect(Math.abs(brightness! - 0.299)).toBeLessThan(0.001);
        });

        it("should return 0.587 for pure green rgb(0, 255, 0)", () => {
            const brightness = getColorBrightness("rgb(0, 255, 0)");
            expect(brightness).not.toBeNull();
            expect(Math.abs(brightness! - 0.587)).toBeLessThan(0.001);
        });

        it("should return 0.114 for pure blue rgb(0, 0, 255)", () => {
            const brightness = getColorBrightness("rgb(0, 0, 255)");
            expect(brightness).not.toBeNull();
            expect(Math.abs(brightness! - 0.114)).toBeLessThan(0.001);
        });
    });

    describe("rgba format", () => {
        it("should parse rgba with full opacity", () => {
            const brightness = getColorBrightness("rgba(255, 255, 255, 1)");
            expect(brightness).not.toBeNull();
            expect(Math.abs(brightness! - 1)).toBeLessThan(0.001);
        });

        it("should parse rgba with partial opacity", () => {
            const brightness = getColorBrightness("rgba(255, 255, 255, 0.5)");
            expect(brightness).not.toBeNull();
            expect(Math.abs(brightness! - 1)).toBeLessThan(0.001);
        });

        it("should parse rgba with decimal alpha", () => {
            const brightness = getColorBrightness("rgba(128, 128, 128, 0.75)");
            expect(brightness).not.toBeNull();
        });
    });

    describe("grayscale colors", () => {
        it("should return ~0.5 for mid-gray rgb(128, 128, 128)", () => {
            const brightness = getColorBrightness("rgb(128, 128, 128)");
            expect(brightness).not.toBeNull();
            expect(Math.abs(brightness! - 0.502)).toBeLessThan(0.01);
        });

        it("should return ~0.25 for dark gray rgb(64, 64, 64)", () => {
            const brightness = getColorBrightness("rgb(64, 64, 64)");
            expect(brightness).not.toBeNull();
            expect(Math.abs(brightness! - 0.251)).toBeLessThan(0.01);
        });

        it("should return ~0.75 for light gray rgb(192, 192, 192)", () => {
            const brightness = getColorBrightness("rgb(192, 192, 192)");
            expect(brightness).not.toBeNull();
            expect(Math.abs(brightness! - 0.753)).toBeLessThan(0.01);
        });
    });

    describe("mixed colors", () => {
        it("should calculate brightness for yellow rgb(255, 255, 0)", () => {
            const brightness = getColorBrightness("rgb(255, 255, 0)");
            expect(brightness).not.toBeNull();
            // Yellow = 0.299 + 0.587 = 0.886
            expect(Math.abs(brightness! - 0.886)).toBeLessThan(0.01);
        });

        it("should calculate brightness for cyan rgb(0, 255, 255)", () => {
            const brightness = getColorBrightness("rgb(0, 255, 255)");
            expect(brightness).not.toBeNull();
            // Cyan = 0.587 + 0.114 = 0.701
            expect(Math.abs(brightness! - 0.701)).toBeLessThan(0.01);
        });

        it("should calculate brightness for magenta rgb(255, 0, 255)", () => {
            const brightness = getColorBrightness("rgb(255, 0, 255)");
            expect(brightness).not.toBeNull();
            // Magenta = 0.299 + 0.114 = 0.413
            expect(Math.abs(brightness! - 0.413)).toBeLessThan(0.01);
        });
    });

    describe("invalid formats", () => {
        it("should return null for hex format", () => {
            expect(getColorBrightness("#ffffff")).toBeNull();
        });

        it("should return null for named colors", () => {
            expect(getColorBrightness("white")).toBeNull();
            expect(getColorBrightness("black")).toBeNull();
            expect(getColorBrightness("red")).toBeNull();
        });

        it("should return null for hsl format", () => {
            expect(getColorBrightness("hsl(0, 100%, 50%)")).toBeNull();
        });

        it("should return null for malformed rgb", () => {
            expect(getColorBrightness("rgb(256, 0, 0)")).not.toBeNull(); // Still parses
            expect(getColorBrightness("rgb(0, 0)")).toBeNull();
            expect(getColorBrightness("rgb()")).toBeNull();
        });
    });

    describe("spacing variations", () => {
        it("should handle no spaces", () => {
            const brightness = getColorBrightness("rgb(255,255,255)");
            expect(brightness).not.toBeNull();
            expect(Math.abs(brightness! - 1)).toBeLessThan(0.001);
        });

        it("should handle extra spaces", () => {
            const brightness = getColorBrightness("rgb(255,  255,  255)");
            expect(brightness).not.toBeNull();
            expect(Math.abs(brightness! - 1)).toBeLessThan(0.001);
        });
    });
});

describe("calculateDimAmount", () => {
    describe("below threshold", () => {
        it("should return 0 when brightness is below threshold", () => {
            expect(calculateDimAmount(0.3, 0.6, 0.5, true)).toBe(0);
        });

        it("should return 0 when brightness equals threshold", () => {
            expect(calculateDimAmount(0.6, 0.6, 0.5, true)).toBe(0);
        });

        it("should return 0 for very dark pages", () => {
            expect(calculateDimAmount(0.1, 0.5, 1, true)).toBe(0);
        });

        it("should return 0 for zero brightness", () => {
            expect(calculateDimAmount(0, 0.5, 0.5, true)).toBe(0);
        });
    });

    describe("static mode (dynamicMode = false)", () => {
        it("should return full intensity when above threshold", () => {
            expect(calculateDimAmount(0.8, 0.5, 0.7, false)).toBe(0.7);
        });

        it("should return full intensity even slightly above threshold", () => {
            expect(calculateDimAmount(0.51, 0.5, 0.7, false)).toBe(0.7);
        });

        it("should return full intensity at max brightness", () => {
            expect(calculateDimAmount(1, 0.5, 0.5, false)).toBe(0.5);
        });

        it("should still return 0 when below threshold", () => {
            expect(calculateDimAmount(0.3, 0.5, 0.7, false)).toBe(0);
        });
    });

    describe("dynamic mode scaling", () => {
        it("should return full intensity when brightness is 1", () => {
            const result = calculateDimAmount(1, 0.6, 0.5, true);
            expect(Math.abs(result - 0.5)).toBeLessThan(0.01);
        });

        it("should return half intensity when brightness is halfway", () => {
            // threshold=0.6, brightness=0.8, max=1
            // (0.8-0.6)/(1-0.6) = 0.2/0.4 = 0.5
            // 0.5 * 0.4 = 0.2
            const result = calculateDimAmount(0.8, 0.6, 0.4, true);
            expect(Math.abs(result - 0.2)).toBeLessThan(0.01);
        });

        it("should scale linearly with brightness", () => {
            // threshold=0, brightness=0.5
            // (0.5-0)/(1-0) = 0.5
            // 0.5 * 1 = 0.5
            const result = calculateDimAmount(0.5, 0, 1, true);
            expect(Math.abs(result - 0.5)).toBeLessThan(0.01);
        });

        it("should handle threshold of 0", () => {
            const result = calculateDimAmount(0.25, 0, 1, true);
            expect(Math.abs(result - 0.25)).toBeLessThan(0.01);
        });
    });

    describe("edge cases", () => {
        it("should handle threshold of 1", () => {
            // When threshold is 1, brightness <= threshold, so return 0
            expect(calculateDimAmount(1, 1, 0.5, true)).toBe(0);
        });

        it("should handle zero max intensity", () => {
            expect(calculateDimAmount(1, 0.5, 0, true)).toBe(0);
        });

        it("should handle full intensity", () => {
            const result = calculateDimAmount(1, 0, 1, true);
            expect(Math.abs(result - 1)).toBeLessThan(0.01);
        });

        it("should handle very small differences above threshold", () => {
            const result = calculateDimAmount(0.501, 0.5, 1, true);
            expect(result).toBeGreaterThan(0);
            expect(result).toBeLessThan(0.01);
        });
    });

    describe("real-world scenarios", () => {
        it("should lightly dim a moderately bright page", () => {
            // 70% bright page, 50% threshold, 50% max intensity
            const result = calculateDimAmount(0.7, 0.5, 0.5, true);
            // (0.7-0.5)/(1-0.5) = 0.2/0.5 = 0.4
            // 0.4 * 0.5 = 0.2
            expect(Math.abs(result - 0.2)).toBeLessThan(0.01);
        });

        it("should heavily dim a very bright page", () => {
            // 95% bright page, 50% threshold, 80% max intensity
            const result = calculateDimAmount(0.95, 0.5, 0.8, true);
            // (0.95-0.5)/(1-0.5) = 0.45/0.5 = 0.9
            // 0.9 * 0.8 = 0.72
            expect(Math.abs(result - 0.72)).toBeLessThan(0.01);
        });

        it("should not dim a dark page at all", () => {
            expect(calculateDimAmount(0.2, 0.5, 0.8, true)).toBe(0);
        });
    });
});
