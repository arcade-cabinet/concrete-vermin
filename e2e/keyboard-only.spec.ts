import { expect, test } from "@playwright/test";

test.describe("keyboard-only navigation", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Chromium-only");

  test("Tab + Enter navigates MainMenu → Briefing → MissionSelect", async (
    { page },
    testInfo,
  ) => {
    test.skip(testInfo.project.name !== "desktop", "desktop only");

    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("cv:opening-shown", "1");
      } catch {
        // ignore
      }
    });

    await page.goto("/");
    await expect(page.getByTestId("main-menu")).toBeVisible({ timeout: 20_000 });

    // MainMenu autofocuses the start button on mount — confirm real focus
    // landed there (not just that the element exists), then activate with Enter.
    const start = page.getByTestId("main-menu-start");
    await expect(start).toBeVisible({ timeout: 10_000 });
    await page.waitForFunction(
      () => document.activeElement?.getAttribute("data-testid") === "main-menu-start",
      { timeout: 5_000 },
    );
    await page.keyboard.press("Enter");

    // Briefing — Begin button must be reachable via Tab.
    const begin = page.getByRole("button", { name: /^▸ begin$|^begin$/i });
    await expect(begin).toBeVisible({ timeout: 15_000 });
    await page.keyboard.press("Tab");
    await page.waitForFunction(
      () => {
        const el = document.activeElement;
        return el !== null && /begin/i.test(el.textContent ?? "");
      },
      { timeout: 5_000 },
    );
    const isFocused = await begin.evaluate((el) => document.activeElement === el);
    expect(isFocused).toBe(true);
    await page.keyboard.press("Enter");

    // MissionSelect — Deploy button must be reachable via Tab.
    const missionSelect = page.locator('[data-phase-root="mission-select"]');
    await expect(missionSelect).toBeVisible({ timeout: 15_000 });
    const deploy = missionSelect.getByRole("button", { name: /deploy/i });
    await expect(deploy).toBeVisible({ timeout: 10_000 });

    // Tab through the mission list until Deploy is focused.
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Tab");
      const focused = await deploy.evaluate((el) => document.activeElement === el);
      if (focused) break;
    }
    const deployFocused = await deploy.evaluate((el) => document.activeElement === el);
    expect(deployFocused).toBe(true);
  });
});
