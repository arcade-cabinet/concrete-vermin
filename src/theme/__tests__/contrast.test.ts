import { describe, expect, it } from "vitest";
import { COLOR } from "../colors";

function srgbToLinear(c: number): number {
  const cs = c / 255;
  return cs <= 0.03928 ? cs / 12.92 : ((cs + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const m = hex.replace("#", "");
  const r = Number.parseInt(m.slice(0, 2), 16);
  const g = Number.parseInt(m.slice(2, 4), 16);
  const b = Number.parseInt(m.slice(4, 6), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrast(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

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
    it(`${p.fg} on ${p.bg} ≥ 4.5:1 (text)`, () => {
      const ratio = contrast(COLOR[p.fg as keyof typeof COLOR], COLOR[p.bg as keyof typeof COLOR]);
      expect(ratio, `actual ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    });
  }
  for (const p of UI_PAIRS) {
    it(`${p.fg} on ${p.bg} ≥ 3:1 (UI)`, () => {
      const ratio = contrast(COLOR[p.fg as keyof typeof COLOR], COLOR[p.bg as keyof typeof COLOR]);
      expect(ratio, `actual ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(3.0);
    });
  }
});
