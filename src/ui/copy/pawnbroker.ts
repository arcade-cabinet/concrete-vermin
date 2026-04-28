import { barks, pickBark, pickRumor } from "../../sim/content/lore";

export const ALL_PAWNBROKER_BARKS: ReadonlyArray<string> = barks.pawnbroker;
export const ALL_RUMORS: ReadonlyArray<string> = barks.rumorMill;

/** Convenience: roll a uniform [0,1) and pick a bark. */
export function randomBark(rng: () => number = Math.random): string {
  return pickBark(rng());
}

export function randomRumor(rng: () => number = Math.random): string {
  return pickRumor(rng());
}
