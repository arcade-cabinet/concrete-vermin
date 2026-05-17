import { expect, test } from "@playwright/test";

/**
 * Mobile viewport smoke: 375×812 (iPhone SE / small phone).
 * Asserts MainMenu renders, Play leads to MissionSelect, and there is
 * no horizontal overflow (no side-scroll).
 */

test.describe("mobile viewport", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.skip(({ browserName }) => browserName !== "chromium", "Chromium-only");

  test("MainMenu → MissionSelect — no horizontal overflow", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-portrait", "mobile-portrait project only");

    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("cv:opening-shown", "1");
      } catch {
        // ignore
      }
    });

    await page.goto("/");
    const mainMenu = page.getByTestId("main-menu");
    await expect(mainMenu).toBeVisible({ timeout: 20_000 });

    // No horizontal overflow on main menu.
    const overflowMain = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflowMain).toBe(false);

    // Navigate into the game.
    const start = page.getByTestId("main-menu-start");
    await expect(start).toBeVisible({ timeout: 10_000 });
    await start.click();

    // Briefing → Begin
    const begin = page.getByRole("button", { name: /^▸ begin$|^begin$/i });
    await expect(begin).toBeVisible({ timeout: 15_000 });
    await begin.click();

    // MissionSelect visible on mobile.
    const missionSelect = page.locator('[data-phase-root="mission-select"]');
    await expect(missionSelect).toBeVisible({ timeout: 15_000 });

    // No horizontal overflow on mission select.
    const overflowMs = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflowMs).toBe(false);
  });
});
