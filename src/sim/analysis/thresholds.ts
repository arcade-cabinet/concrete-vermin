/**
 * Per-mission acceptance bands. The analysis benchmark fails CI if a
 * mission drifts outside these. Source values cross-checked against
 * docs/BALANCE.md "Per-mission par table" — when the doc moves, this
 * file moves with it (treat them as one unit).
 *
 * Pure data; no I/O.
 */

import type { Grade } from "./scoring";

export interface MissionThreshold {
  missionId: string;
  /** Target accuracy under the median governor [0..1]. */
  parAccuracy: number;
  /** Target duration in sim seconds (median ± window). */
  parDurationS: number;
  parDurationWindowS: number;
  /** Minimum median grade allowed under the median governor. */
  medianGradeMin: Grade;
  /** Trash-governor clear rate floor [0..1]. */
  trashClearRateMin: number;
  /** Perfect-governor median grade allowed (e.g. boss missions cap at A). */
  perfectGradeMin: Grade;
}

export const MISSION_THRESHOLDS: ReadonlyArray<Readonly<MissionThreshold>> = Object.freeze([
  {
    missionId: "streets-01-bodega",
    parAccuracy: 0.85,
    parDurationS: 27,
    parDurationWindowS: 8,
    medianGradeMin: "A",
    trashClearRateMin: 0.4,
    perfectGradeMin: "S",
  },
  {
    missionId: "streets-02-alley",
    parAccuracy: 0.78,
    parDurationS: 40,
    parDurationWindowS: 12,
    medianGradeMin: "B",
    trashClearRateMin: 0.4,
    perfectGradeMin: "S",
  },
  {
    missionId: "streets-03-rooftop",
    parAccuracy: 0.7,
    parDurationS: 32,
    parDurationWindowS: 10,
    medianGradeMin: "B",
    trashClearRateMin: 0.4,
    perfectGradeMin: "S",
  },
  {
    missionId: "streets-04-dumpster-bear",
    parAccuracy: 0.65,
    parDurationS: 75,
    parDurationWindowS: 18,
    medianGradeMin: "B",
    trashClearRateMin: 0.4,
    perfectGradeMin: "A",
  },
  {
    missionId: "underworld-05-subway",
    parAccuracy: 0.72,
    parDurationS: 22,
    parDurationWindowS: 10,
    medianGradeMin: "B",
    trashClearRateMin: 0.4,
    perfectGradeMin: "S",
  },
  {
    missionId: "underworld-06-sewer-shallows",
    parAccuracy: 0.68,
    parDurationS: 72,
    parDurationWindowS: 18,
    medianGradeMin: "B",
    trashClearRateMin: 0.4,
    perfectGradeMin: "S",
  },
  {
    missionId: "underworld-07-river-mutant",
    parAccuracy: 0.75,
    parDurationS: 80,
    parDurationWindowS: 15,
    medianGradeMin: "A",
    trashClearRateMin: 0.4,
    perfectGradeMin: "A",
  },
  {
    missionId: "above-08-rooftop-chase",
    parAccuracy: 0.66,
    parDurationS: 45,
    parDurationWindowS: 15,
    medianGradeMin: "B",
    trashClearRateMin: 0.4,
    perfectGradeMin: "S",
  },
  {
    missionId: "above-09-pigeon-king",
    parAccuracy: 0.7,
    parDurationS: 100,
    parDurationWindowS: 20,
    medianGradeMin: "A",
    trashClearRateMin: 0.4,
    perfectGradeMin: "S+",
  },
]);

const BY_ID: ReadonlyMap<string, Readonly<MissionThreshold>> = new Map(
  MISSION_THRESHOLDS.map((t) => [t.missionId, t]),
);

export function getThreshold(missionId: string): Readonly<MissionThreshold> {
  const t = BY_ID.get(missionId);
  if (!t) throw new Error(`getThreshold: unknown mission id "${missionId}"`);
  return t;
}
