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
    await page.waitForTimeout(900);
    const held = countAmber(await stage.screenshot({ omitBackground: false }));

    await page.mouse.up();
    // Let the ring be cleared from the next published frame.
    await page.waitForTimeout(160);
    const released = countAmber(await stage.screenshot({ omitBackground: false }));

    expect(
      held,
      `baseline=${baseline} held=${held} released=${released} — ring must add amber during hold`,
    ).toBeGreaterThan(baseline);
    expect(
      released,
      `baseline=${baseline} held=${held} released=${released} — ring must clear after release`,
    ).toBeLessThan(held);
  });
});
