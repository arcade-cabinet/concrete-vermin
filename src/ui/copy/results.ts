import { endings } from "../../sim/content/lore";

export type Grade = "S+" | "S" | "A" | "B" | "C" | "D" | "F";

export function victoryLineFor(grade: Grade): string {
  const map = endings.victoryByGrade as Readonly<Record<string, string>>;
  return map[grade] ?? map.B ?? "Job's done.";
}

export type DefeatCause = "wipe" | "ammo" | "panic";
export function defeatLineFor(cause: DefeatCause): string {
  const map = endings.defeatByCause as Readonly<Record<string, string>>;
  return map[cause] ?? map.wipe ?? "He'll find another kid.";
}

export const goodEnd = endings.goodEnd;
export const badEnd = endings.badEnd;

/**
 * Compute a letter grade from accuracy + survival fraction. Pure;
 * deliberately stingy so S+ feels earned. Caller passes 0..1 fractions.
 */
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
