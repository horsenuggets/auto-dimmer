/**
 * Auto Dimmer - Background Service Worker
 *
 * Handles extension lifecycle and communication between popup and content scripts. Manages
 * settings storage and broadcasts updates to all tabs.
 */

import type { Settings } from "./types";
import { DEFAULT_SETTINGS } from "./types";

// Initialize settings on install
chrome.runtime.onInstalled.addListener(async () => {
    const result = await chrome.storage.sync.get(["autoDimmerSettings"]);
    if (!result.autoDimmerSettings) {
        await chrome.storage.sync.set({ autoDimmerSettings: DEFAULT_SETTINGS });
    }
});

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "getSettings") {
        chrome.storage.sync.get(["autoDimmerSettings"], (result) => {
            sendResponse((result.autoDimmerSettings as Settings) || DEFAULT_SETTINGS);
        });
        return true;
    }

    if (message.type === "saveSettings") {
        chrome.storage.sync.set({ autoDimmerSettings: message.settings }, () => {
            // Notify all tabs about settings update
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach((tab) => {
                    if (tab.id) {
                        chrome.tabs.sendMessage(tab.id, { type: "settingsUpdated" }).catch(() => {
                            // Ignore errors for tabs that don't have the content script
                        });
                    }
                });
            });
            sendResponse({ success: true });
        });
        return true;
    }

    if (message.type === "getTabStatus") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs
                    .sendMessage(tabs[0].id, { type: "getStatus" })
                    .then((response) => {
                        sendResponse(response || { error: "No response from content script" });
                    })
                    .catch(() => {
                        // Tab doesn't have content script (chrome://, extension pages, etc.)
                        sendResponse({ error: "Content script not available on this page" });
                    });
            } else {
                sendResponse({ error: "No active tab" });
            }
        });
        return true;
    }

    if (message.type === "setManualDim") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs
                    .sendMessage(tabs[0].id, { type: "manualDim", level: message.level })
                    .then((response) => {
                        sendResponse(response || { error: "No response" });
                    })
                    .catch(() => {
                        sendResponse({ error: "Content script not available" });
                    });
            } else {
                sendResponse({ error: "No active tab" });
            }
        });
        return true;
    }

    return false;
});

// Handle keyboard shortcuts (optional)
chrome.commands?.onCommand?.addListener(async (command) => {
    if (command === "toggle-dimmer") {
        const result = await chrome.storage.sync.get(["autoDimmerSettings"]);
        const settings = (result.autoDimmerSettings as Settings) || DEFAULT_SETTINGS;
        settings.enabled = !settings.enabled;
        await chrome.storage.sync.set({ autoDimmerSettings: settings });

        // Notify all tabs
        const tabs = await chrome.tabs.query({});
        tabs.forEach((tab) => {
            if (tab.id) {
                chrome.tabs.sendMessage(tab.id, { type: "settingsUpdated" }).catch(() => {});
            }
        });
    }
});
