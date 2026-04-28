#!/usr/bin/env tsx
/**
 * WCAG 2.1 AA contrast audit on brand tokens. Computes the contrast
 * ratio for every (foreground, background) pair the UI actually
 * uses, prints a table, and exits non-zero if any required-AA pair
 * falls below 4.5:1 (normal text) or 3:1 (large text / UI components).
 *
 * Run: pnpm exec tsx scripts/contrast-audit.ts
 *
 * This catches token regressions before they hit the live screenshot
 * + Lighthouse audit on the deployed Pages preview.
 */
import { COLOR } from "../src/theme/colors";
import { AA_THRESHOLD, contrast } from "../src/theme/contrast";

interface Pair {
  fg: string;
  bg: string;
  fgName: string;
  bgName: string;
  /** "text" → 4.5:1 floor, "ui" → 3:1 floor (large text / icons / borders). */
  kind: "text" | "ui";
  /** Where the pair appears in the UI. */
  context: string;
}

const PAIRS: Pair[] = [
  { fg: COLOR.cream, bg: COLOR.bgAsphalt, fgName: "cream", bgName: "bgAsphalt", kind: "text", context: "HUD body text" },
  { fg: COLOR.cream, bg: COLOR.bgConcreteDark, fgName: "cream", bgName: "bgConcreteDark", kind: "text", context: "MissionSelect tile text on background" },
  { fg: COLOR.sodium, bg: COLOR.bgAsphalt, fgName: "sodium", bgName: "bgAsphalt", kind: "text", context: "HUD labels (SCORE, SHELLS)" },
  { fg: COLOR.sodium, bg: COLOR.bgConcreteDark, fgName: "sodium", bgName: "bgConcreteDark", kind: "text", context: "Section headers" },
  { fg: COLOR.brickAccessible, bg: COLOR.bgAsphalt, fgName: "brickAccessible", bgName: "bgAsphalt", kind: "text", context: "Critical alerts (low ammo / lives)" },
  { fg: COLOR.creamDim, bg: COLOR.bgAsphalt, fgName: "creamDim", bgName: "bgAsphalt", kind: "text", context: "Settings descriptions" },
  // UI components (≥ 3:1).
  { fg: COLOR.sodium, bg: COLOR.bgAsphalt, fgName: "sodium", bgName: "bgAsphalt", kind: "ui", context: "Sodium-bordered button outlines" },
  { fg: COLOR.bgConcreteDark, bg: COLOR.sodium, fgName: "bgConcreteDark", bgName: "sodium", kind: "text", context: "DEPLOY button (dark text on sodium)" },
];

const ROW = (p: Pair, ratio: number, ok: boolean) =>
  `${ok ? "✓" : "✗"}  ${p.fgName.padEnd(16)} on ${p.bgName.padEnd(20)} ${ratio.toFixed(2)}:1  [${p.kind}]  ${p.context}`;

let failed = 0;
const out = (s: string): void => {
  process.stdout.write(`${s}\n`);
};
const err = (s: string): void => {
  process.stderr.write(`${s}\n`);
};
out("# WCAG 2.1 AA brand-token contrast audit\n");
for (const p of PAIRS) {
  const ratio = contrast(p.fg, p.bg);
  const floor = p.kind === "text" ? AA_THRESHOLD.text : AA_THRESHOLD.ui;
  const ok = ratio >= floor;
  if (!ok) failed++;
  out(ROW(p, ratio, ok));
}
out("");
if (failed > 0) {
  err(`FAIL: ${failed} pair(s) below WCAG AA threshold.`);
  // Set exitCode rather than calling process.exit so Node fully flushes
  // stdout/stderr before terminating — important for CI log readability.
  process.exitCode = 1;
} else {
  out(`OK: all ${PAIRS.length} pairs meet WCAG AA.`);
}
