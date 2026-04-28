export const GRADE_THRESHOLDS = Object.freeze({
  F: 0,
  D: 0.3,
  C: 0.45,
  B: 0.6,
  A: 0.75,
  S: 0.9,
  "S+": 1.05,
} as const);

export type Grade = keyof typeof GRADE_THRESHOLDS;
