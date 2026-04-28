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

    // Fire repeatedly. Mission-01 spawns 14 rats across two waves
    // (warmup 6 + second-wave 8). The shotgun has a 1.4s reload after
    // every 6 shots, so we need to click for long enough that the runner
    // gets time to complete multiple reload cycles AND we cover the
    // second encounter's spawn delay. We cycle the click position
    // across the rat lane so straggler rats walking in either direction
    // get covered, then add a long tail of pause+click to wait through
    // reload windows.
    const box = await stage.boundingBox();
    if (!box) throw new Error("stage has no bounding box");
    const burst = 200;
    for (let i = 0; i < burst; i++) {
      const x = box.x + box.width * (0.15 + (i % 8) * 0.1);
      const y = box.y + box.height * 0.78;
      await page.mouse.click(x, y);
      await page.waitForTimeout(80);
    }
    // Final sweep — slow shots to ensure any straggler in the last
    // encounter gets cleaned up after a reload.
    for (let i = 0; i < 30; i++) {
      const x = box.x + box.width * (0.2 + (i % 6) * 0.12);
      const y = box.y + box.height * 0.78;
      await page.mouse.click(x, y);
      await page.waitForTimeout(250);
    }

    // The mission ends with the "Cleared" verdict from MissionResult.
    const cleared = page.getByText(/cleared/i);
    await expect(cleared).toBeVisible({ timeout: 30_000 });
  });
});
