import { expect, test } from "@playwright/test";

/**
 * Accessibility audit using axe-core injected via page.evaluate.
 * Checks MainMenu, MissionSelect, Briefing, Settings, and Credits for
 * critical/serious violations.
 *
 * axe-core is a devDependency; we resolve its path at runtime and read
 * the bundle into the page so we don't need @axe-core/playwright.
 */

import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core");
const axeSource = readFileSync(axePath, "utf-8");

type AxeResults = {
  violations: { id: string; impact: string | null; description: string }[];
};

async function checkA11y(page: import("@playwright/test").Page, label: string): Promise<void> {
  const results: AxeResults = await page.evaluate((src) => {
    // new Function is the only way to execute the injected axe-core bundle.
    return new Function(
      `${src}\n; return axe.run(document, {runOnly: ['wcag2a','wcag2aa','best-practice']});`,
    )() as Promise<AxeResults>;
  }, axeSource);

  const blocking = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  if (blocking.length > 0) {
    const summary = blocking.map((v) => `  [${v.impact}] ${v.id}: ${v.description}`).join("\n");
    throw new Error(`a11y violations on ${label}:\n${summary}`);
  }
}

test.describe("accessibility", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "Chromium-only");

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("cv:opening-shown", "1");
      } catch {
        // ignore
      }
    });
  });

  test("MainMenu — no critical/serious a11y violations", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "desktop only");
    await page.goto("/");
    await expect(page.getByTestId("main-menu")).toBeVisible({ timeout: 20_000 });
    await checkA11y(page, "MainMenu");
  });

  test("Briefing — no critical/serious a11y violations", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "desktop only");
    await page.goto("/");
    await page.getByTestId("main-menu-start").click();
    await expect(page.locator('[data-phase-root="briefing"]')).toBeVisible({ timeout: 15_000 });
    await checkA11y(page, "Briefing");
  });

  test("MissionSelect — no critical/serious a11y violations", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "desktop only");
    await page.goto("/");
    await page.getByTestId("main-menu-start").click();
    const begin = page.getByRole("button", { name: /^▸ begin$|^begin$/i });
    await expect(begin).toBeVisible({ timeout: 15_000 });
    await begin.click();
    await expect(page.locator('[data-phase-root="mission-select"]')).toBeVisible({
      timeout: 15_000,
    });
    await checkA11y(page, "MissionSelect");
  });

  test("Settings — no critical/serious a11y violations", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "desktop only");
    await page.goto("/");
    await expect(page.getByTestId("main-menu")).toBeVisible({ timeout: 20_000 });
    // Open Settings dialog via the Settings button.
    const settingsBtn = page.getByRole("button", { name: /settings/i });
    if (await settingsBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await settingsBtn.click();
      await page.waitForTimeout(500);
    }
    await checkA11y(page, "Settings");
  });

  test("Credits — no critical/serious a11y violations", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "desktop only");
    await page.goto("/");
    await expect(page.getByTestId("main-menu")).toBeVisible({ timeout: 20_000 });
    const creditsBtn = page.getByRole("button", { name: /credits/i });
    if (await creditsBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await creditsBtn.click();
      await page.waitForTimeout(500);
    }
    await checkA11y(page, "Credits");
  });
});
