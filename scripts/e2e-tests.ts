/**
 * E2E Tests
 *
 * Puppeteer-based end-to-end tests that verify the extension works
 * in a real Chrome browser environment.
 */

import puppeteer, { Browser } from "puppeteer";
import * as path from "path";
import * as fs from "fs";
import * as http from "http";

// ANSI color codes
const ANSI = {
    reset: "\x1b[0m",
    brightGreen: "\x1b[92m",
    brightRed: "\x1b[91m",
    brightYellow: "\x1b[93m",
};

const INDENT = "   ";

interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>): Promise<void> {
    try {
        await fn();
        results.push({ name, passed: true });
        console.log(`${ANSI.brightGreen}${INDENT}[+] ${name}${ANSI.reset}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ name, passed: false, error: errorMessage });
        console.log(`${ANSI.brightRed}${INDENT}[-] ${name}${ANSI.reset}`);
        console.log(`${ANSI.brightRed}${INDENT}${INDENT}${errorMessage}${ANSI.reset}`);
    }
}

function assert(condition: boolean, message: string): void {
    if (!condition) {
        throw new Error(message);
    }
}

// Simple HTTP server for test pages
function createTestServer(port: number): Promise<http.Server> {
    return new Promise((resolve) => {
        const server = http.createServer((req, res) => {
            res.setHeader("Content-Type", "text/html");

            if (req.url === "/bright") {
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head><style>body { background: white; margin: 0; min-height: 100vh; }</style></head>
                    <body><h1>Bright Page</h1></body>
                    </html>
                `);
            } else if (req.url === "/dark") {
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head><style>body { background: #1a1a1a; color: white; margin: 0; min-height: 100vh; }</style></head>
                    <body><h1>Dark Page</h1></body>
                    </html>
                `);
            } else {
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head><style>body { background: #808080; margin: 0; min-height: 100vh; }</style></head>
                    <body><h1>Test Page</h1></body>
                    </html>
                `);
            }
        });

        server.listen(port, () => {
            resolve(server);
        });
    });
}

