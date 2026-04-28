import { describe, expect, it } from "vitest";
import { createRng } from "../../rng";
import { planSpawnPattern, SPAWN_PATTERNS } from "../patterns";

describe("planSpawnPattern", () => {
  it("returns empty for count <= 0", () => {
    expect(planSpawnPattern("left-flood", 0, createRng(1))).toEqual([]);
    expect(planSpawnPattern("left-flood", -3, createRng(1))).toEqual([]);
  });

  it("throws above the 64-cap", () => {
    expect(() => planSpawnPattern("left-flood", 65, createRng(1))).toThrow(/exceeds 64/);
  });

  it("emits exactly `count` records for every pattern", () => {
    for (const p of SPAWN_PATTERNS) {
      const r = planSpawnPattern(p, 5, createRng(1));
      expect(r.length).toBe(5);
    }
  });

  it("indexes are 0..count-1 in order", () => {
    for (const p of SPAWN_PATTERNS) {
      const r = planSpawnPattern(p, 6, createRng(1));
      expect(r.map((x) => x.index)).toEqual([0, 1, 2, 3, 4, 5]);
    }
  });

  it("delays are non-decreasing (stagger is monotonic)", () => {
    for (const p of SPAWN_PATTERNS) {
      const r = planSpawnPattern(p, 8, createRng(1));
      for (let i = 1; i < r.length; i++) {
        const a = r[i - 1] as { delayS: number };
        const b = r[i] as { delayS: number };
        expect(b.delayS).toBeGreaterThanOrEqual(a.delayS);
      }
    }
  });

  it("is deterministic — same seed and pattern → same records", () => {
    for (const p of SPAWN_PATTERNS) {
      const a = planSpawnPattern(p, 8, createRng(7));
      const b = planSpawnPattern(p, 8, createRng(7));
      expect(a).toEqual(b);
    }
  });

  it("different seeds for the same pattern produce different jitter", () => {
    // boss-scripted is deterministic (no rng draws), so skip it.
    for (const p of SPAWN_PATTERNS.filter((x) => x !== "boss-scripted")) {
      const a = planSpawnPattern(p, 8, createRng(1));
      const b = planSpawnPattern(p, 8, createRng(2));
      expect(a).not.toEqual(b);
    }
  });
});

describe("pattern shapes", () => {
  it("left-flood spawns near x=0 with rightward velocity", () => {
    const r = planSpawnPattern("left-flood", 4, createRng(1));
    for (const s of r) {
      expect(s.position.x).toBeLessThan(0.1);
      expect(s.velocity.x).toBe(1);
    }
  });

  it("right-flood spawns near x=1 with leftward velocity", () => {
    const r = planSpawnPattern("right-flood", 4, createRng(1));
    for (const s of r) {
      expect(s.position.x).toBeGreaterThan(0.9);
      expect(s.velocity.x).toBe(-1);
    }
  });

  it("ceiling-drop spawns at the top with downward velocity", () => {
    const r = planSpawnPattern("ceiling-drop", 4, createRng(1));
    for (const s of r) {
      expect(s.position.y).toBeLessThan(0.1);
      expect(s.velocity.y).toBeGreaterThan(0);
    }
  });

  it("dive-from-sky spawns near top with downward velocity", () => {
    const r = planSpawnPattern("dive-from-sky", 4, createRng(1));
    for (const s of r) {
      expect(s.position.y).toBeLessThan(0.2);
      expect(s.velocity.y).toBeGreaterThan(0);
    }
  });

  it("surface-from-grate spawns near bottom with upward velocity", () => {
    const r = planSpawnPattern("surface-from-grate", 4, createRng(1));
    for (const s of r) {
      expect(s.position.y).toBeGreaterThan(0.9);
      expect(s.velocity.y).toBeLessThan(0);
    }
  });

  it("mixed-wave alternates left and right", () => {
    const r = planSpawnPattern("mixed-wave", 6, createRng(1));
    expect(r[0]?.velocity.x).toBe(1);
    expect(r[1]?.velocity.x).toBe(-1);
    expect(r[2]?.velocity.x).toBe(1);
  });

  it("boss-scripted ignores rng (every seed → same records)", () => {
    const a = planSpawnPattern("boss-scripted", 3, createRng(1));
    const b = planSpawnPattern("boss-scripted", 3, createRng(99999));
    expect(a).toEqual(b);
  });
});
