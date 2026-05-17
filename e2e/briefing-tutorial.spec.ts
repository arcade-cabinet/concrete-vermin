import { expect, test } from "@playwright/test";

/**
 * The first-launch briefing must surface the charge-shot mechanic.
 * Without this affordance, players never discover hold-to-charge and
 * the Phase 2 system is dead weight.
 *
 * Asserts the HOW_TO_BEAT grid lists AIM + FIRE, RELOAD, HOLD = CHARGE,
 * and STAY ALIVE. firstLaunchSeen is cleared by ensuring no localStorage
 * carries over; the briefing only renders the panel when the flag is
 * false.
 */

test.describe("briefing tutorial grid", () => {
  test("includes the HOLD = CHARGE row on first launch", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "desktop project only");

    await page.addInitScript(() => {
      try {
        window.localStorage.clear();
        window.localStorage.setItem("cv:opening-shown", "1");
      } catch {
        // ignore
      }
    });

    await page.goto("/");
    await expect(page.getByTestId("main-menu")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("main-menu-start").click();

    const panel = page.getByTestId("how-to-beat");
    await expect(panel).toBeVisible({ timeout: 15_000 });

    await expect(panel).toContainText("AIM + FIRE");
    await expect(panel).toContainText("RELOAD");
    await expect(panel).toContainText("HOLD = CHARGE");
    await expect(panel).toContainText("STAY ALIVE");
  });
});
