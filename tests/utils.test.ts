/**
 * Utils Tests
 *
 * Tests for utility functions extracted from the extension logic.
 */

import { describe, it, expect } from "../scripts/utils/test-runner";

// Extract and test pure utility functions

/**
 * Parse color string and return brightness (0-1)
 */
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

/**
 * Check if a hostname matches a pattern
 */
function matchesPattern(hostname: string, pattern: string): boolean {
    return hostname.includes(pattern) || pattern.includes(hostname);
}

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Calculate dynamic dim amount based on brightness
 */
function calculateDynamicDim(brightness: number, threshold: number, maxIntensity: number): number {
    if (brightness <= threshold) {
        return 0;
    }

    const brightnessOverThreshold = brightness - threshold;
    const maxOverThreshold = 1 - threshold;
    const scaleFactor = maxOverThreshold > 0 ? brightnessOverThreshold / maxOverThreshold : 1;

    return maxIntensity * scaleFactor;
}

describe("getColorBrightness", () => {
    it("should return null for transparent", () => {
        expect(getColorBrightness("transparent")).toBeNull();
    });

    it("should return null for rgba(0, 0, 0, 0)", () => {
        expect(getColorBrightness("rgba(0, 0, 0, 0)")).toBeNull();
    });

    it("should return null for empty string", () => {
        expect(getColorBrightness("")).toBeNull();
    });

    it("should return 0 for pure black rgb(0, 0, 0)", () => {
        const brightness = getColorBrightness("rgb(0, 0, 0)");
        expect(brightness).toBe(0);
    });

    it("should return ~1 for pure white rgb(255, 255, 255)", () => {
        const brightness = getColorBrightness("rgb(255, 255, 255)");
        expect(brightness).not.toBeNull();
        if (brightness !== null) {
            expect(Math.abs(brightness - 1)).toBeLessThan(0.001);
        }
    });

    it("should parse rgba format", () => {
        const brightness = getColorBrightness("rgba(255, 255, 255, 0.5)");
        expect(brightness).not.toBeNull();
        if (brightness !== null) {
            expect(Math.abs(brightness - 1)).toBeLessThan(0.001);
        }
    });

    it("should calculate correct brightness for red", () => {
        const brightness = getColorBrightness("rgb(255, 0, 0)");
        expect(brightness).not.toBeNull();
        if (brightness !== null) {
            // Red contributes 0.299
            expect(Math.abs(brightness - 0.299)).toBeLessThan(0.01);
        }
    });

    it("should calculate correct brightness for green", () => {
        const brightness = getColorBrightness("rgb(0, 255, 0)");
        expect(brightness).not.toBeNull();
        if (brightness !== null) {
            // Green contributes 0.587
            expect(Math.abs(brightness - 0.587)).toBeLessThan(0.01);
        }
    });

    it("should calculate correct brightness for blue", () => {
        const brightness = getColorBrightness("rgb(0, 0, 255)");
        expect(brightness).not.toBeNull();
        if (brightness !== null) {
            // Blue contributes 0.114
            expect(Math.abs(brightness - 0.114)).toBeLessThan(0.01);
        }
    });

    it("should return null for invalid color format", () => {
        expect(getColorBrightness("#ffffff")).toBeNull();
        expect(getColorBrightness("white")).toBeNull();
    });
});

describe("matchesPattern", () => {
    it("should match exact hostname", () => {
        expect(matchesPattern("example.com", "example.com")).toBe(true);
    });

    it("should match partial hostname in pattern", () => {
        expect(matchesPattern("www.example.com", "example")).toBe(true);
    });

    it("should match partial pattern in hostname", () => {
        expect(matchesPattern("example", "example.com")).toBe(true);
    });

    it("should not match unrelated hostnames", () => {
        expect(matchesPattern("google.com", "facebook.com")).toBe(false);
    });

    it("should match subdomain patterns", () => {
        expect(matchesPattern("sub.example.com", "example.com")).toBe(true);
    });
});

describe("clamp", () => {
    it("should return value when within range", () => {
        expect(clamp(0.5, 0, 1)).toBe(0.5);
    });

    it("should return min when value is below range", () => {
        expect(clamp(-0.5, 0, 1)).toBe(0);
    });

    it("should return max when value is above range", () => {
        expect(clamp(1.5, 0, 1)).toBe(1);
    });

    it("should handle edge case at min", () => {
        expect(clamp(0, 0, 1)).toBe(0);
    });

    it("should handle edge case at max", () => {
        expect(clamp(1, 0, 1)).toBe(1);
    });
});

describe("calculateDynamicDim", () => {
    it("should return 0 when brightness is below threshold", () => {
        expect(calculateDynamicDim(0.3, 0.6, 0.5)).toBe(0);
    });

    it("should return 0 when brightness equals threshold", () => {
        expect(calculateDynamicDim(0.6, 0.6, 0.5)).toBe(0);
    });

    it("should return full intensity when brightness is 1", () => {
        const result = calculateDynamicDim(1, 0.6, 0.5);
        expect(Math.abs(result - 0.5)).toBeLessThan(0.01);
    });

    it("should return half intensity when brightness is halfway between threshold and max", () => {
        // threshold = 0.6, brightness = 0.8, max = 1
        // (0.8 - 0.6) / (1 - 0.6) = 0.2 / 0.4 = 0.5
        // 0.5 * 0.4 (intensity) = 0.2
        const result = calculateDynamicDim(0.8, 0.6, 0.4);
        expect(Math.abs(result - 0.2)).toBeLessThan(0.01);
    });

    it("should handle threshold of 0", () => {
        const result = calculateDynamicDim(0.5, 0, 1);
        expect(Math.abs(result - 0.5)).toBeLessThan(0.01);
    });

    it("should handle threshold of 1", () => {
        // When threshold is 1, maxOverThreshold is 0, so scaleFactor defaults to 1
        const result = calculateDynamicDim(1, 1, 0.5);
        expect(result).toBe(0); // brightness equals threshold, so no dim
    });
});
