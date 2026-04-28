/**
 * Letter-grade scoring for the offline benchmark. Mirrors the in-game
 * grade ladder exposed via src/ui/copy/results.ts; lives here so the
 * sim layer can reason about grades without importing UI.
 */

export const GRADES = ["S+", "S", "A", "B", "C", "D", "F"] as const;
export type Grade = (typeof GRADES)[number];

const GRADE_RANK: Readonly<Record<Grade, number>> = Object.freeze({
  "S+": 6,
  S: 5,
  A: 4,
  B: 3,
  C: 2,
  D: 1,
  F: 0,
});

export function gradeFor(accuracy: number, survival: number): Grade {
  const score = accuracy * 0.6 + survival * 0.4;
  if (score >= 0.97) return "S+";
  if (score >= 0.9) return "S";
  if (score >= 0.8) return "A";
  if (score >= 0.7) return "B";
  if (score >= 0.6) return "C";
  if (score >= 0.5) return "D";
  return "F";
}

export function gradeAtLeast(actual: Grade, required: Grade): boolean {
  return GRADE_RANK[actual] >= GRADE_RANK[required];
}

/** Median grade from a list. Returns "F" on empty input. */
export function medianGrade(grades: ReadonlyArray<Grade>): Grade {
  if (grades.length === 0) return "F";
  const ranks = grades.map((g) => GRADE_RANK[g]).sort((a, b) => a - b);
  const mid = Math.floor(ranks.length / 2);
  // For even-length arrays we'd average; but grades are discrete, so
  // round down (the more conservative call).
  const r = ranks[mid] ?? 0;
  return (Object.keys(GRADE_RANK) as Grade[]).find((g) => GRADE_RANK[g] === r) ?? "F";
}
