/**
 * Brightness detection utilities
 *
 * Functions for sampling and calculating page brightness from visible elements.
 */

/**
 * Parse an RGB/RGBA color string and return perceived brightness (0-1).
 * Uses the luminance formula weighted for human perception.
 */
export function getColorBrightness(colorStr: string): number | null {
    if (!colorStr || colorStr === "transparent" || colorStr === "rgba(0, 0, 0, 0)") {
        return null;
    }

    const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
    if (rgbMatch) {
        const r = parseInt(rgbMatch[1], 10) / 255;
        const g = parseInt(rgbMatch[2], 10) / 255;
        const b = parseInt(rgbMatch[3], 10) / 255;

        // Luminance formula - human eyes are more sensitive to green, less to blue
        return 0.299 * r + 0.587 * g + 0.114 * b;
    }

    return null;
}

/**
 * Sample page brightness by analyzing background colors of visible elements.
 * Returns average brightness from 0 (dark) to 1 (bright).
 */
export function samplePageBrightness(overlayId: string): number {
    // Use a smaller grid (10x10 = 100 points) for better performance and stability
    const sampleSize = 10;
    let totalBrightness = 0;
    let sampleCount = 0;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Sample points across the viewport in a grid
    for (let x = 0; x < sampleSize; x++) {
        for (let y = 0; y < sampleSize; y++) {
            // Offset by half a cell to avoid edges
            const sampleX = ((x + 0.5) / sampleSize) * viewportWidth;
            const sampleY = ((y + 0.5) / sampleSize) * viewportHeight;

            // Get element at this point, ignoring our overlay
            const elementsAtPoint = document.elementsFromPoint(sampleX, sampleY);
            const element = elementsAtPoint.find((el) => el.id !== overlayId);

            if (element) {
                const style = window.getComputedStyle(element);
                const bgBrightness = getColorBrightness(style.backgroundColor);
                if (bgBrightness !== null) {
                    totalBrightness += bgBrightness;
                    sampleCount++;
                }
            }
        }
    }

    // Sample body and html backgrounds with higher weight (50% of total weight)
    const baseWeight = Math.max(sampleCount, 1);

    if (document.body) {
        const bodyStyle = window.getComputedStyle(document.body);
        const bodyBg = getColorBrightness(bodyStyle.backgroundColor);
        if (bodyBg !== null) {
            totalBrightness += bodyBg * baseWeight * 0.5;
            sampleCount += baseWeight * 0.5;
        }
    }

    const htmlStyle = window.getComputedStyle(document.documentElement);
    const htmlBg = getColorBrightness(htmlStyle.backgroundColor);
    if (htmlBg !== null) {
        totalBrightness += htmlBg * baseWeight * 0.5;
        sampleCount += baseWeight * 0.5;
    }

    return sampleCount > 0 ? totalBrightness / sampleCount : 0.5;
}

/**
 * Calculate the dim amount based on current brightness and settings.
 * Returns a value from 0 (no dim) to maxIntensity (full dim).
 */
export function calculateDimAmount(
    brightness: number,
    threshold: number,
    maxIntensity: number,
    dynamicMode: boolean
): number {
    if (brightness <= threshold) {
        return 0;
    }

    if (!dynamicMode) {
        return maxIntensity;
    }

    // Scale dim amount based on how bright the page is above threshold
    const brightnessOverThreshold = brightness - threshold;
    const maxOverThreshold = 1 - threshold;
    const scaleFactor = maxOverThreshold > 0 ? brightnessOverThreshold / maxOverThreshold : 1;

    return maxIntensity * scaleFactor;
}
