// WebGL canvas has no preserveDrawingBuffer; in-page getImageData returns
// zeros. Use Playwright screenshots (compositor flush) and decode via pngjs.
// Match: sodium-amber 0xffb347 = rgb(255,179,71), channel-distance ≤ 60.
import { PNG } from "pngjs";
import { expect, test } from "@playwright/test";

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

test.describe("charge-ring visual via gamepad", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Chromium-only");

  test("R2/RT hold renders the charge ring", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "desktop project only");

    // Real GamepadEvent can't be synthesized in userland, so we patch
    // getGamepads to return a connected stub whose button[7] (RT) value
    // mirrors a window-side latch. Then we flip the latch to assert the
    // gamepad code path drives queueChargeStart.
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("cv:opening-shown", "1");
      } catch {
        // ignore
      }
      type LatchedWindow = Window & { __rtHeld?: boolean };
      const w = window as LatchedWindow;
      w.__rtHeld = false;
      const buttons = Array.from({ length: 17 }, () => ({ pressed: false, value: 0 }));
      const stub = {
        id: "cv-test-pad",
        index: 0,
        connected: true,
        timestamp: 0,
        mapping: "standard" as const,
        axes: [0, 0, 0, 0],
        buttons,
        vibrationActuator: null,
      } as unknown as Gamepad;
      Object.defineProperty(navigator, "getGamepads", {
        configurable: true,
        value: () => {
          const held = w.__rtHeld === true;
          buttons[7] = { pressed: held, value: held ? 1 : 0 };
          return [stub, null, null, null];
        },
      });
      // Wake the input/gamepad rAF poll loop with a connected event.
      window.dispatchEvent(new Event("gamepadconnected"));
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

    const baseline = countAmber(await stage.screenshot({ omitBackground: false }));

    await page.evaluate(() => {
      (window as Window & { __rtHeld?: boolean }).__rtHeld = true;
    });

    let held = baseline;
    const deadline = Date.now() + 2500;
    while (Date.now() < deadline) {
      held = countAmber(await stage.screenshot({ omitBackground: false }));
      if (held > baseline) break;
      await page.waitForTimeout(80);
    }

    await page.evaluate(() => {
      (window as Window & { __rtHeld?: boolean }).__rtHeld = false;
    });

    expect(
      held,
      `baseline=${baseline} held=${held} — gamepad RT hold must add sodium-amber ring pixels`,
    ).toBeGreaterThan(baseline);
  });
});
