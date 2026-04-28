import { expect, test } from "@playwright/test";

/**
 * Android launch smoke — web-preview edition.
 *
 * Why web preview instead of a real emulator:
 *   Playwright's `androidDevice` fixture requires a running Android emulator or
 *   physical device connected via ADB, which is unavailable in standard CI
 *   runners. The Capacitor web bundle is identical to what runs inside the
 *   Android WebView, so exercising it in a mobile-viewport Chromium session
 *   catches all JS/layout regressions at a fraction of the CI cost. Real-device
 *   verification is tracked in the manual QA checklist in docs/DEPLOYMENT.md.
 *
 * What this test covers:
 *   - The built web bundle boots without unhandled JS errors in a portrait
 *     mobile viewport (375 × 812 — Pixel 7 profile via the "mobile-portrait"
 *     Playwright project).
 *   - MainMenu renders within 10 s.
 *   - The viewport is portrait (height > width), matching the Android
 *     orientation-lock set in AndroidManifest.xml.
 *
 * What this test does NOT cover:
 *   - Capacitor native plugin init (haptics, screen-orientation, splash, SQLite).
 *   - Touch latency / real GPU rendering path inside Android WebView.
 *   - App lifecycle events (background → foreground) on a real device.
 *   See docs/DEPLOYMENT.md §"Android QA checklist" for manual verification steps.
 */

test.describe("Android launch smoke", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Chromium-only smoke");

  test("boots to MainMenu in mobile viewport without JS errors", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "mobile-portrait",
      "android-launch runs on the mobile-portrait project only",
    );

    const jsErrors: string[] = [];
    page.on("pageerror", (err) => jsErrors.push(err.message));

    // Suppress opening interstitial before first navigation so it's set
    // before any UI renders — same pattern as tutorial-clear.spec.ts.
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("cv:opening-shown", "1");
      } catch {
        // ignore — storage may be blocked in certain sandbox modes
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // MainMenu must be visible. The data-testid="main-menu" is the phase-root
    // container for the main menu screen. We use first() to avoid strict-mode
    // failures if child elements with related testids are also in the DOM.
    const mainMenu = page.locator('[data-testid="main-menu"]').first();
    await expect(mainMenu).toBeVisible({ timeout: 10_000 });

    // No unhandled JS errors. ResizeObserver loop errors are benign browser
    // noise and do not indicate a real app failure.
    const realErrors = jsErrors.filter((e) => !e.includes("ResizeObserver"));
    expect(realErrors, `Unexpected JS errors: ${realErrors.join("; ")}`).toHaveLength(0);
  });

  test("viewport is portrait on mobile-portrait project", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "mobile-portrait",
      "portrait-check runs on the mobile-portrait project only",
    );

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    expect(viewport!.height, "height should exceed width (portrait)").toBeGreaterThan(
      viewport!.width,
    );
  });
});
