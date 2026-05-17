import { expect, test } from "@playwright/test";

test.describe("briefing tutorial grid", () => {
  test("includes the HOLD = CHARGE row on first launch", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "desktop project only");

    await page.addInitScript(() => {
      window.localStorage.clear();
      window.localStorage.setItem("cv:opening-shown", "1");
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
    expect(await panel.locator("> div").count()).toBe(4);
  });
});
