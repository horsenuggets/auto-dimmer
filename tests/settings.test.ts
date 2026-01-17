/**
 * Settings Tests
 *
 * Comprehensive tests for settings management utilities.
 */

import { describe, it, expect } from "../scripts/utils/test-runner";
import type { Settings, SiteSettings } from "../src/types";
import { DEFAULT_SETTINGS } from "../src/types";

// Re-implement pure functions for testing
function matchesPattern(hostname: string, pattern: string): boolean {
    if (!hostname || !pattern) {
        return false;
    }
    return hostname.includes(pattern) || pattern.includes(hostname);
}

function matchesAnyPattern(hostname: string, patterns: string[]): boolean {
    return patterns.some((pattern) => matchesPattern(hostname, pattern));
}

function getEffectiveSettings(settings: Settings, hostname: string): Settings {
    const siteOverride = settings.siteSettings[hostname];

    if (siteOverride) {
        return { ...settings, ...siteOverride };
    }

    return settings;
}

function isBlacklisted(settings: Settings, hostname: string): boolean {
    return matchesAnyPattern(hostname, settings.blacklist);
}

function isWhitelisted(settings: Settings, hostname: string): boolean {
    return matchesAnyPattern(hostname, settings.whitelist);
}

function mergeSiteSettings(
    settings: Settings,
    hostname: string,
    siteSettings: SiteSettings
): Settings {
    return {
        ...settings,
        siteSettings: {
            ...settings.siteSettings,
            [hostname]: {
                ...settings.siteSettings[hostname],
                ...siteSettings,
            },
        },
    };
}

function clearSiteSettings(settings: Settings, hostname: string): Settings {
    const newSiteSettings = { ...settings.siteSettings };
    delete newSiteSettings[hostname];

    return {
        ...settings,
        siteSettings: newSiteSettings,
    };
}

function addToBlacklist(settings: Settings, hostname: string): Settings {
    if (settings.blacklist.includes(hostname)) {
        return settings;
    }

    return {
        ...settings,
        blacklist: [...settings.blacklist, hostname],
    };
}

function removeFromBlacklist(settings: Settings, index: number): Settings {
    return {
        ...settings,
        blacklist: settings.blacklist.filter((_, i) => i !== index),
    };
}

function addToWhitelist(settings: Settings, hostname: string): Settings {
    if (settings.whitelist.includes(hostname)) {
        return settings;
    }

    return {
        ...settings,
        whitelist: [...settings.whitelist, hostname],
    };
}

function removeFromWhitelist(settings: Settings, index: number): Settings {
    return {
        ...settings,
        whitelist: settings.whitelist.filter((_, i) => i !== index),
    };
}

describe("DEFAULT_SETTINGS", () => {
    it("should have enabled set to true", () => {
        expect(DEFAULT_SETTINGS.enabled).toBe(true);
    });

    it("should have dimIntensity of 0.3", () => {
        expect(DEFAULT_SETTINGS.dimIntensity).toBe(0.3);
    });

    it("should have brightnessThreshold of 0.6", () => {
        expect(DEFAULT_SETTINGS.brightnessThreshold).toBe(0.6);
    });

    it("should have dynamicMode enabled", () => {
        expect(DEFAULT_SETTINGS.dynamicMode).toBe(true);
    });

    it("should have smoothing enabled", () => {
        expect(DEFAULT_SETTINGS.smoothing).toBe(true);
    });

    it("should have smoothingDuration of 500ms", () => {
        expect(DEFAULT_SETTINGS.smoothingDuration).toBe(500);
    });

    it("should have empty blacklist", () => {
        expect(DEFAULT_SETTINGS.blacklist).toHaveLength(0);
    });

    it("should have empty whitelist", () => {
        expect(DEFAULT_SETTINGS.whitelist).toHaveLength(0);
    });

    it("should have empty siteSettings", () => {
        expect(Object.keys(DEFAULT_SETTINGS.siteSettings)).toHaveLength(0);
    });
});

