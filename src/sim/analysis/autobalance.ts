/**
 * Autobalance: propose nudges to variant/weapon/mod stats so an
 * out-of-spec mission moves into spec. The proposals are bounded
 * (clamped to plausible ranges) and never applied here — this module
 * returns a plan; a downstream tool decides whether to commit it.
 *
 * Pure functions. The caller is responsible for the "refuse if working
 * tree dirty" guard (it's a git-state concern outside src/sim).
 */

import { runSeededBenchmark } from "./benchmarks";
import { estimateVariantDrift } from "./effects";
import type { Governor } from "./governors";
import { gradeAtLeast } from "./scoring";
import { getThreshold } from "./thresholds";

export type ProposalKind =
  | "variant-health-mul"
  | "variant-speed-mul"
  | "weapon-damage-mul"
  | "encounter-spawn-count";

export interface Proposal {
  kind: ProposalKind;
  /** The thing being adjusted. variant id, weapon id, or encounter id. */
  target: string;
  /** Current value. */
  from: number;
  /** Proposed value, already clamped. */
  to: number;
  /** Plain-English reason: what the benchmark observed. */
  reason: string;
}

export interface AutobalancePlan {
  missionId: string;
  inSpec: boolean;
  proposals: ReadonlyArray<Proposal>;
}

/**
 * Bounds on a single autobalance step. Per-iteration, never compounded.
 */
const BOUNDS = Object.freeze({
  variantHealthMulMin: 0.5,
  variantHealthMulMax: 2.0,
  variantSpeedMulMin: 0.7,
  variantSpeedMulMax: 1.4,
  weaponDamageMulMin: 0.8,
  weaponDamageMulMax: 1.25,
  spawnCountDelta: 1,
});

export interface AutobalanceOptions {
  missionId: string;
  seeds: ReadonlyArray<number>;
  governor: Governor;
  /** Optional already-applied weapon/mod context (mod ids). */
  modIds?: ReadonlyArray<string>;
}

/**
 * Run a single autobalance iteration: benchmark the mission, compare
 * against thresholds, propose at most one nudge per dimension that's
 * out of spec.
 */
export function proposeAutobalance(opts: AutobalanceOptions): AutobalancePlan {
  const { missionId, seeds, governor, modIds = [] } = opts;
  const summary = runSeededBenchmark(missionId, seeds, governor, modIds);
  const threshold = getThreshold(missionId);

  const proposals: Proposal[] = [];

  // 1. Accuracy out of band → adjust weapon damage.
  if (summary.meanAccuracy < threshold.parAccuracy - 0.05) {
    proposals.push({
      kind: "weapon-damage-mul",
      target: "weapon",
      from: 1,
      to: clamp(1.1, BOUNDS.weaponDamageMulMin, BOUNDS.weaponDamageMulMax),
      reason: `Mean accuracy ${summary.meanAccuracy.toFixed(2)} below par ${threshold.parAccuracy} — bump weapon damage.`,
    });
  } else if (summary.meanAccuracy > threshold.parAccuracy + 0.1) {
    proposals.push({
      kind: "weapon-damage-mul",
      target: "weapon",
      from: 1,
      to: clamp(0.92, BOUNDS.weaponDamageMulMin, BOUNDS.weaponDamageMulMax),
      reason: `Mean accuracy ${summary.meanAccuracy.toFixed(2)} above par — trim weapon damage.`,
    });
  }

  // 2. Duration out of band → tweak spawn count.
  const durDelta = summary.meanDurationS - threshold.parDurationS;
  if (Math.abs(durDelta) > threshold.parDurationWindowS) {
    const sign = durDelta > 0 ? -1 : 1; // too long → fewer spawns
    proposals.push({
      kind: "encounter-spawn-count",
      target: "encounter",
      from: 0,
      to: sign * BOUNDS.spawnCountDelta,
      reason: `Mean duration ${summary.meanDurationS.toFixed(1)}s vs par ${threshold.parDurationS}±${threshold.parDurationWindowS} — ${sign > 0 ? "add" : "remove"} a spawn.`,
    });
  }

  // 3. Median grade below floor → ease vermin health.
  const dominant = dominantGrade(summary.gradeHistogram);
  if (!gradeAtLeast(dominant, threshold.medianGradeMin)) {
    const drift = estimateVariantDrift("rat", 0.9, 1);
    proposals.push({
      kind: "variant-health-mul",
      target: "rat",
      from: 1,
      to: clamp(0.9, BOUNDS.variantHealthMulMin, BOUNDS.variantHealthMulMax),
      reason: `Dominant grade ${dominant} below floor ${threshold.medianGradeMin}; estimated drift ${drift.toFixed(2)} — soften baseline rat.`,
    });
  }

  return Object.freeze({
    missionId,
    inSpec: proposals.length === 0,
    proposals: Object.freeze(proposals),
  });
}

function dominantGrade(
  histogram: Readonly<Record<string, number>>,
): "S+" | "S" | "A" | "B" | "C" | "D" | "F" {
  let best: keyof typeof histogram = "F";
  let bestCount = -1;
  for (const [g, c] of Object.entries(histogram)) {
    if (c > bestCount) {
      best = g;
      bestCount = c;
    }
  }
  return best as "S+" | "S" | "A" | "B" | "C" | "D" | "F";
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}
