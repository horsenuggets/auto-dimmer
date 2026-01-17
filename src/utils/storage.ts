/**
 * Chrome storage utilities
 *
 * Functions for saving and loading settings and site state from Chrome storage.
 */

import type { Settings, SiteState } from "../types";
import { DEFAULT_SETTINGS } from "../types";

const SETTINGS_KEY = "autoDimmerSettings";
const SITE_STATE_PREFIX = "siteState_";
const STATE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Load settings from Chrome sync storage.
 */
export async function loadSettings(): Promise<Settings> {
    return new Promise((resolve) => {
        chrome.storage.sync.get([SETTINGS_KEY], (result) => {
            if (result[SETTINGS_KEY]) {
                resolve({ ...DEFAULT_SETTINGS, ...result[SETTINGS_KEY] });
            } else {
                resolve({ ...DEFAULT_SETTINGS });
            }
        });
    });
}

/**
 * Save settings to Chrome sync storage.
 */
export async function saveSettings(settings: Settings): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ [SETTINGS_KEY]: settings }, () => {
            resolve();
        });
    });
}

/**
 * Load saved state for a specific site from local storage.
 * Returns null if no state exists or if it's older than 24 hours.
 */
export async function loadSiteState(hostname: string): Promise<SiteState | null> {
    const key = `${SITE_STATE_PREFIX}${hostname}`;

    return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
            const state = result[key] as SiteState | undefined;

            if (state && Date.now() - state.timestamp < STATE_MAX_AGE_MS) {
                resolve(state);
            } else {
                resolve(null);
            }
        });
    });
}

/**
 * Save state for a specific site to local storage.
 */
export async function saveSiteState(hostname: string, state: SiteState): Promise<void> {
    const key = `${SITE_STATE_PREFIX}${hostname}`;

    return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: state }, () => {
            resolve();
        });
    });
}

/**
 * Create a site state object.
 */
export function createSiteState(dimLevel: number, brightness: number | null): SiteState {
    return {
        lastDimLevel: dimLevel,
        lastBrightness: brightness,
        timestamp: Date.now(),
    };
}