describe("getEffectiveSettings", () => {
    it("should return original settings when no site override exists", () => {
        const settings = { ...DEFAULT_SETTINGS };
        const effective = getEffectiveSettings(settings, "example.com");
        expect(effective.dimIntensity).toBe(settings.dimIntensity);
    });

    it("should merge site-specific dimIntensity", () => {
        const settings: Settings = {
            ...DEFAULT_SETTINGS,
            siteSettings: {
                "example.com": { dimIntensity: 0.8 },
            },
        };
        const effective = getEffectiveSettings(settings, "example.com");
        expect(effective.dimIntensity).toBe(0.8);
    });

    it("should preserve global settings when merging", () => {
        const settings: Settings = {
            ...DEFAULT_SETTINGS,
            dimIntensity: 0.5,
            siteSettings: {
                "example.com": { enabled: false },
            },
        };
        const effective = getEffectiveSettings(settings, "example.com");
        expect(effective.dimIntensity).toBe(0.5);
        expect(effective.enabled).toBe(false);
    });

    it("should not affect other sites", () => {
        const settings: Settings = {
            ...DEFAULT_SETTINGS,
            siteSettings: {
                "example.com": { dimIntensity: 0.9 },
            },
        };
        const effective = getEffectiveSettings(settings, "other.com");
        expect(effective.dimIntensity).toBe(DEFAULT_SETTINGS.dimIntensity);
    });

    it("should handle multiple site overrides", () => {
        const settings: Settings = {
            ...DEFAULT_SETTINGS,
            siteSettings: {
                "example.com": { dimIntensity: 0.9 },
                "other.com": { dimIntensity: 0.2 },
            },
        };
        expect(getEffectiveSettings(settings, "example.com").dimIntensity).toBe(0.9);
        expect(getEffectiveSettings(settings, "other.com").dimIntensity).toBe(0.2);
    });
});

describe("isBlacklisted", () => {
    it("should return false for empty blacklist", () => {
        const settings = { ...DEFAULT_SETTINGS };
        expect(isBlacklisted(settings, "example.com")).toBe(false);
    });

    it("should return true for exact match", () => {
        const settings: Settings = {
            ...DEFAULT_SETTINGS,
            blacklist: ["example.com"],
        };
        expect(isBlacklisted(settings, "example.com")).toBe(true);
    });

    it("should return true for partial match", () => {
        const settings: Settings = {
            ...DEFAULT_SETTINGS,
            blacklist: ["example"],
        };
        expect(isBlacklisted(settings, "www.example.com")).toBe(true);
    });

    it("should return false for non-match", () => {
        const settings: Settings = {
            ...DEFAULT_SETTINGS,
            blacklist: ["facebook.com"],
        };
        expect(isBlacklisted(settings, "google.com")).toBe(false);
    });

    it("should check all patterns", () => {
        const settings: Settings = {
            ...DEFAULT_SETTINGS,
            blacklist: ["facebook.com", "twitter.com", "google.com"],
        };
        expect(isBlacklisted(settings, "google.com")).toBe(true);
    });
});

describe("isWhitelisted", () => {
    it("should return false for empty whitelist", () => {
        const settings = { ...DEFAULT_SETTINGS };
        expect(isWhitelisted(settings, "example.com")).toBe(false);
    });

    it("should return true for exact match", () => {
        const settings: Settings = {
            ...DEFAULT_SETTINGS,
            whitelist: ["example.com"],
        };
        expect(isWhitelisted(settings, "example.com")).toBe(true);
    });

    it("should return true for subdomain match", () => {
        const settings: Settings = {
            ...DEFAULT_SETTINGS,
            whitelist: ["example.com"],
        };
        expect(isWhitelisted(settings, "docs.example.com")).toBe(true);
    });
});

describe("mergeSiteSettings", () => {
    it("should add new site settings", () => {
        const settings = { ...DEFAULT_SETTINGS };
        const result = mergeSiteSettings(settings, "example.com", { dimIntensity: 0.5 });
        expect(result.siteSettings["example.com"].dimIntensity).toBe(0.5);
    });

    it("should merge with existing site settings", () => {
        const settings: Settings = {
            ...DEFAULT_SETTINGS,
            siteSettings: {
                "example.com": { dimIntensity: 0.3 },
            },
        };
        const result = mergeSiteSettings(settings, "example.com", { enabled: false });
        expect(result.siteSettings["example.com"].dimIntensity).toBe(0.3);
        expect(result.siteSettings["example.com"].enabled).toBe(false);
    });

    it("should override existing values", () => {
        const settings: Settings = {
            ...DEFAULT_SETTINGS,
            siteSettings: {
                "example.com": { dimIntensity: 0.3 },
            },
        };
        const result = mergeSiteSettings(settings, "example.com", { dimIntensity: 0.9 });
        expect(result.siteSettings["example.com"].dimIntensity).toBe(0.9);
    });

    it("should not mutate original settings", () => {
        const settings = { ...DEFAULT_SETTINGS };
        mergeSiteSettings(settings, "example.com", { dimIntensity: 0.5 });
        expect(settings.siteSettings["example.com"]).toBeUndefined();
    });

    it("should preserve other site settings", () => {
        const settings: Settings = {
            ...DEFAULT_SETTINGS,
            siteSettings: {
                "other.com": { dimIntensity: 0.7 },
            },
        };
        const result = mergeSiteSettings(settings, "example.com", { dimIntensity: 0.5 });
        expect(result.siteSettings["other.com"].dimIntensity).toBe(0.7);
    });
});

