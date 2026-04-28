#!/usr/bin/env tsx
/**
 * Visual-regression screenshot capture. Boots the built bundle via
 * `vite preview`, opens it in Chromium at five canonical viewports,
 * waits for the Briefing screen to settle, and writes PNGs into
 * docs/screenshots/.
 *
 * Run:  pnpm screenshots
 * Re-run after any visible UI change; commit the diff alongside the
 * code change so reviewers can see what shifted.
 */

import { execFile, spawn } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { exit, stdout } from "node:process";
import { setTimeout as sleep } from "node:timers/promises";
import { promisify } from "node:util";
import { chromium } from "@playwright/test";

const execFileAsync = promisify(execFile);
const PORT = 41739;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const OUT_DIR = "docs/screenshots";

interface Shot {
  name: string;
  width: number;
  height: number;
}

// The five canonical viewports per CV-UX. Names map to common device
// classes so the doc reader can pattern-match.
const SHOTS: ReadonlyArray<Shot> = [
  { name: "phone-portrait-320x568", width: 320, height: 568 },
  { name: "phone-portrait-375x812", width: 375, height: 812 },
  { name: "tablet-portrait-768x1024", width: 768, height: 1024 },
  { name: "desktop-720p-1280x720", width: 1280, height: 720 },
  { name: "desktop-1080p-1920x1080", width: 1920, height: 1080 },
];

async function ensureBuild(): Promise<void> {
  stdout.write("[screenshots] building bundle…\n");
  await execFileAsync("pnpm", ["run", "build"], { cwd: process.cwd() });
}

function startPreview(): { kill: () => void; ready: Promise<void> } {
  const proc = spawn(
    "pnpm",
    ["exec", "vite", "preview", "--host", "127.0.0.1", "--port", String(PORT)],
    { stdio: ["ignore", "pipe", "inherit"] },
  );
  const ready = new Promise<void>((resolve, reject) => {
    let buf = "";
    const onChunk = (data: Buffer) => {
      buf += data.toString();
      if (buf.includes(`localhost:${PORT}`) || buf.includes(`127.0.0.1:${PORT}`)) {
        resolve();
      }
    };
    proc.stdout?.on("data", onChunk);
    proc.once("error", reject);
    proc.once("exit", (code) => {
      if (code !== 0 && code !== null) reject(new Error(`preview exited ${code}`));
    });
    setTimeout(() => reject(new Error("preview did not become ready in 30s")), 30_000);
  });
  return { kill: () => proc.kill("SIGTERM"), ready };
}

async function capture(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });
  // Clear existing PNGs so a removed viewport doesn't linger.
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  for (const shot of SHOTS) {
    // Fresh browser per shot — sharing a single browser across
    // contexts caused Playwright's screenshot to hang after the first
    // shot (likely a fonts.ready / animation race in the headless
    // build). The cost is ~1 s of launch overhead per shot, which is
    // fine for a 5-shot batch run by hand.
    const browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--use-angle=gl",
        "--enable-webgl",
        "--ignore-gpu-blocklist",
        "--mute-audio",
      ],
    });
    try {
      const ctx = await browser.newContext({
        viewport: { width: shot.width, height: shot.height },
        deviceScaleFactor: 2,
      });
      const page = await ctx.newPage();
      stdout.write(`[screenshots] ${shot.name}…\n`);
      // Suppress the opening-interstitial flash so the screenshot shows
      // the actual MainMenu / playing surface, not the cutscene overlay.
      await ctx.addInitScript(() => {
        try {
          window.localStorage.setItem("cv:opening-shown", "1");
        } catch {
          // Best-effort.
        }
      });
      // domcontentloaded, not networkidle — Pixi-react never hits
      // networkidle because the rAF ticker keeps requesting frames
      // long after first paint, and Playwright counts that as work.
      await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
      await page.locator('[data-testid="main-menu"]').waitFor({ timeout: 10_000 });
      await sleep(400);
      // 1. MainMenu shot.
      await page.screenshot({
        path: `${OUT_DIR}/${shot.name}-01-mainmenu.png`,
        fullPage: false,
        animations: "disabled",
        caret: "hide",
        timeout: 15_000,
      });
      // 2. Drive into the playing phase + capture the actual game
      //    canvas inside the ArcadeFrame chrome — the surface players
      //    spend 95% of their time looking at, and the one we keep
      //    finding regressions on (canvas sizing, parallax, reticle).
      await page.getByTestId("main-menu-start").click();
      const begin = page.getByRole("button", { name: /^▸ begin$|^begin$/i });
      await begin.waitFor({ timeout: 10_000 });
      await begin.click();
      const ms = page.locator('[data-phase-root="mission-select"]');
      await ms.waitFor({ timeout: 10_000 });
      await ms.getByRole("button", { name: /^deploy/i }).click();
      await page.getByTestId("game-stage").waitFor({ timeout: 15_000 });
      // Let Pixi paint a couple of frames + a few vermin spawn so the
      // shot reflects an actual gameplay moment, not an empty zone.
      await sleep(1500);
      await page.screenshot({
        path: `${OUT_DIR}/${shot.name}-02-playing.png`,
        fullPage: false,
        animations: "disabled",
        caret: "hide",
        timeout: 15_000,
      });
      await ctx.close();
    } finally {
      await browser.close();
    }
  }
}

async function main(): Promise<void> {
  await ensureBuild();
  const preview = startPreview();
  await preview.ready;
  try {
    await capture();
    stdout.write(`[screenshots] wrote ${SHOTS.length} PNGs to ${OUT_DIR}/\n`);
  } finally {
    preview.kill();
  }
}

main().catch((err) => {
  process.stderr.write(`[screenshots] FAIL: ${err}\n`);
  exit(1);
});
