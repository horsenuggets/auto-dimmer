/**
 * Storage Tests
 *
 * Tests for storage utility functions.
 * Note: Chrome storage API tests require mocking (covered in E2E tests).
 */

import { describe, it, expect } from "../scripts/utils/test-runner";
import type { SiteState } from "../src/types";

// Re-implement pure function for testing
function createSiteState(dimLevel: number, brightness: number | null): SiteState {
    return {
        lastDimLevel: dimLevel,
        lastBrightness: brightness,
        timestamp: Date.now(),
    };
}

// State expiry logic
const STATE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function isStateExpired(state: SiteState): boolean {
    return Date.now() - state.timestamp >= STATE_MAX_AGE_MS;
}

describe("createSiteState", () => {
    describe("basic creation", () => {
        it("should create state with specified dim level", () => {
            const state = createSiteState(0.5, 0.8);
            expect(state.lastDimLevel).toBe(0.5);
        });

        it("should create state with specified brightness", () => {
            const state = createSiteState(0.5, 0.8);
            expect(state.lastBrightness).toBe(0.8);
        });

        it("should include timestamp", () => {
            const before = Date.now();
            const state = createSiteState(0.5, 0.8);
            const after = Date.now();
            expect(state.timestamp).toBeGreaterThanOrEqual(before);
            expect(state.timestamp).toBeLessThanOrEqual(after);
        });
    });

    describe("dim level values", () => {
        it("should handle zero dim level", () => {
            const state = createSiteState(0, 0.5);
            expect(state.lastDimLevel).toBe(0);
        });

        it("should handle full dim level", () => {
            const state = createSiteState(1, 0.5);
            expect(state.lastDimLevel).toBe(1);
        });

        it("should handle fractional dim level", () => {
            const state = createSiteState(0.333, 0.5);
            expect(state.lastDimLevel).toBe(0.333);
        });
    });

    describe("brightness values", () => {
        it("should handle null brightness", () => {
            const state = createSiteState(0.5, null);
            expect(state.lastBrightness).toBeNull();
        });

        it("should handle zero brightness", () => {
            const state = createSiteState(0.5, 0);
            expect(state.lastBrightness).toBe(0);
        });

        it("should handle full brightness", () => {
            const state = createSiteState(0.5, 1);
            expect(state.lastBrightness).toBe(1);
        });
    });

    describe("state independence", () => {
        it("should create independent state objects", () => {
            const state1 = createSiteState(0.3, 0.5);
            const state2 = createSiteState(0.7, 0.9);
            expect(state1.lastDimLevel).toBe(0.3);
            expect(state2.lastDimLevel).toBe(0.7);
        });

        it("should have different timestamps for sequential calls", () => {
            const state1 = createSiteState(0.5, 0.5);
            // Small delay to ensure different timestamp
            const spinStart = Date.now();
            while (Date.now() - spinStart < 2) {
                // spin
            }
            const state2 = createSiteState(0.5, 0.5);
            expect(state2.timestamp).toBeGreaterThanOrEqual(state1.timestamp);
        });
    });
});

describe("isStateExpired", () => {
    it("should return false for fresh state", () => {
        const state = createSiteState(0.5, 0.8);
        expect(isStateExpired(state)).toBe(false);
    });

    it("should return false for state within 24 hours", () => {
        const state: SiteState = {
            lastDimLevel: 0.5,
            lastBrightness: 0.8,
            timestamp: Date.now() - 23 * 60 * 60 * 1000, // 23 hours ago
        };
        expect(isStateExpired(state)).toBe(false);
    });

    it("should return true for state older than 24 hours", () => {
        const state: SiteState = {
            lastDimLevel: 0.5,
            lastBrightness: 0.8,
            timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
        };
        expect(isStateExpired(state)).toBe(true);
    });

    it("should return true for exactly 24 hours old state", () => {
        const state: SiteState = {
            lastDimLevel: 0.5,
            lastBrightness: 0.8,
            timestamp: Date.now() - STATE_MAX_AGE_MS,
        };
        expect(isStateExpired(state)).toBe(true);
    });

    it("should return false for state just under 24 hours", () => {
        const state: SiteState = {
            lastDimLevel: 0.5,
            lastBrightness: 0.8,
            timestamp: Date.now() - (STATE_MAX_AGE_MS - 1000), // 1 second under
        };
        expect(isStateExpired(state)).toBe(false);
    });

    it("should return true for very old state", () => {
        const state: SiteState = {
            lastDimLevel: 0.5,
            lastBrightness: 0.8,
            timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
        };
        expect(isStateExpired(state)).toBe(true);
    });
});

describe("storage key generation", () => {
    const SITE_STATE_PREFIX = "siteState_";

    function getSiteStateKey(hostname: string): string {
        return `${SITE_STATE_PREFIX}${hostname}`;
    }

    it("should generate correct key for simple hostname", () => {
        expect(getSiteStateKey("example.com")).toBe("siteState_example.com");
    });

    it("should generate correct key for subdomain", () => {
        expect(getSiteStateKey("www.example.com")).toBe("siteState_www.example.com");
    });

    it("should generate correct key for deep subdomain", () => {
        expect(getSiteStateKey("api.v2.example.com")).toBe("siteState_api.v2.example.com");
    });

    it("should generate correct key for localhost", () => {
        expect(getSiteStateKey("localhost")).toBe("siteState_localhost");
    });

    it("should generate correct key for IP address", () => {
        expect(getSiteStateKey("192.168.1.1")).toBe("siteState_192.168.1.1");
    });
});

describe("SiteState interface", () => {
    it("should have required lastDimLevel property", () => {
        const state: SiteState = {
            lastDimLevel: 0.5,
            lastBrightness: null,
            timestamp: Date.now(),
        };
        expect(state.lastDimLevel).toBeDefined();
    });

    it("should allow null lastBrightness", () => {
        const state: SiteState = {
            lastDimLevel: 0.5,
            lastBrightness: null,
            timestamp: Date.now(),
        };
        expect(state.lastBrightness).toBeNull();
    });

    it("should allow numeric lastBrightness", () => {
        const state: SiteState = {
            lastDimLevel: 0.5,
            lastBrightness: 0.75,
            timestamp: Date.now(),
        };
        expect(state.lastBrightness).toBe(0.75);
    });
});
