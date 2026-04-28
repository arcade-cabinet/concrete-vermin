import { describe, expect, it } from "vitest";
import { allParallaxOffsets, parallaxOffset } from "../effects/parallax";

describe("render/effects/parallax", () => {
  it("zeros every layer when reduced=true", () => {
    const all = allParallaxOffsets(123, true);
    expect(all.far).toEqual({ dx: 0, dy: 0 });
    expect(all.mid).toEqual({ dx: 0, dy: 0 });
    expect(all.near).toEqual({ dx: 0, dy: 0 });
  });

  it("returns deterministic offsets for the same time", () => {
    const a = parallaxOffset("mid", 5, false);
    const b = parallaxOffset("mid", 5, false);
    expect(a).toEqual(b);
  });

  it("amplitude grows with depth: |near| > |mid| > |far|", () => {
    const probes: number[] = [];
    for (let t = 0.5; t <= 12; t += 0.5) probes.push(t);
    const peak = (layer: "far" | "mid" | "near") =>
      probes.reduce((m, t) => Math.max(m, Math.abs(parallaxOffset(layer, t, false).dx)), 0);
    expect(peak("near")).toBeGreaterThan(peak("mid"));
    expect(peak("mid")).toBeGreaterThan(peak("far"));
  });

  it("y-component is smaller than x-component for every layer", () => {
    for (const layer of ["far", "mid", "near"] as const) {
      const probes: number[] = [];
      for (let t = 0.5; t <= 12; t += 0.5) probes.push(t);
      const peakX = probes.reduce((m, t) => Math.max(m, Math.abs(parallaxOffset(layer, t, false).dx)), 0);
      const peakY = probes.reduce((m, t) => Math.max(m, Math.abs(parallaxOffset(layer, t, false).dy)), 0);
      expect(peakY).toBeLessThan(peakX);
    }
  });

  it("returns a frozen object from allParallaxOffsets", () => {
    const all = allParallaxOffsets(5, false);
    expect(Object.isFrozen(all)).toBe(true);
  });
});
