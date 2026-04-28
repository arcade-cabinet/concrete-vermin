/**
 * Lock-in recommendations. After a variant has been benchmarked across
 * enough recent sessions with consistent grade distributions, the
 * autobalance should leave it alone. This module turns a benchmark
 * history into a STABLE / UNSTABLE / UNMEASURED label.
 *
 * Pure functions. The history persistence is a CV-RELEASE-INFRA
 * concern — this module only consumes it.
 */

import type { BenchmarkSummary } from "./benchmarks";
import type { Grade } from "./scoring";

export type LockState = "STABLE" | "UNSTABLE" | "UNMEASURED";

export interface LockRecommendation {
  missionId: string;
  state: LockState;
  /** How many recent runs were considered (caps at history length). */
  sampleSize: number;
  /** Standard deviation of the dominant grade's frequency across runs. */
  variance: number;
  /** Most-frequent grade in the considered window, or null when UNMEASURED. */
  dominantGrade: Grade | null;
}

const MIN_SAMPLES = 3;
const VARIANCE_STABLE_THRESHOLD = 0.15;

/**
 * Given a chronological history of benchmark summaries (oldest first),
 * derive a lock recommendation per mission. Only the most recent
 * `windowSize` summaries per mission are considered.
 */
export function deriveLockRecommendations(
  history: ReadonlyArray<BenchmarkSummary>,
  windowSize = 5,
): ReadonlyArray<LockRecommendation> {
  const byMission = new Map<string, BenchmarkSummary[]>();
  for (const s of history) {
    const list = byMission.get(s.missionId) ?? [];
    list.push(s);
    byMission.set(s.missionId, list);
  }
  const out: LockRecommendation[] = [];
  for (const [missionId, list] of byMission) {
    const window = list.slice(-windowSize);
    if (window.length < MIN_SAMPLES) {
      out.push({
        missionId,
        state: "UNMEASURED",
        sampleSize: window.length,
        variance: 0,
        dominantGrade: null,
      });
      continue;
    }
    const dominantGrades = window.map((s) => dominantGradeOf(s));
    const dominant = mode(dominantGrades);
    const matchFrac = dominantGrades.filter((g) => g === dominant).length / window.length;
    const variance = 1 - matchFrac;
    out.push({
      missionId,
      state: variance <= VARIANCE_STABLE_THRESHOLD ? "STABLE" : "UNSTABLE",
      sampleSize: window.length,
      variance: round(variance, 3),
      dominantGrade: dominant,
    });
  }
  return Object.freeze(out);
}

function dominantGradeOf(s: BenchmarkSummary): Grade {
  let best: Grade = "F";
  let bestCount = -1;
  for (const [grade, count] of Object.entries(s.gradeHistogram) as [Grade, number][]) {
    if (count > bestCount) {
      best = grade;
      bestCount = count;
    }
  }
  return best;
}

function mode<T>(xs: ReadonlyArray<T>): T {
  const counts = new Map<T, number>();
  let best: T = xs[0] as T;
  let bestCount = 0;
  for (const x of xs) {
    const c = (counts.get(x) ?? 0) + 1;
    counts.set(x, c);
    if (c > bestCount) {
      best = x;
      bestCount = c;
    }
  }
  return best;
}

function round(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}
