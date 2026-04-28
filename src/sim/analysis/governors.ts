/**
 * Skill governors. Three deterministic player profiles the analysis
 * benchmark sweeps each mission against. The trio brackets the
 * playable population: perfect = upper bound, median = target audience,
 * trash = lower bound.
 *
 * A governor is just a set of dimensionless coefficients the benchmark
 * applies to per-shot accuracy, reaction time, reload cadence, and
 * panic-shot probability. Pure data — no RNG, no I/O.
 */

export const GOVERNORS = ["perfect", "median", "trash"] as const;
export type Governor = (typeof GOVERNORS)[number];

export interface GovernorProfile {
  /** Per-shot probability of landing on the intended target (0..1). */
  accuracy: number;
  /** Per-shot probability the hit is a headshot, given it landed (0..1). */
  headshotRate: number;
  /** Reaction latency in seconds before the player engages a new spawn. */
  reactionS: number;
  /** Probability of reloading before mag-empty (wastes shells, drops streak). */
  prematureReloadProb: number;
  /** Probability of panic-firing at empty space (counts as a miss). */
  panicShotProb: number;
  /** Reload completion ratio: 1.0 = always finishes; <1 = some interrupted reloads. */
  reloadCompletion: number;
}

const PROFILES: Readonly<Record<Governor, Readonly<GovernorProfile>>> = Object.freeze({
  perfect: Object.freeze({
    accuracy: 1.0,
    headshotRate: 0.85,
    reactionS: 0.06,
    prematureReloadProb: 0.0,
    panicShotProb: 0.0,
    reloadCompletion: 1.0,
  }),
  median: Object.freeze({
    accuracy: 0.75,
    headshotRate: 0.35,
    reactionS: 0.25,
    prematureReloadProb: 0.06,
    panicShotProb: 0.04,
    reloadCompletion: 0.97,
  }),
  trash: Object.freeze({
    accuracy: 0.5,
    headshotRate: 0.1,
    reactionS: 0.6,
    prematureReloadProb: 0.18,
    panicShotProb: 0.15,
    reloadCompletion: 0.85,
  }),
});

export function getGovernor(g: Governor): Readonly<GovernorProfile> {
  return PROFILES[g];
}
