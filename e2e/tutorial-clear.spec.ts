import { expect, test } from "@playwright/test";

/**
 * End-to-end smoke: the player can launch the game, fire enough shots
 * to clear the first mission, and see the "Cleared" overlay.
 *
 * Notes on robustness:
 * - Audio gating: the game's Begin button calls `await ensureAudio()`
 *   which Tone.js wires to a user-gesture click. Playwright's click
 *   counts as a gesture. We don't assert on audio.
 * - Shot count: the tutorial spawns 8 rats from a left-flood. We click
 *   ~30 times across the stage centre (above the rat ground line) so
 *   the shotgun's spread guarantees enough hits to drain the wave.
 * - Single fast-mode test: this lives behind the "desktop" project for
 *   CI cost; mobile/tablet projects skip it.
 */

test.describe("tutorial clear", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Chromium-only smoke");

  test("Begin → fire repeatedly → Cleared appears", async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop",
      "tutorial-clear runs on the desktop project only",
    );

    await page.goto("/");

    // Briefing screen → Begin
    const begin = page.getByRole("button", { name: /^begin$/i });
    await expect(begin).toBeVisible({ timeout: 15_000 });
    await begin.click();

    // Mission select → DEPLOY (first mission is unlocked by default)
    const deploy = page.getByRole("button", { name: /^deploy/i });
    await expect(deploy).toBeVisible({ timeout: 10_000 });
    await deploy.click();

    // Pawn shop → DEPLOY (with no mods)
    const deployFromShop = page.getByRole("button", { name: /^deploy/i });
    await expect(deployFromShop).toBeVisible({ timeout: 10_000 });
    await deployFromShop.click();

    // Game canvas
    const stage = page.getByTestId("game-stage");
    await expect(stage).toBeVisible({ timeout: 15_000 });

    // The HUD shows kill progress; wait for it to render before firing.
    const kills = page.getByTestId("hud-kills");
    await expect(kills).toBeVisible();

    // Mission-01 spawns 14 rats across two waves; shotgun has a 1.4 s
    // reload after every 6 shots. 250-click cap is headroom for slow
    // CI runners + multiple reload cycles before the loop exits early.
    const box = await stage.boundingBox();
    if (!box) throw new Error("stage has no bounding box");
    const cleared = page.getByText(/cleared/i);
    const MAX_CLICKS = 250;
    for (let i = 0; i < MAX_CLICKS; i++) {
      if (await cleared.isVisible()) break;
      const x = box.x + box.width * (0.15 + (i % 8) * 0.1);
      const y = box.y + box.height * 0.78;
      await page.mouse.click(x, y);
      await page.waitForTimeout(90);
    }

    // The mission ends with the "Cleared" verdict from MissionResult.
    await expect(cleared).toBeVisible({ timeout: 15_000 });
  });
});
