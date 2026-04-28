import type { Rng } from "../rng";

/**
 * Eight named spawn patterns from design Section 4. Pure functions —
 * `(count, rng) -> SpawnTimingRecord[]`. Patterns describe WHERE and
 * WHEN spawns appear within the encounter window; not what species
 * (that's resolved one level up at composeEncounter time).
 *
 * Position values are stage-relative [0..1] in both axes so renderers
 * can map onto any encounter zone size. Velocity is a unit hint for
 * the AI brain — magnitude is decided by the brain.
 */

export const SPAWN_PATTERNS = [
  "left-flood",
  "right-flood",
  "ceiling-drop",
  "pop-from-vent",
  "dive-from-sky",
  "surface-from-grate",
  "mixed-wave",
  "boss-scripted",
] as const;
export type SpawnPattern = (typeof SPAWN_PATTERNS)[number];

export interface SpawnTimingRecord {
  /** Seconds from encounter ARMING -> ACTIVE transition. */
  delayS: number;
  /** Stage-relative spawn position [0..1] horizontally and vertically. */
  position: { x: number; y: number };
  /** Initial velocity hint for the AI brain. */
  velocity: { x: number; y: number };
  /** Spawn id within the encounter for stable ordering. */
  index: number;
}

const STAGGER_S = 0.18;
const FLOOD_BOTTOM_Y = 0.92;
const CEILING_TOP_Y = 0.05;
const VENT_HEIGHT_Y = 0.78;
const GRATE_Y = 0.95;
const SKY_Y = 0.1;
const SPAWN_COUNT_CAP = 64;

const jitter = (rng: Rng, amplitude: number): number => (rng.next() * 2 - 1) * amplitude;

const patternFns: Record<SpawnPattern, (count: number, rng: Rng) => SpawnTimingRecord[]> = {
  "left-flood": (count, rng) =>
    Array.from({ length: count }, (_, i) => ({
      delayS: i * STAGGER_S,
      position: { x: 0 + jitter(rng, 0.04), y: FLOOD_BOTTOM_Y + jitter(rng, 0.04) },
      velocity: { x: 1, y: 0 },
      index: i,
    })),
  "right-flood": (count, rng) =>
    Array.from({ length: count }, (_, i) => ({
      delayS: i * STAGGER_S,
      position: { x: 1 - jitter(rng, 0.04), y: FLOOD_BOTTOM_Y + jitter(rng, 0.04) },
      velocity: { x: -1, y: 0 },
      index: i,
    })),
  "ceiling-drop": (count, rng) =>
    Array.from({ length: count }, (_, i) => ({
      delayS: i * (STAGGER_S * 0.6),
      position: { x: 0.1 + (i / Math.max(1, count - 1)) * 0.8, y: CEILING_TOP_Y },
      velocity: { x: 0, y: 1 + jitter(rng, 0.2) },
      index: i,
    })),
  "pop-from-vent": (count, rng) =>
    Array.from({ length: count }, (_, i) => ({
      delayS: i * STAGGER_S * 1.4,
      position: { x: 0.15 + rng.next() * 0.7, y: VENT_HEIGHT_Y },
      velocity: { x: jitter(rng, 0.4), y: -0.3 },
      index: i,
    })),
  "dive-from-sky": (count, rng) =>
    Array.from({ length: count }, (_, i) => ({
      delayS: i * STAGGER_S * 1.2,
      position: { x: rng.next(), y: SKY_Y },
      velocity: { x: jitter(rng, 0.5), y: 1 },
      index: i,
    })),
  "surface-from-grate": (count, rng) =>
    Array.from({ length: count }, (_, i) => ({
      delayS: i * STAGGER_S,
      position: { x: 0.1 + rng.next() * 0.8, y: GRATE_Y },
      velocity: { x: jitter(rng, 0.3), y: -0.6 },
      index: i,
    })),
  "mixed-wave": (count, rng) =>
    Array.from({ length: count }, (_, i) => {
      const fromLeft = i % 2 === 0;
      return {
        delayS: i * STAGGER_S * 0.6,
        position: {
          x: fromLeft ? 0 + jitter(rng, 0.05) : 1 - jitter(rng, 0.05),
          y: FLOOD_BOTTOM_Y + jitter(rng, 0.06),
        },
        velocity: { x: fromLeft ? 1 : -1, y: 0 },
        index: i,
      };
    }),
  "boss-scripted": (count) =>
    Array.from({ length: count }, (_, i) => ({
      delayS: i * 0.5,
      position: { x: 0.5, y: 0.5 },
      velocity: { x: 0, y: 0 },
      index: i,
    })),
};

export function planSpawnPattern(
  pattern: SpawnPattern,
  count: number,
  rng: Rng,
): SpawnTimingRecord[] {
  if (count <= 0) return [];
  if (count > SPAWN_COUNT_CAP) {
    throw new Error(`planSpawnPattern: count ${count} exceeds ${SPAWN_COUNT_CAP}-cap`);
  }
  const fn = patternFns[pattern];
  return fn(count, rng);
}
