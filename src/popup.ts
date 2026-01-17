/**
 * Auto Dimmer - Popup Script
 *
 * Handles the settings popup UI, allowing users to configure dimming behavior, manage
 * per-site settings, and control whitelist/blacklist.
 */

import type { Settings, StatusResponse } from "./types";
import { DEFAULT_SETTINGS } from "./types";

let settings: Settings = { ...DEFAULT_SETTINGS };
let currentHostname = "";

// DOM Elements
const enabledToggle = document.getElementById("enabled") as HTMLInputElement;
const currentSiteEl = document.getElementById("currentSite") as HTMLSpanElement;
const pageBrightnessEl = document.getElementById("pageBrightness") as HTMLSpanElement;
const currentDimEl = document.getElementById("currentDim") as HTMLSpanElement;

const dimIntensitySlider = document.getElementById("dimIntensity") as HTMLInputElement;
const dimIntensityValue = document.getElementById("dimIntensityValue") as HTMLSpanElement;
const brightnessThresholdSlider = document.getElementById(
    "brightnessThreshold"
) as HTMLInputElement;
const brightnessThresholdValue = document.getElementById(
    "brightnessThresholdValue"
) as HTMLSpanElement;
const dynamicModeToggle = document.getElementById("dynamicMode") as HTMLInputElement;
const smoothingToggle = document.getElementById("smoothing") as HTMLInputElement;
const smoothingDurationSlider = document.getElementById("smoothingDuration") as HTMLInputElement;
const smoothingDurationValue = document.getElementById("smoothingDurationValue") as HTMLSpanElement;
const smoothingDurationSetting = document.getElementById("smoothingDurationSetting") as HTMLElement;

// Site-specific settings
const siteEnabledToggle = document.getElementById("siteEnabled") as HTMLInputElement;
const siteDimIntensitySlider = document.getElementById("siteDimIntensity") as HTMLInputElement;
const siteDimIntensityValue = document.getElementById("siteDimIntensityValue") as HTMLSpanElement;
const clearSiteSettingsBtn = document.getElementById("clearSiteSettings") as HTMLButtonElement;

// Whitelist/Blacklist
const blacklistItems = document.getElementById("blacklistItems") as HTMLDivElement;
const whitelistItems = document.getElementById("whitelistItems") as HTMLDivElement;
const blacklistInput = document.getElementById("blacklistInput") as HTMLInputElement;
const whitelistInput = document.getElementById("whitelistInput") as HTMLInputElement;
const addBlacklistBtn = document.getElementById("addBlacklist") as HTMLButtonElement;
const addWhitelistBtn = document.getElementById("addWhitelist") as HTMLButtonElement;
const blacklistCurrentSiteBtn = document.getElementById(
    "blacklistCurrentSite"
) as HTMLButtonElement;
const whitelistCurrentSiteBtn = document.getElementById(
    "whitelistCurrentSite"
) as HTMLButtonElement;

// Manual control
const manualDimSlider = document.getElementById("manualDim") as HTMLInputElement;
const manualDimValue = document.getElementById("manualDimValue") as HTMLSpanElement;
const resetManualBtn = document.getElementById("resetManual") as HTMLButtonElement;

// Tabs
const tabButtons = document.querySelectorAll(".tab-btn") as NodeListOf<HTMLButtonElement>;
const globalTab = document.getElementById("globalTab") as HTMLDivElement;
const siteTab = document.getElementById("siteTab") as HTMLDivElement;

/**
 * Load settings from background script
 */
async function loadSettings(): Promise<void> {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "getSettings" }, (response: Settings) => {
            settings = response || DEFAULT_SETTINGS;
            resolve();
        });
    });
}

/**
 * Save settings to background script
 */
async function saveSettings(): Promise<void> {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "saveSettings", settings }, () => {
            resolve();
        });
    });
}

/**
 * Get status from current tab's content script
 */
