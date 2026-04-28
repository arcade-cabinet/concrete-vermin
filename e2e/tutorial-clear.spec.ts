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

    // Suppress the opening interstitial deterministically. Register the
    // init script BEFORE the first navigation so the flag is set before
    // any UI renders — eliminates the goto/reload double-render and any
    // first-paint flicker.
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("cv:opening-shown", "1");
      } catch {
        // ignore
      }
    });
    await page.goto("/");

    // Main menu → Press Start (sends to Briefing for fresh runs)
    const start = page.getByTestId("main-menu-start");
    await expect(start).toBeVisible({ timeout: 15_000 });
    await start.click();

    // Briefing screen → Begin
    const begin = page.getByRole("button", { name: /^▸ begin$|^begin$/i });
    await expect(begin).toBeVisible({ timeout: 15_000 });
    await begin.click();

    // Mission select → DEPLOY drops the player straight into the mission
    // (no pawn-shop intercept on a fresh run; the Market is reachable from
    // the MainMenu and from MissionResult, never pre-mission). Scope the
    // selector to the MissionSelect phase root so a Market modal opened
    // anywhere can't steal the click.
    const missionSelect = page.locator('[data-phase-root="mission-select"]');
    await expect(missionSelect).toBeVisible({ timeout: 10_000 });
    const deploy = missionSelect.getByRole("button", { name: /^deploy/i });
    await expect(deploy).toBeVisible({ timeout: 10_000 });
    await deploy.click();
    // Wait for the Pixi canvas to mount before continuing.
    await page.waitForFunction(() => document.querySelector('[data-testid="game-stage"]') !== null, null, { timeout: 15_000 });

    // Game canvas
    const stage = page.getByTestId("game-stage");
    await expect(stage).toBeVisible({ timeout: 15_000 });

    // The HUD shows kill progress; wait for it to render before firing.
    const kills = page.getByTestId("arcade-kills");
    await expect(kills).toBeVisible();

    // Mission-01 spawns 14 rats across two waves; shotgun has a 1.4 s
    // reload after every 6 shots. 250-click cap is headroom for slow
    // CI runners + multiple reload cycles before the loop exits early.
    const box = await stage.boundingBox();
    if (!box) throw new Error("stage has no bounding box");
    // MissionResult headline. Don't use a loose /cleared/i regex — the
    // SR live region also surfaces the word in its assertive narration,
    // and Playwright strict mode rejects the ambiguity.
    const cleared = page.getByRole("heading", { name: /^cleared$/i });
    const MAX_CLICKS = 250;
    for (let i = 0; i < MAX_CLICKS; i++) {
      if (await cleared.isVisible()) break;
      const x = box.x + box.width * (0.15 + (i % 8) * 0.1);
      const y = box.y + box.height * 0.78;
      await page.mouse.click(x, y);
      await page.waitForTimeout(90);
    }

    await expect(cleared).toBeVisible({ timeout: 15_000 });
  });
});
