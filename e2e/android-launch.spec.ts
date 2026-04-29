import { expect, test } from "@playwright/test";

// `androidDevice` fixture requires ADB — unavailable in CI. web-preview in
// mobile-portrait Chromium is identical to the Capacitor WebView JS path.
// Native plugin init and real-GPU path are manual QA only (docs/DEPLOYMENT.md).

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
    if (!viewport) throw new Error("viewport is null");
    expect(viewport.height, "height should exceed width (portrait)").toBeGreaterThan(
      viewport.width,
    );
  });
});
