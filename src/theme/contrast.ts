/**
 * WCAG 2.1 contrast helpers. Shared between the runtime audit
 * (scripts/contrast-audit.ts) and the regression test
 * (src/theme/__tests__/contrast.test.ts) so the two can't drift.
 *
 * Pure functions on `#rrggbb` strings. No DOM, no canvas — safe in
 * any module layer.
 */

function srgbToLinear(c: number): number {
  const cs = c / 255;
  return cs <= 0.03928 ? cs / 12.92 : ((cs + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const m = hex.replace("#", "");
  const r = Number.parseInt(m.slice(0, 2), 16);
  const g = Number.parseInt(m.slice(2, 4), 16);
  const b = Number.parseInt(m.slice(4, 6), 16);
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

export function contrast(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** WCAG 2.1 AA floors: 4.5:1 for normal text, 3:1 for large text + UI components. */
export const AA_THRESHOLD = Object.freeze({
  text: 4.5,
  ui: 3.0,
} as const);
