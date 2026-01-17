/**
 * Overlay management utilities
 *
 * Functions for creating, managing, and removing the dimming overlay element.
 */

let overlayElement: HTMLDivElement | null = null;

/**
 * Create or retrieve the dimming overlay element.
 * The overlay is a full-screen black div with adjustable opacity.
 */
export function getOverlay(overlayId: string): HTMLDivElement {
    // Return cached element if still in DOM
    if (overlayElement && document.documentElement.contains(overlayElement)) {
        return overlayElement;
    }

    // Check if overlay already exists
    overlayElement = document.getElementById(overlayId) as HTMLDivElement | null;

    if (!overlayElement) {
        overlayElement = document.createElement("div");
        overlayElement.id = overlayId;
        overlayElement.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background-color: black !important;
            pointer-events: none !important;
            z-index: 2147483647 !important;
            opacity: 0 !important;
            transition: none !important;
        `;
        document.documentElement.appendChild(overlayElement);
    }

    return overlayElement;
}

/**
 * Remove the dimming overlay from the DOM.
 */
export function removeOverlay(overlayId: string): void {
    if (overlayElement) {
        overlayElement.remove();
        overlayElement = null;
    }

    // Also remove any orphaned overlay
    const existing = document.getElementById(overlayId);
    if (existing) {
        existing.remove();
    }
}

/**
 * Apply a dim level to the overlay.
 * Value is clamped to 0-1 range.
 */
export function applyDimLevel(overlayId: string, level: number): void {
    const overlay = getOverlay(overlayId);
    const clampedLevel = clamp(level, 0, 1);
    overlay.style.opacity = clampedLevel.toString();
}

/**
 * Clamp a number between min and max values.
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}
