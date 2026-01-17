/**
 * Settings for the Auto Dimmer extension
 */
export interface Settings {
    enabled: boolean;
    dimIntensity: number; // 0-1, how much to dim (0.3 = 30% opacity black overlay)
    brightnessThreshold: number; // 0-1, brightness level that triggers dimming
    dynamicMode: boolean; // Continuously adjust based on current brightness
    smoothing: boolean; // Smooth transitions
    smoothingDuration: number; // Transition duration in ms
    siteSettings: Record<string, SiteSettings>; // Per-site overrides
    blacklist: string[]; // Sites to never dim
    whitelist: string[]; // Sites to always dim (bypass threshold check)
}

/**
 * Per-site settings override
 */
export interface SiteSettings {
    enabled?: boolean;
    dimIntensity?: number;
}

/**
 * Saved state for a site
 */
export interface SiteState {
    lastDimLevel: number;
    lastBrightness: number | null;
    timestamp: number;
}

/**
 * Status response from content script
 */
export interface StatusResponse {
    currentDimLevel: number;
    targetDimLevel: number;
    lastBrightness: number | null;
    hostname: string;
    isBlacklisted: boolean;
    isWhitelisted: boolean;
}

/**
 * Message types for communication between scripts
 */
export type Message =
    | { type: "settingsUpdated" }
    | { type: "getStatus" }
    | { type: "manualDim"; level: number }
    | { type: "getSettings" }
    | { type: "saveSettings"; settings: Settings }
    | { type: "getTabStatus" }
    | { type: "setManualDim"; level: number };

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: Settings = {
    enabled: true,
    dimIntensity: 0.3,
    brightnessThreshold: 0.6,
    dynamicMode: true,
    smoothing: true,
    smoothingDuration: 500,
    siteSettings: {},
    blacklist: [],
    whitelist: [],
};