async function getTabStatus(): Promise<StatusResponse | null> {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "getTabStatus" }, (response: StatusResponse | null) => {
            resolve(response);
        });
    });
}

/**
 * Update UI to reflect current settings
 */
function updateUI(): void {
    enabledToggle.checked = settings.enabled;

    dimIntensitySlider.value = String(settings.dimIntensity * 100);
    dimIntensityValue.textContent = `${Math.round(settings.dimIntensity * 100)}%`;

    brightnessThresholdSlider.value = String(settings.brightnessThreshold * 100);
    brightnessThresholdValue.textContent = `${Math.round(settings.brightnessThreshold * 100)}%`;

    dynamicModeToggle.checked = settings.dynamicMode;
    smoothingToggle.checked = settings.smoothing;

    smoothingDurationSlider.value = String(settings.smoothingDuration);
    smoothingDurationValue.textContent = `${settings.smoothingDuration}ms`;
    smoothingDurationSetting.style.display = settings.smoothing ? "block" : "none";

    // Site-specific settings
    const siteSettings = settings.siteSettings[currentHostname];
    if (siteSettings) {
        siteEnabledToggle.checked = siteSettings.enabled ?? settings.enabled;
        siteDimIntensitySlider.value = String(
            (siteSettings.dimIntensity ?? settings.dimIntensity) * 100
        );
        siteDimIntensityValue.textContent = `${Math.round((siteSettings.dimIntensity ?? settings.dimIntensity) * 100)}%`;
    } else {
        siteEnabledToggle.checked = settings.enabled;
        siteDimIntensitySlider.value = String(settings.dimIntensity * 100);
        siteDimIntensityValue.textContent = `${Math.round(settings.dimIntensity * 100)}%`;
    }

    // Render lists
    renderList(blacklistItems, settings.blacklist, "blacklist");
    renderList(whitelistItems, settings.whitelist, "whitelist");
}

/**
 * Render a whitelist or blacklist
 */
function renderList(container: HTMLDivElement, items: string[], listType: string): void {
    container.innerHTML = "";
    items.forEach((item, index) => {
        const itemEl = document.createElement("div");
        itemEl.className = "list-item";

        const textEl = document.createElement("span");
        textEl.textContent = item;

        const removeBtn = document.createElement("button");
        removeBtn.className = "btn btn-small btn-danger";
        removeBtn.textContent = "×";
        removeBtn.addEventListener("click", () => {
            if (listType === "blacklist") {
                settings.blacklist.splice(index, 1);
            } else {
                settings.whitelist.splice(index, 1);
            }
            saveSettings();
            updateUI();
        });

        itemEl.appendChild(textEl);
        itemEl.appendChild(removeBtn);
        container.appendChild(itemEl);
    });

    if (items.length === 0) {
        container.innerHTML = '<p class="hint">No items</p>';
    }
}

/**
 * Update status display
 */
async function updateStatus(): Promise<void> {
    const status = await getTabStatus();

    if (status && !("error" in status)) {
        currentHostname = status.hostname;
        currentSiteEl.textContent = status.hostname || "-";
        pageBrightnessEl.textContent =
            status.lastBrightness !== null ? `${Math.round(status.lastBrightness * 100)}%` : "-";
        currentDimEl.textContent = `${Math.round(status.currentDimLevel * 100)}%`;

        // Update manual dim slider to match current level
        manualDimSlider.value = String(status.currentDimLevel * 100);
        manualDimValue.textContent = `${Math.round(status.currentDimLevel * 100)}%`;
    } else {
        currentSiteEl.textContent = "-";
        pageBrightnessEl.textContent = "-";
        currentDimEl.textContent = "-";
    }
}

// Event listeners for global settings
enabledToggle.addEventListener("change", () => {
    settings.enabled = enabledToggle.checked;
    saveSettings();
});

