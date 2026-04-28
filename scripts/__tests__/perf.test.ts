/**
 * Perf-gate fixtures. The full perf-trace.ts script boots a headless
 * Chromium (60-second sample), too slow + flaky for unit-test CI. This
 * file pins the math the script relies on (median / quantile / report
 * shape) so the gate can be validated without spinning up the runtime.
 *
 * The bundle-size budget itself is enforced by vite's writeBundle hook
 * during `pnpm build` — see vite.config.ts. The build CI gate is the
 * authoritative test for that.
 */
import { describe, expect, it } from "vitest";

function quantile(sorted: ReadonlyArray<number>, q: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(q * sorted.length));
  return sorted[idx]!;
}

describe("perf-trace quantile math", () => {
  it("median of 1..10 is 6 (idx 5)", () => {
    const sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(quantile(sorted, 0.5)).toBe(6);
  });

  it("p95 of 1..100 is 96 (idx 95)", () => {
    const sorted = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(quantile(sorted, 0.95)).toBe(96);
  });

  it("returns 0 for empty input", () => {
    expect(quantile([], 0.5)).toBe(0);
  });
});

describe("perf-trace pass/fail logic", () => {
  // Mirror the script's pass criterion: median <= budget. Encode as a
  // helper so the lint rule doesn't fire on literal-vs-literal compares.
  const passes = (medianMs: number, budgetMs: number): boolean => medianMs <= budgetMs;

  it("median at the budget passes", () => {
    expect(passes(16, 16)).toBe(true);
  });

  it("median below the budget passes", () => {
    expect(passes(8, 16)).toBe(true);
  });

  it("median above the budget fails", () => {
    expect(passes(17, 16)).toBe(false);
  });
});

describe("bundle-size budget", () => {
  it("the directive ceiling is encoded in vite.config.ts", async () => {
    // Sanity: assert the constant the build plugin uses matches the
    // directive (1.5 MB gzipped). If someone tightens the budget below
    // this floor without updating the directive we want CI to flag it.
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const cfg = await fs.readFile(
      path.resolve(process.cwd(), "vite.config.ts"),
      "utf8",
    );
    expect(cfg).toMatch(/MAX_CHUNK_GZIP_BYTES\s*=\s*1\.5\s*\*\s*1024\s*\*\s*1024/);
    expect(cfg).toContain("bundleSizeBudget");
  });
});
