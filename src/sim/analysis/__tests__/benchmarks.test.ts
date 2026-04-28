import { describe, expect, it } from "vitest";
import { runOnce, runSeededBenchmark } from "../benchmarks";
import { MISSIONS } from "../../content/missions";
import { GOVERNORS } from "../governors";
import { MISSION_THRESHOLDS } from "../thresholds";

const SEED = 19790101;
const SEEDS = [SEED, SEED + 7, SEED + 14, SEED + 21, SEED + 28];

describe("benchmarks.runOnce", () => {
  it("is deterministic — same (mission, seed, governor) → same result", () => {
    const a = runOnce("streets-01-bodega", SEED, "median");
    const b = runOnce("streets-01-bodega", SEED, "median");
    expect(a).toEqual(b);
  });

  it("perfect governor never panic-fires and lands every shot", () => {
    const r = runOnce("streets-01-bodega", SEED, "perfect");
    expect(r.accuracy).toBeCloseTo(1, 2);
    expect(r.cleared).toBe(true);
  });

  it("trash governor takes longer than median on the same mission", () => {
    const median = runOnce("streets-02-alley", SEED, "median");
    const trash = runOnce("streets-02-alley", SEED, "trash");
    expect(trash.durationS).toBeGreaterThan(median.durationS);
  });

  it("partial damage accumulates across multiple shots — no per-miss contact ticks", () => {
    // Tutorial mission: 6 mangy rats. Even with median accuracy, there
    // should be near-zero lives lost (trivial enemies, generous lives).
    const r = runOnce("streets-01-bodega", SEED, "median");
    expect(r.livesLost).toBeLessThanOrEqual(1);
  });

  it("boss missions take longer than mook missions for the same governor", () => {
    const tutorial = runOnce("streets-01-bodega", SEED, "median");
    const boss = runOnce("streets-04-dumpster-bear", SEED, "median");
    expect(boss.durationS).toBeGreaterThan(tutorial.durationS);
  });

  it("mod loadout reduces shots-to-kill — incendiary shells finish bear faster", () => {
    const without = runOnce("streets-04-dumpster-bear", SEED, "perfect");
    const withMods = runOnce("streets-04-dumpster-bear", SEED, "perfect", [
      "incendiary-shells",
      "tight-choke",
    ]);
    expect(withMods.durationS).toBeLessThanOrEqual(without.durationS);
  });

  it("returns frozen result objects", () => {
    const r = runOnce("streets-01-bodega", SEED, "median");
    expect(Object.isFrozen(r)).toBe(true);
  });
});

describe("benchmarks.runSeededBenchmark", () => {
  it("aggregates across seeds and is deterministic", () => {
    const a = runSeededBenchmark("streets-01-bodega", SEEDS, "median");
    const b = runSeededBenchmark("streets-01-bodega", SEEDS, "median");
    expect(a).toEqual(b);
    expect(a.runs).toBe(SEEDS.length);
  });

  it("histogram counts every run", () => {
    const s = runSeededBenchmark("streets-01-bodega", SEEDS, "median");
    const total = Object.values(s.gradeHistogram).reduce((a, c) => a + c, 0);
    expect(total).toBe(s.runs);
  });
});

describe("benchmarks coverage matrix — every mission × every governor", () => {
  for (const mission of MISSIONS) {
    for (const g of GOVERNORS) {
      it(`${mission.id} × ${g} produces a valid result`, () => {
        const r = runOnce(mission.id, SEED, g);
        expect(r.missionId).toBe(mission.id);
        expect(r.governor).toBe(g);
        expect(r.durationS).toBeGreaterThan(0);
        expect(r.accuracy).toBeGreaterThanOrEqual(0);
        expect(r.accuracy).toBeLessThanOrEqual(1);
        expect(r.killRatio).toBeGreaterThanOrEqual(0);
        expect(r.killRatio).toBeLessThanOrEqual(1);
        expect(r.livesLost).toBeGreaterThanOrEqual(0);
      });
    }
  }
});

describe("benchmarks satisfies the threshold gate (CI-equivalent)", () => {
  it("every mission lands inside its par duration window under median", () => {
    for (const t of MISSION_THRESHOLDS) {
      const s = runSeededBenchmark(t.missionId, SEEDS, "median");
      const lo = t.parDurationS - t.parDurationWindowS;
      const hi = t.parDurationS + t.parDurationWindowS;
      expect(
        s.meanDurationS,
        `${t.missionId} duration ${s.meanDurationS.toFixed(1)}s outside ${lo}-${hi}s`,
      ).toBeGreaterThanOrEqual(lo);
      expect(s.meanDurationS).toBeLessThanOrEqual(hi);
    }
  });

  it("every mission clears ≥40% under median governor", () => {
    for (const m of MISSIONS) {
      const s = runSeededBenchmark(m.id, SEEDS, "median");
      expect(s.clearRate, `${m.id} median clear ${s.clearRate}`).toBeGreaterThanOrEqual(0.4);
    }
  });

  it("every mission satisfies the trash clear floor", () => {
    for (const t of MISSION_THRESHOLDS) {
      // Use 25 seeds to match CI profile and tame variance.
      const seeds = Array.from({ length: 25 }, (_, i) => SEED + i * 7);
      const s = runSeededBenchmark(t.missionId, seeds, "trash");
      expect(
        s.clearRate,
        `${t.missionId} trash clear ${s.clearRate} < ${t.trashClearRateMin}`,
      ).toBeGreaterThanOrEqual(t.trashClearRateMin);
    }
  });
});
