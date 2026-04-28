import { describe, expect, it } from "vitest";
import { createRng } from "../../rng";
import { computeStats, sampleGaussian, sampleRange, sampleWithFallback } from "../variance";

describe("sampleRange", () => {
  it("returns min when max <= min (fallback)", () => {
    const rng = createRng(1);
    expect(sampleRange(rng, { min: 5, max: 5 })).toBe(5);
    expect(sampleRange(rng, { min: 5, max: 3 })).toBe(5);
  });

  it("stays inside [min, max)", () => {
    const rng = createRng(2);
    for (let i = 0; i < 1000; i++) {
      const v = sampleRange(rng, { min: 0, max: 10 });
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(10);
    }
  });
});

describe("sampleGaussian", () => {
  it("clips to [min, max]", () => {
    const rng = createRng(3);
    for (let i = 0; i < 500; i++) {
      const v = sampleGaussian(rng, 0, 1000, -1, 1);
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("is centered near the mean over many samples", () => {
    const rng = createRng(4);
    let sum = 0;
    const N = 5000;
    for (let i = 0; i < N; i++) sum += sampleGaussian(rng, 10, 1, 0, 20);
    expect(Math.abs(sum / N - 10)).toBeLessThan(0.5);
  });
});

describe("sampleWithFallback", () => {
  it("returns the first qualifying sample", () => {
    const rng = createRng(5);
    const v = sampleWithFallback(
      rng,
      (r) => r.int(0, 9),
      (n) => n >= 5,
    );
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(9);
  });

  it("returns the last sample if none qualify", () => {
    const rng = createRng(6);
    const v = sampleWithFallback(
      rng,
      () => -1,
      (n) => n > 100,
      4,
    );
    expect(v).toBe(-1);
  });
});

describe("computeStats", () => {
  it("returns zeros on empty input", () => {
    expect(computeStats([])).toEqual({ mean: 0, stddev: 0, min: 0, max: 0, count: 0 });
  });

  it("computes mean / stddev / min / max correctly", () => {
    const stats = computeStats([1, 2, 3, 4, 5]);
    expect(stats.mean).toBe(3);
    expect(stats.min).toBe(1);
    expect(stats.max).toBe(5);
    expect(stats.count).toBe(5);
    expect(stats.stddev).toBeCloseTo(Math.sqrt(2), 5);
  });
});
