#!/usr/bin/env tsx
/**
 * Frame-time performance gate. Boots the built bundle in headless
 * Chromium, drives the player through Press Start → Begin → Deploy →
 * playing, then samples requestAnimationFrame deltas for 60 s while
 * firing periodic clicks to keep the simulation busy. Emits the raw
 * frame-time array and summary stats as JSON, and exits non-zero if
 * the median frame time exceeds the budget.
 *
 * Run:
 *   pnpm exec tsx scripts/perf-trace.ts
 *   pnpm exec tsx scripts/perf-trace.ts --budget-ms 16
 *   pnpm exec tsx scripts/perf-trace.ts --duration-s 30 --out perf.json
 */

import { execFile, spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { exit, stderr, stdout } from "node:process";
import { promisify } from "node:util";
import { chromium } from "@playwright/test";

const execFileAsync = promisify(execFile);
const PORT = 41739;
const BASE_URL = `http://127.0.0.1:${PORT}`;

interface Args {
  durationS: number;
  budgetMs: number;
  out: string | null;
  skipBuild: boolean;
}

function parseArgs(argv: ReadonlyArray<string>): Args {
  const args: Args = { durationS: 60, budgetMs: 16, out: null, skipBuild: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--duration-s") args.durationS = Number(argv[++i]);
    else if (a === "--budget-ms") args.budgetMs = Number(argv[++i]);
    else if (a === "--out") args.out = argv[++i] ?? null;
    else if (a === "--skip-build") args.skipBuild = true;
  }
  return args;
}

async function ensureBuild(): Promise<void> {
  stdout.write("[perf-trace] building bundle…\n");
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
    const onChunk = (data: Buffer): void => {
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

interface PerfReport {
  durationS: number;
  sampleCount: number;
  budgetMs: number;
  medianMs: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
  meanMs: number;
  passed: boolean;
}

function quantile(sorted: ReadonlyArray<number>, q: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(q * sorted.length));
  return sorted[idx]!;
}

async function trace(args: Args): Promise<PerfReport> {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--mute-audio", "--use-angle=gl", "--enable-webgl"],
  });
  try {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
    });
    // Suppress the opening interstitial so the tutorial drive matches
    // the steady-state frame budget, not a one-time overlay path.
    await ctx.addInitScript(() => {
      try {
        window.localStorage.setItem("cv:opening-shown", "1");
      } catch {
        // Best-effort.
      }
    });
    const page = await ctx.newPage();
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

    // Drive the player into the playing phase.
    await page.getByTestId("main-menu-start").click({ timeout: 15_000 });
    await page.getByRole("button", { name: /^▸ begin$|^begin$/i }).click({ timeout: 15_000 });
    const missionSelect = page.locator('[data-phase-root="mission-select"]');
    await missionSelect.waitFor({ timeout: 10_000 });
    await missionSelect.getByRole("button", { name: /^deploy/i }).click();
    await page.getByTestId("game-stage").waitFor({ timeout: 15_000 });

    // Install the rAF-delta sampler before the duration window starts.
    await page.evaluate(() => {
      // biome-ignore lint/suspicious/noExplicitAny: window-scoped probe.
      (window as any).__cvFrameDeltas = [];
      let prev = performance.now();
      const tick = (now: number): void => {
        // biome-ignore lint/suspicious/noExplicitAny: window-scoped probe.
        (window as any).__cvFrameDeltas.push(now - prev);
        prev = now;
        window.requestAnimationFrame(tick);
      };
      window.requestAnimationFrame(tick);
    });

    // Drive periodic clicks to keep the sim alive (fire shots).
    const stage = page.getByTestId("game-stage");
    const box = await stage.boundingBox();
    if (!box) throw new Error("stage has no bounding box");
    const startedAt = Date.now();
    let i = 0;
    while ((Date.now() - startedAt) / 1000 < args.durationS) {
      const x = box.x + box.width * (0.15 + (i % 8) * 0.1);
      const y = box.y + box.height * 0.78;
      await page.mouse.click(x, y);
      await page.waitForTimeout(120);
      i++;
    }

    const samples: number[] = await page.evaluate(() => {
      // biome-ignore lint/suspicious/noExplicitAny: window-scoped probe.
      const arr = (window as any).__cvFrameDeltas as number[] | undefined;
      return arr ? [...arr] : [];
    });

    // Drop the first 30 samples (page-load + warmup spike).
    const trimmed = samples.slice(30);
    const sorted = [...trimmed].sort((a, b) => a - b);
    const sum = trimmed.reduce((acc, v) => acc + v, 0);
    const mean = trimmed.length > 0 ? sum / trimmed.length : 0;
    const median = quantile(sorted, 0.5);
    const p95 = quantile(sorted, 0.95);
    const p99 = quantile(sorted, 0.99);
    const max = sorted.length > 0 ? sorted[sorted.length - 1]! : 0;
    return {
      durationS: args.durationS,
      sampleCount: trimmed.length,
      budgetMs: args.budgetMs,
      medianMs: round(median),
      p95Ms: round(p95),
      p99Ms: round(p99),
      maxMs: round(max),
      meanMs: round(mean),
      passed: median <= args.budgetMs,
    };
  } finally {
    await browser.close();
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (!args.skipBuild) await ensureBuild();
  const preview = startPreview();
  await preview.ready;
  let report: PerfReport;
  try {
    report = await trace(args);
  } finally {
    preview.kill();
  }
  const json = JSON.stringify(report, null, 2);
  stdout.write(`${json}\n`);
  if (args.out) {
    await writeFile(args.out, json);
    stdout.write(`[perf-trace] wrote ${args.out}\n`);
  }
  if (!report.passed) {
    stderr.write(
      `FAIL: median frame time ${report.medianMs} ms exceeds budget ${report.budgetMs} ms.\n`,
    );
    process.exitCode = 1;
  }
}

void main().catch((err) => {
  stderr.write(`[perf-trace] ${err instanceof Error ? err.message : String(err)}\n`);
  exit(1);
});
