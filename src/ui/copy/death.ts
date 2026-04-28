import { deathLineFor, deathLines } from "../../sim/content/lore";

export const ALL_DEATH_LINES = deathLines;

/**
 * Look up the death line for the archetype that killed the player, with
 * a graceful "wipe" fallback. Pass the archetype id from the killing
 * vermin (or "wipe" for an out-of-time/out-of-shells loss).
 */
export function killedByLine(causeOrArchetype: string): string {
  return deathLineFor(causeOrArchetype);
}
