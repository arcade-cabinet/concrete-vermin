/**
 * Lives in src/runtime/ so the runner (push) and the UI live region
 * (read) can both import without crossing the layering gate.
 */

export interface SRNarration {
  text: string;
  /** Hint at how loud / urgent — drives aria-live="polite" vs "assertive". */
  urgency: "polite" | "assertive";
}

const titleCase = (s: string): string =>
  s
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

export function srMissionStart(missionTitle: string, weapon: string): SRNarration {
  return {
    text: `Mission start: ${missionTitle}. Weapon equipped: ${titleCase(weapon)}.`,
    urgency: "polite",
  };
}

export function srBossSpawn(bossName: string): SRNarration {
  return {
    text: `${bossName} has appeared. Take cover and engage.`,
    urgency: "assertive",
  };
}

export function srMissionComplete(grade: string, score: number): SRNarration {
  return {
    text: `Mission complete. Grade: ${grade}. Score ${score.toLocaleString()}.`,
    urgency: "assertive",
  };
}

export function srMissionFailed(): SRNarration {
  return {
    text: "Mission failed. All lives lost.",
    urgency: "assertive",
  };
}

export function srBossDefeated(bossName: string): SRNarration {
  return {
    text: `${bossName} has fallen. Wave clear.`,
    urgency: "assertive",
  };
}

export function srEncounterCheckpoint(index: number, total: number): SRNarration {
  return {
    text: `Wave ${index} of ${total} cleared.`,
    urgency: "polite",
  };
}

/**
 * Pretty boss-archetype display name for narration. Falls back to the
 * raw id if unknown so missing entries surface as obvious bugs rather
 * than silent gaps.
 */
export function bossDisplayName(archetypeId: string): string {
  switch (archetypeId) {
    case "boss-dumpster-bear":
      return "The Dumpster Bear";
    case "boss-river-mutant":
      return "The River Mutant";
    case "boss-pigeon-king":
      return "The Pigeon King";
    default:
      return archetypeId;
  }
}
