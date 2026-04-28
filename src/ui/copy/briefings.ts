import { ALL_MISSION_LORE, getMissionLore, type MissionLore } from "../../sim/content/lore";

export function briefingFor(missionId: string): MissionLore {
  return getMissionLore(missionId);
}

export function blurbFor(missionId: string): string {
  return getMissionLore(missionId).blurb;
}

export const ALL_BRIEFINGS: ReadonlyArray<MissionLore> = ALL_MISSION_LORE;
