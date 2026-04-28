import { expect, test } from "@playwright/test";

/**
 * Full player journey: MainMenu → MissionSelect → Briefing → Mission
 * (tutorial) → Result. Validates HUD presence and the complete flow.
 *
 * Notes:
 * - Runs on desktop project only (same reasoning as tutorial-clear).
 * - PawnShop is only reachable from MainMenu Market modal, not pre-mission
 *   on a fresh run; the flow goes Briefing → MissionSelect → DEPLOY.
 * - Generous timeouts (20-30 s) for Pixi canvas boot on slow CI runners.
 */

test.describe("full player journey", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Chromium-only smoke");

  test("MainMenu → MissionSelect → Briefing → Mission → MissionResult", async (
    { page },
    testInfo,
  ) => {
    test.skip(
      testInfo.project.name !== "desktop",
      "full-journey runs on the desktop project only",
    );

    // Suppress opening interstitial before first navigation.
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("cv:opening-shown", "1");
      } catch {
        // ignore
      }
    });

    // --- MainMenu ---
    await page.goto("/");
    const mainMenu = page.getByTestId("main-menu");
    await expect(mainMenu).toBeVisible({ timeout: 20_000 });

    const start = page.getByTestId("main-menu-start");
    await expect(start).toBeVisible({ timeout: 15_000 });
    await start.click();

    // --- Briefing (fresh run skips MissionSelect first) ---
    const briefing = page.locator('[data-phase-root="briefing"]');
    await expect(briefing).toBeVisible({ timeout: 15_000 });
    const begin = page.getByRole("button", { name: /^▸ begin$|^begin$/i });
    await expect(begin).toBeVisible({ timeout: 15_000 });
    await begin.click();

    // --- MissionSelect ---
    const missionSelect = page.locator('[data-phase-root="mission-select"]');
    await expect(missionSelect).toBeVisible({ timeout: 15_000 });

    // Confirm first mission tile is present (tutorial/mission-01).
    const firstTile = missionSelect.getByRole("button", { name: /deploy/i });
    await expect(firstTile).toBeVisible({ timeout: 10_000 });
    await firstTile.click();

    // --- Mission (playing) ---
    await page.waitForFunction(
      () => document.querySelector('[data-testid="game-stage"]') !== null,
      null,
      { timeout: 20_000 },
    );
    const stage = page.getByTestId("game-stage");
    await expect(stage).toBeVisible({ timeout: 20_000 });

    // Verify HUD elements are present during the mission.
    const kills = page.getByTestId("arcade-kills");
    await expect(kills).toBeVisible({ timeout: 15_000 });

    // Fire enough times to clear the tutorial mission.
    const box = await stage.boundingBox();
    if (!box) throw new Error("stage has no bounding box");

    const cleared = page.getByRole("heading", { name: /^cleared$/i });
    const MAX_CLICKS = 250;
    for (let i = 0; i < MAX_CLICKS; i++) {
      if (await cleared.isVisible()) break;
      const x = box.x + box.width * (0.15 + (i % 8) * 0.1);
      const y = box.y + box.height * 0.78;
      await page.mouse.click(x, y);
      await page.waitForTimeout(90);
    }

    // --- MissionResult ---
    await expect(cleared).toBeVisible({ timeout: 20_000 });
    const result = page.getByTestId("mission-result");
    await expect(result).toBeVisible({ timeout: 10_000 });

    // Return to MainMenu via the result CTA.
    const back = page.getByRole("button", { name: /menu|main|back/i });
    if (await back.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await back.click();
      await expect(page.getByTestId("main-menu")).toBeVisible({ timeout: 15_000 });
    }
  });
});
