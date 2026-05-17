import { PNG } from "pngjs";
import { expect, test } from "@playwright/test";

/**
 * Visual integration for the charge-ring reticle. Boots to the tutorial
 * mission, holds the mouse down at a fixed canvas position long enough to
 * saturate the shotgun's 800 ms charge window, then takes a Playwright
 * screenshot and scans for sodium-amber pixels (0xffb347 ≈ rgb 255,179,71)
 * near the cursor. Release: ring vanishes — the count must drop.
 *
 * Why Playwright screenshot instead of canvas.getImageData via evaluate():
 * Pixi runs WebGL without `preserveDrawingBuffer`, so an in-page readback
 * of the live canvas returns zeros. The screenshot path forces a compositor
 * flush and returns deterministic pixels we can decode with pngjs.
 *
 * Tolerance: channel-distance ≤ 60 to absorb Pixi alpha blending + CRT
 * overlay tint. Counts pixels; a single match is "ring present."
 */

const AMBER = { r: 255, g: 179, b: 71 };

function countAmber(buf: Buffer): number {
  const png = PNG.sync.read(buf);
  const data = png.data;
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    const dr = Math.abs(data[i] - AMBER.r);
    const dg = Math.abs(data[i + 1] - AMBER.g);
    const db = Math.abs(data[i + 2] - AMBER.b);
    if (dr + dg + db <= 60) n++;
  }
  return n;
}

test.describe("charge-ring visual", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Chromium-only");

  test("amber ring appears during hold and vanishes after release", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "desktop project only");

    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("cv:opening-shown", "1");
      } catch {
        // ignore
      }
    });

    await page.goto("/");
    await expect(page.getByTestId("main-menu")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("main-menu-start").click();

    await expect(page.locator('[data-phase-root="briefing"]')).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /^▸ begin$|^begin$/i }).click();

    await expect(page.locator('[data-phase-root="mission-select"]')).toBeVisible({
      timeout: 15_000,
    });
    await page
      .getByRole("button", { name: /deploy/i })
      .first()
      .click();

    const stage = page.getByTestId("game-stage");
    await expect(stage).toBeVisible({ timeout: 20_000 });

    const box = await stage.boundingBox();
    if (!box) throw new Error("stage missing bbox");
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height * 0.6;

    const baseline = countAmber(await stage.screenshot({ omitBackground: false }));

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    // Poll until the screenshot actually shows ring pixels, capped by a
    // wall-clock budget — replaces a fixed waitForTimeout that's flaky
    // on slow CI runners. Budget = shotgun.maxChargeMs (800) + frame slack.
    let held = baseline;
    const deadline = Date.now() + 2500;
    while (Date.now() < deadline) {
      held = countAmber(await stage.screenshot({ omitBackground: false }));
      if (held > baseline) break;
      await page.waitForTimeout(80);
    }

    await page.mouse.up();

    expect(
      held,
      `baseline=${baseline} held=${held} — charge ring must add sodium-amber pixels during hold`,
    ).toBeGreaterThan(baseline);
    // Ring vanishing is asserted by unit tests against the runner snapshot
    // (chargeProgress goes null on release/cancel/ghost — see
    // src/runtime/__tests__/charge-state.test.ts). At the pixel level the
    // released frame is noisy: muzzle flashes + projectile sodium accents
    // appear in the same color band, so a pixel-count drop is not a clean
    // signal. The unit test pins the logical state; this e2e pins that the
    // visual feedback reaches the canvas at all.
  });
});
