import { describe, expect, it } from "vitest";
import {
  deriveLockRecommendations,
  estimateVariantDrift,
  estimateWeaponEffect,
  getGovernor,
  GOVERNORS,
  gradeAtLeast,
  gradeFor,
  medianGrade,
  MISSION_THRESHOLDS,
  proposeAutobalance,
  runOnce,
  runSeededBenchmark,
  sweep,
} from "../index";
import { MISSIONS } from "../../content/missions";

const SEEDS = [1, 2, 3, 4, 5];

describe("governors", () => {
  it("exposes three profiles in the expected ordering", () => {
    expect(GOVERNORS).toEqual(["perfect", "median", "trash"]);
    expect(getGovernor("perfect").accuracy).toBeGreaterThan(getGovernor("median").accuracy);
    expect(getGovernor("median").accuracy).toBeGreaterThan(getGovernor("trash").accuracy);
  });
});

describe("scoring", () => {
  it("gradeFor monotonic in accuracy + survival", () => {
    expect(gradeAtLeast(gradeFor(1, 1), "S")).toBe(true);
    expect(gradeAtLeast(gradeFor(0, 0), "F")).toBe(true);
    expect(gradeAtLeast(gradeFor(0.85, 0.85), "A")).toBe(true);
  });

  it("medianGrade picks the middle ranked grade", () => {
    expect(medianGrade(["A", "B", "C"])).toBe("B");
    expect(medianGrade(["S+", "S+", "B", "C", "D"])).toBe("B");
  });
});

describe("thresholds", () => {
  it("covers every mission in the registry", () => {
    const missionIds = new Set(MISSIONS.map((m) => m.id));
    const thresholdIds = new Set(MISSION_THRESHOLDS.map((t) => t.missionId));
    for (const id of missionIds) {
      expect(thresholdIds.has(id), `missing threshold for ${id}`).toBe(true);
    }
  });
});

describe("benchmarks", () => {
  it("runOnce is deterministic given (mission, seed, governor)", () => {
    const a = runOnce("streets-01-bodega", 7, "median");
    const b = runOnce("streets-01-bodega", 7, "median");
    expect(a).toEqual(b);
  });

  it("perfect governor outperforms trash", () => {
    const perfect = runSeededBenchmark("streets-01-bodega", SEEDS, "perfect");
    const trash = runSeededBenchmark("streets-01-bodega", SEEDS, "trash");
    expect(perfect.meanAccuracy).toBeGreaterThan(trash.meanAccuracy);
    expect(perfect.clearRate).toBeGreaterThanOrEqual(trash.clearRate);
  });

  it("clearRate is in [0,1] and gradeHistogram sums to runs", () => {
    const summary = runSeededBenchmark("streets-02-alley", SEEDS, "median");
    expect(summary.clearRate).toBeGreaterThanOrEqual(0);
    expect(summary.clearRate).toBeLessThanOrEqual(1);
    const total = Object.values(summary.gradeHistogram).reduce((a, b) => a + b, 0);
    expect(total).toBe(SEEDS.length);
  });
});

describe("effects", () => {
  it("estimateWeaponEffect: shotgun has multi-pellet damage", () => {
    const e = estimateWeaponEffect("shotgun");
    expect(e.damagePerShot).toBeGreaterThan(0);
    expect(e.shotsToKillRat).toBeGreaterThan(0);
    expect(e.magDurationS).toBeGreaterThan(0);
  });

  it("estimateVariantDrift: increasing health is positive drift (harder)", () => {
    expect(estimateVariantDrift("rat", 1.5, 1)).toBeGreaterThan(0);
    expect(estimateVariantDrift("rat", 0.5, 1)).toBeLessThan(0);
  });
});

describe("sweeps", () => {
  it("walks the inclusive range with the requested step", () => {
    const r = sweep({
      shape: "weapon-damage",
      missionId: "streets-01-bodega",
      seeds: SEEDS,
      governor: "median",
      range: [0.9, 1.1],
      step: 0.1,
    });
    expect(r.steps.length).toBe(3); // 0.9, 1.0, 1.1
    expect(r.steps[0]?.value).toBeCloseTo(0.9);
    expect(r.steps[2]?.value).toBeCloseTo(1.1);
  });

  it("rejects descending range and zero step", () => {
    const opts = {
      missionId: "streets-01-bodega",
      seeds: SEEDS,
      governor: "median" as const,
    };
    expect(() =>
      sweep({ ...opts, shape: "weapon-damage", range: [1.2, 0.8], step: 0.1 }),
    ).toThrow();
    expect(() => sweep({ ...opts, shape: "weapon-damage", range: [0.8, 1.2], step: 0 })).toThrow();
  });
});

describe("locking", () => {
  it("UNMEASURED until window has 3+ samples", () => {
    const seeds = [1, 2];
    const a = runSeededBenchmark("streets-01-bodega", seeds, "median");
    const recs = deriveLockRecommendations([a]);
    expect(recs[0]?.state).toBe("UNMEASURED");
  });

  it("STABLE when same dominant grade across runs", () => {
    const a = runSeededBenchmark("streets-01-bodega", SEEDS, "perfect");
    const b = runSeededBenchmark("streets-01-bodega", SEEDS, "perfect");
    const c = runSeededBenchmark("streets-01-bodega", SEEDS, "perfect");
    const recs = deriveLockRecommendations([a, b, c]);
    expect(recs[0]?.state).toBe("STABLE");
  });
});

describe("autobalance", () => {
  it("returns a plan keyed to the mission", () => {
    const plan = proposeAutobalance({
      missionId: "streets-01-bodega",
      seeds: SEEDS,
      governor: "median",
    });
    expect(plan.missionId).toBe("streets-01-bodega");
    expect(typeof plan.inSpec).toBe("boolean");
  });
});