async function runE2ETests(): Promise<boolean> {
    console.log("Running E2E tests with Puppeteer...\n");

    // Get extension path (root directory contains manifest.json)
    const extensionPath = path.resolve(process.cwd());

    // Check if extension is built
    if (!fs.existsSync(path.join(extensionPath, "dist", "content.js"))) {
        console.log(`${ANSI.brightYellow}Extension not built. Building...${ANSI.reset}`);
        const { execSync } = await import("child_process");
        execSync("npm run build", { stdio: "inherit" });
    }

    // Start test server
    const PORT = 8765;
    const server = await createTestServer(PORT);
    console.log(`Test server running on port ${PORT}`);

    let browser: Browser | null = null;

    try {
        // Launch browser with extension
        browser = await puppeteer.launch({
            headless: false, // Extensions require non-headless mode
            args: [
                `--disable-extensions-except=${extensionPath}`,
                `--load-extension=${extensionPath}`,
                "--no-sandbox",
                "--disable-setuid-sandbox",
            ],
        });

        // Wait for extension to load
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log("\nExtension loading tests");

        await test("should load extension without errors", async () => {
            const pages = await browser!.pages();
            assert(pages.length > 0, "Browser should have at least one page");
        });

        await test("should have extension loaded", async () => {
            const targets = browser!.targets();
            const extensionTarget = targets.find(
                (t) => t.type() === "service_worker" && t.url().includes("chrome-extension://")
            );
            assert(extensionTarget !== undefined, "Extension service worker should be running");
        });

        // Create a test page
        const page = await browser.newPage();

        console.log("\nBright page dimming tests");

        await test("should inject overlay on bright page", async () => {
            await page.goto(`http://localhost:${PORT}/bright`, { waitUntil: "networkidle0" });

            // Wait for extension to process
            await new Promise((resolve) => setTimeout(resolve, 3000));

            // Check for overlay
            const overlay = await page.$("#auto-dimmer-overlay");
            assert(overlay !== null, "Overlay element should exist");
        });

        await test("should have overlay with opacity > 0 on bright page", async () => {
            const opacity = await page.$eval("#auto-dimmer-overlay", (el) =>
                parseFloat(window.getComputedStyle(el).opacity)
            );
            assert(opacity > 0, `Overlay should have opacity > 0, got ${opacity}`);
        });

        await test("should have overlay with valid opacity (0-1)", async () => {
            const opacity = await page.$eval("#auto-dimmer-overlay", (el) =>
                parseFloat(window.getComputedStyle(el).opacity)
            );
            assert(opacity >= 0 && opacity <= 1, `Opacity should be 0-1, got ${opacity}`);
        });

        await test("should have overlay covering full viewport", async () => {
            const dimensions = await page.$eval("#auto-dimmer-overlay", (el) => {
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                return {
                    width: rect.width,
                    height: rect.height,
                    viewportWidth: window.innerWidth,
                    viewportHeight: window.innerHeight,
                    position: style.position,
                };
            });
            assert(dimensions.position === "fixed", "Overlay should be fixed position");
            assert(
                dimensions.width >= dimensions.viewportWidth,
                `Width should cover viewport, got ${dimensions.width} vs ${dimensions.viewportWidth}`
            );
            assert(
                dimensions.height >= dimensions.viewportHeight,
                `Height should cover viewport, got ${dimensions.height} vs ${dimensions.viewportHeight}`
            );
        });

        await test("should have overlay with pointer-events none", async () => {
            const pointerEvents = await page.$eval(
                "#auto-dimmer-overlay",
                (el) => window.getComputedStyle(el).pointerEvents
            );
            assert(pointerEvents === "none", "Overlay should not block clicks");
        });

        console.log("\nDark page tests");

        await test("should have low opacity on dark page", async () => {
            await page.goto(`http://localhost:${PORT}/dark`, { waitUntil: "networkidle0" });

            // Wait for extension to process
            await new Promise((resolve) => setTimeout(resolve, 3500));

            // Overlay might have 0 opacity or not exist - both are valid for dark pages
            const overlay = await page.$("#auto-dimmer-overlay");
            let opacity = 0;
            if (overlay) {
                opacity = await page.$eval("#auto-dimmer-overlay", (el) =>
                    parseFloat(window.getComputedStyle(el).opacity)
                );
            }

            // Dark pages should have very low or zero opacity
            assert(opacity < 0.15, `Dark page should have opacity < 0.15, got ${opacity}`);
        });

        console.log("\nPage transition tests");

        await test("should have different opacity for dark vs bright pages", async () => {
            // First measure dark page opacity
            await page.goto(`http://localhost:${PORT}/dark`, { waitUntil: "networkidle0" });
            await new Promise((resolve) => setTimeout(resolve, 3500));

            let darkOpacity = 0;
            const darkOverlay = await page.$("#auto-dimmer-overlay");
            if (darkOverlay) {
                darkOpacity = await page.$eval("#auto-dimmer-overlay", (el) =>
                    parseFloat(window.getComputedStyle(el).opacity)
                );
            }

            // Then measure bright page opacity (fresh navigation)
            await page.goto(`http://localhost:${PORT}/bright`, { waitUntil: "networkidle0" });
            await new Promise((resolve) => setTimeout(resolve, 3500));

            let brightOpacity = 0;
            const brightOverlay = await page.$("#auto-dimmer-overlay");
            if (brightOverlay) {
                brightOpacity = await page.$eval("#auto-dimmer-overlay", (el) =>
                    parseFloat(window.getComputedStyle(el).opacity)
                );
            }

            // Bright pages should trigger higher dimming than dark pages
            assert(
                brightOpacity > darkOpacity,
                `Bright page should have higher opacity. Dark: ${darkOpacity}, Bright: ${brightOpacity}`
            );
        });

        console.log("\nStability tests");

        await test("should maintain stable opacity over time (no flickering)", async () => {
            await page.goto(`http://localhost:${PORT}/bright`, { waitUntil: "networkidle0" });
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Sample opacity multiple times over 5 seconds
            const samples: number[] = [];
            for (let i = 0; i < 5; i++) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                const opacity = await page.$eval("#auto-dimmer-overlay", (el) =>
                    parseFloat(window.getComputedStyle(el).opacity)
                );
                samples.push(opacity);
            }

            // Calculate variance - should be very low if stable
            const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
            const variance =
                samples.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / samples.length;

            assert(
                variance < 0.01,
                `Opacity should be stable. Samples: [${samples.map((s) => s.toFixed(3)).join(", ")}], Variance: ${variance.toFixed(4)}`
            );
        });

        console.log("\nPopup settings tests");

        await test("should find extension popup", async () => {
            // Get extension ID from service worker URL
            const targets = browser!.targets();
            const extensionTarget = targets.find(
                (t) => t.type() === "service_worker" && t.url().includes("chrome-extension://")
            );
            assert(extensionTarget !== undefined, "Extension should be loaded");

            const extensionUrl = extensionTarget!.url();
            const extensionId = extensionUrl.split("/")[2];

            // Open popup page directly
            const popupPage = await browser!.newPage();
            await popupPage.goto(`chrome-extension://${extensionId}/popup/popup.html`, {
                waitUntil: "networkidle0",
            });
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Check popup loaded
            const enabledToggle = await popupPage.$("#enabled");
            assert(enabledToggle !== null, "Enabled toggle should exist in popup");

            await popupPage.close();
        });

        await test("should update dim when slider is changed via popup", async () => {
            // Navigate to bright page
            await page.goto(`http://localhost:${PORT}/bright`, { waitUntil: "networkidle0" });
            await new Promise((resolve) => setTimeout(resolve, 2000));

            const initialOpacity = await page.$eval("#auto-dimmer-overlay", (el) =>
                parseFloat(window.getComputedStyle(el).opacity)
            );

            // Get extension ID
            const targets = browser!.targets();
            const extensionTarget = targets.find(
                (t) => t.type() === "service_worker" && t.url().includes("chrome-extension://")
            );
            const extensionUrl = extensionTarget!.url();
            const extensionId = extensionUrl.split("/")[2];

            // Open popup and change intensity slider
            const popupPage = await browser!.newPage();
            await popupPage.goto(`chrome-extension://${extensionId}/popup/popup.html`, {
                waitUntil: "networkidle0",
            });
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Set dim intensity to max (100%)
            await popupPage.evaluate(() => {
                const slider = document.getElementById("dimIntensity") as HTMLInputElement;
                slider.value = "100";
                slider.dispatchEvent(new Event("input", { bubbles: true }));
            });

            await new Promise((resolve) => setTimeout(resolve, 2000));
            await popupPage.close();

            // Check if page dimming changed
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const newOpacity = await page.$eval("#auto-dimmer-overlay", (el) =>
                parseFloat(window.getComputedStyle(el).opacity)
            );

            assert(
                newOpacity > initialOpacity,
                `Opacity should increase after slider change. Before: ${initialOpacity}, After: ${newOpacity}`
            );
        });

        await page.close();
    } catch (error) {
        console.error(`${ANSI.brightRed}Fatal error: ${error}${ANSI.reset}`);
    } finally {
        if (browser) {
            await browser.close();
        }
        server.close();
    }

    // Print summary
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    console.log();
    console.log(
        `${ANSI.brightGreen}${passed} passed${ANSI.reset}, ${ANSI.brightRed}${failed} failed${ANSI.reset}.`
    );

    return failed === 0;
}

// Run tests
runE2ETests().then((success) => {
    process.exit(success ? 0 : 1);
});
