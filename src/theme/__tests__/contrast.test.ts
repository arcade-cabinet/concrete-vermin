import { describe, expect, it } from "vitest";
import { COLOR } from "../colors";
import { AA_THRESHOLD, contrast } from "../contrast";

const TEXT_PAIRS = [
  { fg: "cream", bg: "bgAsphalt" },
  { fg: "cream", bg: "bgConcreteDark" },
  { fg: "sodium", bg: "bgAsphalt" },
  { fg: "sodium", bg: "bgConcreteDark" },
  { fg: "brickAccessible", bg: "bgAsphalt" },
  { fg: "creamDim", bg: "bgAsphalt" },
  { fg: "bgConcreteDark", bg: "sodium" },
] as const;

const UI_PAIRS = [{ fg: "sodium", bg: "bgAsphalt" }] as const;

describe("theme/colors WCAG 2.1 AA contrast", () => {
  for (const p of TEXT_PAIRS) {
    it(`${p.fg} on ${p.bg} ≥ ${AA_THRESHOLD.text}:1 (text)`, () => {
      const ratio = contrast(COLOR[p.fg as keyof typeof COLOR], COLOR[p.bg as keyof typeof COLOR]);
      expect(ratio, `actual ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA_THRESHOLD.text);
    });
  }
  for (const p of UI_PAIRS) {
    it(`${p.fg} on ${p.bg} ≥ ${AA_THRESHOLD.ui}:1 (UI)`, () => {
      const ratio = contrast(COLOR[p.fg as keyof typeof COLOR], COLOR[p.bg as keyof typeof COLOR]);
      expect(ratio, `actual ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA_THRESHOLD.ui);
    });
  }
});
