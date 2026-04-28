import { expect, test } from "@playwright/test";

/**
 * Gamepad smoke test: inject a mock Gamepad via window.dispatchEvent and
 * assert the game does not throw. Full gamepad simulation is not feasible
 * in Playwright; this verifies the gamepad connection handler doesn't
 * crash and the UI remains intact.
 */

test.describe("gamepad smoke", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Chromium-only");

  test("gamepadconnected event does not crash the game", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "desktop only");

    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("cv:opening-shown", "1");
      } catch {
        // ignore
      }
    });

    await page.goto("/");
    await expect(page.getByTestId("main-menu")).toBeVisible({ timeout: 20_000 });

    // Inject a synthetic gamepad connection event.
    await page.evaluate(() => {
      const mockGamepad = {
        id: "Xbox 360 Controller (XInput STANDARD GAMEPAD)",
        index: 0,
        connected: true,
        timestamp: performance.now(),
        mapping: "standard" as GamepadMappingType,
        axes: [0, 0, 0, 0],
        buttons: Array.from({ length: 17 }, () => ({
          pressed: false,
          touched: false,
          value: 0,
        })),
        hapticActuators: [],
        vibrationActuator: null,
      } as unknown as Gamepad;

      window.dispatchEvent(new GamepadEvent("gamepadconnected", { gamepad: mockGamepad }));
    });

    // Brief wait to let any gamepad handler settle.
    await page.waitForTimeout(500);

    // Game must still be alive (no crashes, main menu still visible).
    await expect(page.getByTestId("main-menu")).toBeVisible({ timeout: 5_000 });

    // No unhandled errors thrown by gamepad handler.
    expect(errors).toHaveLength(0);
  });

  test("gamepad axes input does not crash during gameplay", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "desktop only");

    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("cv:opening-shown", "1");
      } catch {
        // ignore
      }
    });

    await page.goto("/");
    await expect(page.getByTestId("main-menu")).toBeVisible({ timeout: 20_000 });

    // Inject gamepad before navigating into the game.
    await page.evaluate(() => {
      const mockGamepad = {
        id: "Generic Controller",
        index: 0,
        connected: true,
        timestamp: performance.now(),
        mapping: "standard" as GamepadMappingType,
        axes: [0.5, -0.3, 0, 0],
        buttons: Array.from({ length: 17 }, () => ({
          pressed: false,
          touched: false,
          value: 0,
        })),
        hapticActuators: [],
        vibrationActuator: null,
      } as unknown as Gamepad;

      window.dispatchEvent(new GamepadEvent("gamepadconnected", { gamepad: mockGamepad }));

      // Patch navigator.getGamepads to return the mock.
      Object.defineProperty(navigator, "getGamepads", {
        value: () => [mockGamepad, null, null, null],
        configurable: true,
      });
    });

    await page.waitForTimeout(300);

    // Navigate to mission select — game must survive the gamepad being present.
    const start = page.getByTestId("main-menu-start");
    await start.click();
    const begin = page.getByRole("button", { name: /^▸ begin$|^begin$/i });
    await expect(begin).toBeVisible({ timeout: 15_000 });

    expect(errors).toHaveLength(0);
  });
});
