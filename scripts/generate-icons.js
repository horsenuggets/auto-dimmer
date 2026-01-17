/**
 * Icon Generator Script
 *
 * Downloads Material Symbols floor_lamp icon PNGs from Google's CDN.
 * Run with: node scripts/generate-icons.js
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const iconsDir = join(rootDir, "icons");

// Chrome extension icon sizes
const sizes = [16, 48, 128];

// Material Symbols icon settings
const ICON_NAME = "floor_lamp";
const ICON_COLOR = "e3e3e3"; // Light gray

async function downloadIcon(size) {
    // Google Fonts doesn't serve PNGs directly at arbitrary sizes
    // We'll try different approaches

    // For sizes <= 48, use the optical size versions
    const opticalSize = size <= 20 ? 20 : size <= 24 ? 24 : size <= 40 ? 40 : 48;

    const url = `https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/${ICON_NAME}/default/${opticalSize}px.svg`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status}`);
        }

        let svg = await response.text();

        // Add fill color
        svg = svg.replace("<svg ", `<svg fill="#${ICON_COLOR}" `);

        // Update dimensions
        svg = svg.replace(/width="\d+"/, `width="${size}"`);
        svg = svg.replace(/height="\d+"/, `height="${size}"`);

        return svg;
    } catch (error) {
        console.error(`Failed to download ${size}px icon:`, error.message);
        return null;
    }
}

async function generateIcons() {
    console.log("Downloading Material Symbols floor_lamp icons...\n");

    // Try to use sharp for SVG to PNG conversion
    let sharp = null;
    try {
        sharp = (await import("sharp")).default;
    } catch {
        console.log("sharp not installed. Saving as SVG files instead.");
        console.log("Install sharp with: npm install sharp");
        console.log("Then run this script again for PNG output.\n");
    }

    for (const size of sizes) {
        const svg = await downloadIcon(size);

        if (!svg) {
            console.log(`Skipping ${size}px icon (download failed)`);
            continue;
        }

        if (sharp) {
            // Convert SVG to PNG
            const pngPath = join(iconsDir, `icon${size}.png`);
            await sharp(Buffer.from(svg))
                .resize(size, size)
                .png()
                .toFile(pngPath);
            console.log(`Generated ${pngPath}`);
        } else {
            // Save as SVG if sharp is not available
            const svgPath = join(iconsDir, `icon${size}.svg`);
            writeFileSync(svgPath, svg);
            console.log(`Saved ${svgPath} (install sharp to convert to PNG)`);
        }
    }

    console.log("\nDone!");
}

generateIcons();
