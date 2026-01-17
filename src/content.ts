/**
 * Auto Dimmer - Content Script
 *
 * Detects page brightness and applies a dimming overlay. Injected into all pages.
 */

import type { Settings, StatusResponse } from "./types";
import { DEFAULT_SETTINGS } from "./types";
import {
    createAnimationState,
    animateDimLevel,
    setDimLevelImmediate,
    cancelAnimation,
    type AnimationState,
} from "./utils/animation";
import { samplePageBrightness, calculateDimAmount } from "./utils/brightness";
import { applyDimLevel, removeOverlay } from "./utils/overlay";
import { getHostname } from "./utils/patterns";
import { getEffectiveSettings, isBlacklisted, isWhitelisted } from "./utils/settings";
import { loadSettings, loadSiteState, saveSiteState, createSiteState } from "./utils/storage";

const OVERLAY_ID = "auto-dimmer-overlay";
const SAMPLE_INTERVAL = 3000; // Check every 3 seconds
const DEFAULT_TRANSITION_DURATION = 500;
const BRIGHTNESS_SMOOTHING = 0.3; // How much new readings affect the average (0-1)
const DIM_CHANGE_THRESHOLD = 0.03; // Minimum change to trigger update (3%)

let settings: Settings = { ...DEFAULT_SETTINGS };
let animationState: AnimationState = createAnimationState();
let sampleIntervalId: ReturnType<typeof setInterval> | null = null;
let lastBrightness: number | null = null;
let smoothedBrightness: number | null = null;
let lastAppliedDim: number = 0;
let isChecking = false;

/**
 * Apply the current dim level to the overlay.
 */
function applyCurrentDimLevel(level: number): void {
    applyDimLevel(OVERLAY_ID, level);
}

/**
 * Set the dim level with optional animation.
 */
function setDimLevel(level: number): void {
    const hostname = getHostname();
    const effectiveSettings = getEffectiveSettings(settings, hostname);

    if (effectiveSettings.smoothing) {
        const duration = effectiveSettings.smoothingDuration || DEFAULT_TRANSITION_DURATION;
        animateDimLevel(animationState, level, duration, applyCurrentDimLevel);
    } else {
        setDimLevelImmediate(animationState, level, applyCurrentDimLevel);
    }
}

/**
 * Main brightness check and dimming logic.
 */
function checkAndDim(): void {
    if (isChecking) {
        return;
    }
    isChecking = true;

    try {
        const hostname = getHostname();
        const effectiveSettings = getEffectiveSettings(settings, hostname);

        // Check if disabled or blacklisted
        if (!effectiveSettings.enabled || isBlacklisted(settings, hostname)) {
            if (lastAppliedDim !== 0) {
                setDimLevel(0);
                lastAppliedDim = 0;
            }
            return;
        }

        // Sample current page brightness
        const rawBrightness = samplePageBrightness(OVERLAY_ID);
        lastBrightness = rawBrightness;

        // Apply exponential smoothing to brightness
        if (smoothedBrightness === null) {
            smoothedBrightness = rawBrightness;
        } else {
            smoothedBrightness =
                BRIGHTNESS_SMOOTHING * rawBrightness +
                (1 - BRIGHTNESS_SMOOTHING) * smoothedBrightness;
        }

        // Calculate dim amount
        let dimAmount = 0;

        if (isWhitelisted(settings, hostname)) {
            dimAmount = effectiveSettings.dimIntensity;
        } else {
            dimAmount = calculateDimAmount(
                smoothedBrightness,
                effectiveSettings.brightnessThreshold,
                effectiveSettings.dimIntensity,
                effectiveSettings.dynamicMode
            );
        }

        // Only update if change is significant
        if (Math.abs(dimAmount - lastAppliedDim) >= DIM_CHANGE_THRESHOLD) {
            setDimLevel(dimAmount);
            lastAppliedDim = dimAmount;

            // Save state for this site
            const state = createSiteState(animationState.currentLevel, lastBrightness);
            saveSiteState(hostname, state);
        }
    } finally {
        isChecking = false;
    }
}

/**
 * Start the dimming system.
 */
async function start(): Promise<void> {
    settings = await loadSettings();
    const hostname = getHostname();

    // Apply saved state immediately to prevent flash
    const savedState = await loadSiteState(hostname);
    if (savedState && savedState.lastDimLevel > 0) {
        animationState.currentLevel = savedState.lastDimLevel;
        animationState.targetLevel = savedState.lastDimLevel;
        lastAppliedDim = savedState.lastDimLevel;
        applyCurrentDimLevel(savedState.lastDimLevel);
    }

    // Initial check
    checkAndDim();

    // Set up continuous monitoring if dynamic mode is enabled
    const effectiveSettings = getEffectiveSettings(settings, hostname);
    if (effectiveSettings.dynamicMode) {
        sampleIntervalId = setInterval(checkAndDim, SAMPLE_INTERVAL);
    }
}

/**
 * Stop the dimming system.
 */
function stop(): void {
    if (sampleIntervalId !== null) {
        clearInterval(sampleIntervalId);
        sampleIntervalId = null;
    }
    cancelAnimation(animationState);
    removeOverlay(OVERLAY_ID);
}

/**
 * Handle messages from popup or background script.
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "settingsUpdated") {
        loadSettings().then((newSettings) => {
            settings = newSettings;
            checkAndDim();

            // Restart interval if needed
            const hostname = getHostname();
            const effectiveSettings = getEffectiveSettings(settings, hostname);

            if (sampleIntervalId !== null) {
                clearInterval(sampleIntervalId);
                sampleIntervalId = null;
            }

            if (effectiveSettings.dynamicMode) {
                sampleIntervalId = setInterval(checkAndDim, SAMPLE_INTERVAL);
            }
        });
        sendResponse({ success: true });
    } else if (message.type === "getStatus") {
        const hostname = getHostname();
        const response: StatusResponse = {
            currentDimLevel: animationState.currentLevel,
            targetDimLevel: animationState.targetLevel,
            lastBrightness,
            hostname,
            isBlacklisted: isBlacklisted(settings, hostname),
            isWhitelisted: isWhitelisted(settings, hostname),
        };
        sendResponse(response);
    } else if (message.type === "manualDim") {
        setDimLevel(message.level);
        sendResponse({ success: true });
    }
    return true;
});

// Start when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
} else {
    start();
}

// Re-check when tab becomes visible
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        checkAndDim();
    }
});

// Re-check on scroll (debounced with longer delay)
let scrollTimeout: ReturnType<typeof setTimeout>;
window.addEventListener(
    "scroll",
    () => {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        scrollTimeout = setTimeout(checkAndDim, 500);
    },
    { passive: true }
);

// Clean up on page unload
window.addEventListener("beforeunload", stop);
