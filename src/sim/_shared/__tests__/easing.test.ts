import { describe, expect, it } from "vitest";
import {
  easeInCubic,
  easeInOutCubic,
  easeInOutQuint,
  easeInQuint,
  easeOutBack,
  easeOutCubic,
  easeOutExpo,
  easeOutQuint,
  linear,
} from "../easing";

const CURVES = [
  ["linear", linear],
  ["easeInCubic", easeInCubic],
  ["easeOutCubic", easeOutCubic],
  ["easeInOutCubic", easeInOutCubic],
  ["easeInQuint", easeInQuint],
  ["easeOutQuint", easeOutQuint],
  ["easeInOutQuint", easeInOutQuint],
  ["easeOutBack", easeOutBack],
  ["easeOutExpo", easeOutExpo],
] as const;

describe("easing curves", () => {
  for (const [name, fn] of CURVES) {
    it(`${name} maps 0 -> 0 and 1 -> 1`, () => {
      expect(fn(0)).toBeCloseTo(0, 5);
      expect(fn(1)).toBeCloseTo(1, 5);
    });
  }

  it("linear is identity", () => {
    for (let t = 0; t <= 1; t += 0.1) expect(linear(t)).toBeCloseTo(t, 8);
  });

  it("easeInCubic is below identity in the first half", () => {
    expect(easeInCubic(0.5)).toBeLessThan(0.5);
  });

  it("easeOutCubic is above identity in the first half", () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
  });
});
