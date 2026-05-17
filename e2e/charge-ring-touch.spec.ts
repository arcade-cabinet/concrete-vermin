// WebGL canvas has no preserveDrawingBuffer; in-page getImageData returns
// zeros. Use Playwright screenshots (compositor flush) and decode via pngjs.
// Match: sodium-amber 0xffb347 = rgb(255,179,71), channel-distance ≤ 60.
import { PNG } from "pngjs";
import { devices, expect, test } from "@playwright/test";

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

test.use({ ...devices["Pixel 7"] });

test.describe("charge-ring visual via touch", () => {
  test("long-press renders the charge ring on phone-portrait viewport", async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("cv:opening-shown", "1");
      } catch {
        // ignore
      }
    });

    await page.goto("/");
    await expect(page.getByTestId("main-menu")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("main-menu-start").tap();

    await expect(page.locator('[data-phase-root="briefing"]')).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /^▸ begin$|^begin$/i }).tap();

    await expect(page.locator('[data-phase-root="mission-select"]')).toBeVisible({
      timeout: 15_000,
    });
    await page
      .getByRole("button", { name: /deploy/i })
      .first()
      .tap();

    const stage = page.getByTestId("game-stage");
    await expect(stage).toBeVisible({ timeout: 20_000 });

    const box = await stage.boundingBox();
    if (!box) throw new Error("stage missing bbox");
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height * 0.6;

    const baseline = countAmber(await stage.screenshot({ omitBackground: false }));

    // Synthesize a long-press: dispatch touchstart, hold, capture screenshots,
    // then touchend. Playwright's tap() is too short to charge — we drive
    // raw pointer events via page.touchscreen.
    await page.touchscreen.tap(cx, cy); // priming tap registers the surface
    // Now hold.
    await page.evaluate(
      ({ x, y }) => {
        const el = document.querySelector<HTMLElement>('[data-testid="game-stage"]');
        if (!el) return;
        const touch = new Touch({
          identifier: 1,
          target: el,
          clientX: x,
          clientY: y,
          force: 1,
        });
        const ev = new TouchEvent("touchstart", {
          touches: [touch],
          targetTouches: [touch],
          changedTouches: [touch],
          bubbles: true,
          cancelable: true,
        });
        el.dispatchEvent(ev);
        // Mirror as pointerdown so React's pointer handlers also fire.
        el.dispatchEvent(
          new PointerEvent("pointerdown", {
            pointerType: "touch",
            clientX: x,
            clientY: y,
            isPrimary: true,
            pointerId: 1,
            bubbles: true,
            cancelable: true,
          }),
        );
      },
      { x: cx, y: cy },
    );

    let held = baseline;
    const deadline = Date.now() + 2500;
    while (Date.now() < deadline) {
      held = countAmber(await stage.screenshot({ omitBackground: false }));
      if (held > baseline) break;
      await page.waitForTimeout(80);
    }

    await page.evaluate(
      ({ x, y }) => {
        const el = document.querySelector<HTMLElement>('[data-testid="game-stage"]');
        if (!el) return;
        // Fire touchend BEFORE pointerup — libraries (and our own input
        // adapters) listening for either should both see the release.
        const touch = new Touch({
          identifier: 1,
          target: el,
          clientX: x,
          clientY: y,
        });
        el.dispatchEvent(
          new TouchEvent("touchend", {
            touches: [],
            targetTouches: [],
            changedTouches: [touch],
            bubbles: true,
            cancelable: true,
          }),
        );
        el.dispatchEvent(
          new PointerEvent("pointerup", {
            pointerType: "touch",
            clientX: x,
            clientY: y,
            isPrimary: true,
            pointerId: 1,
            bubbles: true,
            cancelable: true,
          }),
        );
      },
      { x: cx, y: cy },
    );

    expect(
      held,
      `baseline=${baseline} held=${held} — touch long-press must add sodium-amber ring pixels`,
    ).toBeGreaterThan(baseline);
  });
});
