/**
 * Hits the live GitHub Pages deployment, confirms the build loads and the
 * MainMenu becomes interactive. Run after a release lands on main to
 * verify the deploy-pages job actually shipped a working bundle.
 *
 * Usage: pnpm exec tsx scripts/pages-smoke.ts
 * Exits 0 on success, 1 on any failure.
 */
import { chromium } from "@playwright/test";

const PAGES_URL = process.env.PAGES_URL ?? "https://arcade-cabinet.github.io/concrete-vermin/";

async function main(): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // Suppress the opening interstitial so the MainMenu is reachable without
  // navigating it.
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("cv:opening-shown", "1");
    } catch {
      // ignore
    }
  });

  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("requestfailed", (req) =>
    errors.push(`requestfailed: ${req.url()} (${req.failure()?.errorText ?? "unknown"})`),
  );

  console.log(`[pages-smoke] navigating ${PAGES_URL}`);
  const resp = await page.goto(PAGES_URL, { timeout: 30_000 });
  if (!resp || !resp.ok()) {
    throw new Error(`navigation failed: status=${resp?.status() ?? "no-response"}`);
  }

  console.log("[pages-smoke] waiting for main-menu");
  await page.getByTestId("main-menu").waitFor({ timeout: 30_000 });

  console.log("[pages-smoke] waiting for press-start CTA");
  await page.getByTestId("main-menu-start").waitFor({ timeout: 10_000 });

  // Click start; assert briefing reachable so the React lazy chunks actually
  // resolved on Pages.
  await page.getByTestId("main-menu-start").click();
  await page.locator('[data-phase-root="briefing"]').waitFor({ timeout: 20_000 });

  if (errors.length > 0) {
    throw new Error(`page errors during load:\n  ${errors.join("\n  ")}`);
  }

  console.log("[pages-smoke] PASS — Pages bundle boots and reaches briefing");
  await browser.close();
}

main().catch((err) => {
  console.error("[pages-smoke] FAIL:", err.message);
  process.exit(1);
});