describe("clearSiteSettings", () => {
    it("should remove site settings", () => {
        const settings: Settings = {
            ...DEFAULT_SETTINGS,
            siteSettings: {
                "example.com": { dimIntensity: 0.5 },
            },
        };
        const result = clearSiteSettings(settings, "example.com");
        expect(result.siteSettings["example.com"]).toBeUndefined();
    });

    it("should not affect other sites", () => {
        const settings: Settings = {
            ...DEFAULT_SETTINGS,
            siteSettings: {
                "example.com": { dimIntensity: 0.5 },
                "other.com": { dimIntensity: 0.7 },
            },
        };
        const result = clearSiteSettings(settings, "example.com");
        expect(result.siteSettings["other.com"].dimIntensity).toBe(0.7);
    });

    it("should handle non-existent site", () => {
        const settings = { ...DEFAULT_SETTINGS };
        const result = clearSiteSettings(settings, "nonexistent.com");
        expect(Object.keys(result.siteSettings)).toHaveLength(0);
    });

    it("should not mutate original settings", () => {
        const settings: Settings = {
            ...DEFAULT_SETTINGS,
            siteSettings: {
                "example.com": { dimIntensity: 0.5 },
            },
        };
        clearSiteSettings(settings, "example.com");
        expect(settings.siteSettings["example.com"].dimIntensity).toBe(0.5);
    });
});

describe("addToBlacklist", () => {
    it("should add hostname to blacklist", () => {
        const settings = { ...DEFAULT_SETTINGS };
        const result = addToBlacklist(settings, "example.com");
        expect(result.blacklist).toContain("example.com");
    });

    it("should not add duplicate", () => {
        const settings: Settings = {
            ...DEFAULT_SETTINGS,
            blacklist: ["example.com"],
        };
        const result = addToBlacklist(settings, "example.com");
        expect(result.blacklist.filter((h) => h === "example.com")).toHaveLength(1);
    });

    it("should preserve existing entries", () => {
        const settings: Settings = {
            ...DEFAULT_SETTINGS,
            blacklist: ["other.com"],
        };
        const result = addToBlacklist(settings, "example.com");
        expect(result.blacklist).toContain("other.com");
        expect(result.blacklist).toContain("example.com");
    });

    it("should not mutate original settings", () => {
        const settings = { ...DEFAULT_SETTINGS };
        addToBlacklist(settings, "example.com");
        expect(settings.blacklist).toHaveLength(0);
    });
});

describe("removeFromBlacklist", () => {
    it("should remove hostname by index", () => {
        const settings: Settings = {
            ...DEFAULT_SETTINGS,
            blacklist: ["first.com", "second.com", "third.com"],
        };
        const result = removeFromBlacklist(settings, 1);
        expect(result.blacklist).not.toContain("second.com");
        expect(result.blacklist).toContain("first.com");
        expect(result.blacklist).toContain("third.com");
    });

    it("should handle first index", () => {
        const settings: Settings = {
            ...DEFAULT_SETTINGS,
            blacklist: ["first.com", "second.com"],
        };
        const result = removeFromBlacklist(settings, 0);
        expect(result.blacklist).not.toContain("first.com");
    });

    it("should handle last index", () => {
        const settings: Settings = {
            ...DEFAULT_SETTINGS,
            blacklist: ["first.com", "second.com"],
        };
        const result = removeFromBlacklist(settings, 1);
        expect(result.blacklist).not.toContain("second.com");
    });

    it("should not mutate original settings", () => {
        const settings: Settings = {
            ...DEFAULT_SETTINGS,
            blacklist: ["example.com"],
        };
        removeFromBlacklist(settings, 0);
        expect(settings.blacklist).toContain("example.com");
    });
});

describe("addToWhitelist", () => {
    it("should add hostname to whitelist", () => {
        const settings = { ...DEFAULT_SETTINGS };
        const result = addToWhitelist(settings, "example.com");
        expect(result.whitelist).toContain("example.com");
    });

    it("should not add duplicate", () => {
        const settings: Settings = {
            ...DEFAULT_SETTINGS,
            whitelist: ["example.com"],
        };
        const result = addToWhitelist(settings, "example.com");
        expect(result.whitelist.filter((h) => h === "example.com")).toHaveLength(1);
    });
});

describe("removeFromWhitelist", () => {
    it("should remove hostname by index", () => {
        const settings: Settings = {
            ...DEFAULT_SETTINGS,
            whitelist: ["first.com", "second.com"],
        };
        const result = removeFromWhitelist(settings, 0);
        expect(result.whitelist).not.toContain("first.com");
        expect(result.whitelist).toContain("second.com");
    });
});
