/**
 * Parameter sweeps. Walk a value range and re-run the benchmark at each
 * step; return the trajectory so a designer (or the autobalance) can
 * see where the mission-grade curve breaks.
 *
 * Sweeps are a thin orchestration layer over benchmarks.ts — they don't
 * mutate any source data; they only compose runs.
 */

import { runSeededBenchmark, type BenchmarkSummary } from "./benchmarks";
import type { Governor } from "./governors";

export type SweepShape = "weapon-damage" | "vermin-health-mul" | "vermin-speed-mul";

export interface SweepStep {
  /** The value the sweep was at when this point was taken. */
  value: number;
  summary: BenchmarkSummary;
}

export interface SweepResult {
  shape: SweepShape;
  missionId: string;
  governor: Governor;
  steps: ReadonlyArray<SweepStep>;
}

export interface SweepOptions {
  shape: SweepShape;
  missionId: string;
  seeds: ReadonlyArray<number>;
  governor: Governor;
  range: readonly [number, number];
  step: number;
}

/**
 * Sweep a parameter range and return per-step summaries.
 *
 * Today the sweep is a thin shell — the benchmark itself doesn't yet
 * accept the swept parameter as input (vermin trait overrides require
 * a deeper hook into the variant registry; weapon damage requires
 * applying a multiplier to the tuned weapon). The shape value is
 * recorded with each step for charting and for future overrides;
 * downstream consumers (autobalance, locking) treat the trajectory as
 * read-only data.
 */
export function sweep(opts: SweepOptions): SweepResult {
  const { shape, missionId, seeds, governor, range, step } = opts;
  if (step <= 0) throw new Error("sweep: step must be positive");
  const [lo, hi] = range;
  if (hi < lo) throw new Error("sweep: range must be ascending");
  const steps: SweepStep[] = [];
  for (let v = lo; v <= hi + 1e-9; v += step) {
    const summary = runSeededBenchmark(missionId, seeds, governor);
    steps.push({ value: round(v, 4), summary });
  }
  return Object.freeze({ shape, missionId, governor, steps: Object.freeze(steps) });
}

function round(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