dimIntensitySlider.addEventListener("input", () => {
    settings.dimIntensity = parseInt(dimIntensitySlider.value, 10) / 100;
    dimIntensityValue.textContent = `${dimIntensitySlider.value}%`;
    saveSettings();
});

brightnessThresholdSlider.addEventListener("input", () => {
    settings.brightnessThreshold = parseInt(brightnessThresholdSlider.value, 10) / 100;
    brightnessThresholdValue.textContent = `${brightnessThresholdSlider.value}%`;
    saveSettings();
});

dynamicModeToggle.addEventListener("change", () => {
    settings.dynamicMode = dynamicModeToggle.checked;
    saveSettings();
});

smoothingToggle.addEventListener("change", () => {
    settings.smoothing = smoothingToggle.checked;
    smoothingDurationSetting.style.display = settings.smoothing ? "block" : "none";
    saveSettings();
});

smoothingDurationSlider.addEventListener("input", () => {
    settings.smoothingDuration = parseInt(smoothingDurationSlider.value, 10);
    smoothingDurationValue.textContent = `${smoothingDurationSlider.value}ms`;
    saveSettings();
});

// Event listeners for site-specific settings
siteEnabledToggle.addEventListener("change", () => {
    if (!settings.siteSettings[currentHostname]) {
        settings.siteSettings[currentHostname] = {};
    }
    settings.siteSettings[currentHostname].enabled = siteEnabledToggle.checked;
    saveSettings();
});

siteDimIntensitySlider.addEventListener("input", () => {
    if (!settings.siteSettings[currentHostname]) {
        settings.siteSettings[currentHostname] = {};
    }
    settings.siteSettings[currentHostname].dimIntensity =
        parseInt(siteDimIntensitySlider.value, 10) / 100;
    siteDimIntensityValue.textContent = `${siteDimIntensitySlider.value}%`;
    saveSettings();
});

clearSiteSettingsBtn.addEventListener("click", () => {
    delete settings.siteSettings[currentHostname];
    saveSettings();
    updateUI();
});

// Tab switching
tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
        tabButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const tabName = btn.dataset.tab;
        globalTab.classList.toggle("active", tabName === "global");
        siteTab.classList.toggle("active", tabName === "site");
    });
});

// Whitelist/Blacklist management
addBlacklistBtn.addEventListener("click", () => {
    const value = blacklistInput.value.trim();
    if (value && !settings.blacklist.includes(value)) {
        settings.blacklist.push(value);
        blacklistInput.value = "";
        saveSettings();
        updateUI();
    }
});

addWhitelistBtn.addEventListener("click", () => {
    const value = whitelistInput.value.trim();
    if (value && !settings.whitelist.includes(value)) {
        settings.whitelist.push(value);
        whitelistInput.value = "";
        saveSettings();
        updateUI();
    }
});

blacklistCurrentSiteBtn.addEventListener("click", () => {
    if (currentHostname && !settings.blacklist.includes(currentHostname)) {
        settings.blacklist.push(currentHostname);
        saveSettings();
        updateUI();
    }
});

whitelistCurrentSiteBtn.addEventListener("click", () => {
    if (currentHostname && !settings.whitelist.includes(currentHostname)) {
        settings.whitelist.push(currentHostname);
        saveSettings();
        updateUI();
    }
});

// Manual control
manualDimSlider.addEventListener("input", () => {
    const level = parseInt(manualDimSlider.value, 10) / 100;
    manualDimValue.textContent = `${manualDimSlider.value}%`;
    chrome.runtime.sendMessage({ type: "setManualDim", level });
});

resetManualBtn.addEventListener("click", () => {
    // Re-save settings to trigger a recalculation in the content script
    saveSettings().then(() => {
        setTimeout(updateStatus, 500);
    });
});

// Initialize
async function init(): Promise<void> {
    await loadSettings();
    await updateStatus();
    updateUI();

    // Periodically update status
    setInterval(updateStatus, 2000);
}

init();
