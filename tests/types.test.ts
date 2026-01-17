/**
 * Types Tests
 *
 * Tests for the shared types and default settings.
 */

import { describe, it, expect } from "../scripts/utils/test-runner";
import { DEFAULT_SETTINGS, type Settings, type SiteSettings } from "../src/types";

describe("DEFAULT_SETTINGS", () => {
    it("should have enabled set to true", () => {
        expect(DEFAULT_SETTINGS.enabled).toBe(true);
    });

    it("should have dimIntensity between 0 and 1", () => {
        expect(DEFAULT_SETTINGS.dimIntensity).toBeGreaterThanOrEqual(0);
        expect(DEFAULT_SETTINGS.dimIntensity).toBeLessThanOrEqual(1);
    });

    it("should have brightnessThreshold between 0 and 1", () => {
        expect(DEFAULT_SETTINGS.brightnessThreshold).toBeGreaterThanOrEqual(0);
        expect(DEFAULT_SETTINGS.brightnessThreshold).toBeLessThanOrEqual(1);
    });

    it("should have dynamicMode enabled by default", () => {
        expect(DEFAULT_SETTINGS.dynamicMode).toBe(true);
    });

    it("should have smoothing enabled by default", () => {
        expect(DEFAULT_SETTINGS.smoothing).toBe(true);
    });

    it("should have a positive smoothingDuration", () => {
        expect(DEFAULT_SETTINGS.smoothingDuration).toBeGreaterThan(0);
    });

    it("should have empty siteSettings by default", () => {
        expect(Object.keys(DEFAULT_SETTINGS.siteSettings)).toHaveLength(0);
    });

    it("should have empty blacklist by default", () => {
        expect(DEFAULT_SETTINGS.blacklist).toHaveLength(0);
    });

    it("should have empty whitelist by default", () => {
        expect(DEFAULT_SETTINGS.whitelist).toHaveLength(0);
    });
});

describe("Settings type structure", () => {
    it("should allow creating valid Settings object", () => {
        const settings: Settings = {
            enabled: false,
            dimIntensity: 0.5,
            brightnessThreshold: 0.7,
            dynamicMode: false,
            smoothing: false,
            smoothingDuration: 1000,
            siteSettings: {},
            blacklist: ["example.com"],
            whitelist: ["test.com"],
        };

        expect(settings.enabled).toBe(false);
        expect(settings.dimIntensity).toBe(0.5);
        expect(settings.blacklist).toContain("example.com");
        expect(settings.whitelist).toContain("test.com");
    });

    it("should allow partial SiteSettings overrides", () => {
        const siteSettings: SiteSettings = {
            enabled: false,
        };

        expect(siteSettings.enabled).toBe(false);
        expect(siteSettings.dimIntensity).toBeUndefined();
    });

    it("should allow SiteSettings with dimIntensity only", () => {
        const siteSettings: SiteSettings = {
            dimIntensity: 0.8,
        };

        expect(siteSettings.dimIntensity).toBe(0.8);
        expect(siteSettings.enabled).toBeUndefined();
    });
});

describe("Settings merging", () => {
    it("should merge site settings with global settings", () => {
        const globalSettings = { ...DEFAULT_SETTINGS };
        const siteOverride: SiteSettings = {
            enabled: false,
            dimIntensity: 0.9,
        };

        const merged = { ...globalSettings, ...siteOverride };

        expect(merged.enabled).toBe(false);
        expect(merged.dimIntensity).toBe(0.9);
        expect(merged.brightnessThreshold).toBe(DEFAULT_SETTINGS.brightnessThreshold);
    });

    it("should not modify original settings when merging", () => {
        const original = { ...DEFAULT_SETTINGS };
        const originalEnabled = original.enabled;

        const merged = { ...original, enabled: false };

        expect(original.enabled).toBe(originalEnabled);
        expect(merged.enabled).toBe(false);
    });
});
