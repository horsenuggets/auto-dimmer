/**
 * Settings utilities
 *
 * Functions for managing and merging settings with site-specific overrides.
 */

import type { Settings, SiteSettings } from "../types";
import { matchesAnyPattern } from "./patterns";

/**
 * Get effective settings for a hostname, merging global with site-specific overrides.
 */
export function getEffectiveSettings(settings: Settings, hostname: string): Settings {
    const siteOverride = settings.siteSettings[hostname];

    if (siteOverride) {
        return { ...settings, ...siteOverride };
    }

    return settings;
}

/**
 * Check if a hostname is blacklisted (should never be dimmed).
 */
export function isBlacklisted(settings: Settings, hostname: string): boolean {
    return matchesAnyPattern(hostname, settings.blacklist);
}

/**
 * Check if a hostname is whitelisted (should always be dimmed).
 */
export function isWhitelisted(settings: Settings, hostname: string): boolean {
    return matchesAnyPattern(hostname, settings.whitelist);
}

/**
 * Merge site settings into existing settings object.
 */
export function mergeSiteSettings(
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

/**
 * Remove site-specific settings for a hostname.
 */
export function clearSiteSettings(settings: Settings, hostname: string): Settings {
    const newSiteSettings = { ...settings.siteSettings };
    delete newSiteSettings[hostname];

    return {
        ...settings,
        siteSettings: newSiteSettings,
    };
}

/**
 * Add a hostname to the blacklist.
 */
export function addToBlacklist(settings: Settings, hostname: string): Settings {
    if (settings.blacklist.includes(hostname)) {
        return settings;
    }

    return {
        ...settings,
        blacklist: [...settings.blacklist, hostname],
    };
}

/**
 * Remove a hostname from the blacklist.
 */
export function removeFromBlacklist(settings: Settings, index: number): Settings {
    return {
        ...settings,
        blacklist: settings.blacklist.filter((_, i) => i !== index),
    };
}

/**
 * Add a hostname to the whitelist.
 */
export function addToWhitelist(settings: Settings, hostname: string): Settings {
    if (settings.whitelist.includes(hostname)) {
        return settings;
    }

    return {
        ...settings,
        whitelist: [...settings.whitelist, hostname],
    };
}

/**
 * Remove a hostname from the whitelist.
 */
export function removeFromWhitelist(settings: Settings, index: number): Settings {
    return {
        ...settings,
        whitelist: settings.whitelist.filter((_, i) => i !== index),
    };
}
