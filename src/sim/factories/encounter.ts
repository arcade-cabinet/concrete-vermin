import { z } from "zod";
import type { Rng } from "../rng";

/**
 * Eight named spawn patterns from design Section 4. Pure functions —
 * `(zone, count, rng) -> SpawnTimingRecord[]`. Patterns describe WHERE and
 * WHEN spawns appear within the encounter window; not what species (that
 * is the variant id, resolved one level up at composeEncounter time).
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
  "mixed-wave": (count, rng) => {
    // Half left flood, half right flood, alternating stagger.
    return Array.from({ length: count }, (_, i) => {
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
    });
  },
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
  if (count > 64) throw new Error(`planSpawnPattern: count ${count} exceeds 64-cap`);
  const fn = patternFns[pattern];
  return fn(count, rng);
}

export const spawnSpecSchema = z
  .object({
    variant: z.string().min(1),
    count: z.number().int().positive().max(64),
    pattern: z.enum(SPAWN_PATTERNS),
  })
  .strict();

export const encounterSpecSchema = z
  .object({
    id: z.string().min(1),
    spawns: z.array(spawnSpecSchema).min(1),
    duration: z.number().positive().optional(),
    isCheckpoint: z.boolean().default(false),
  })
  .strict();

export type SpawnSpec = z.infer<typeof spawnSpecSchema>;
/** Input form — fields with defaults are optional from the caller's POV. */
export type EncounterSpec = z.input<typeof encounterSpecSchema>;

export interface EncounterSpawnSchedule {
  /** Variant id resolved at composition time. */
  variant: string;
  /** Pattern that produced this entry. */
  pattern: SpawnPattern;
  /** Per-spawn timing + position + velocity. */
  schedule: ReadonlyArray<Readonly<SpawnTimingRecord>>;
}

export interface Encounter {
  id: string;
  duration: number | undefined;
  isCheckpoint: boolean;
  schedules: ReadonlyArray<Readonly<EncounterSpawnSchedule>>;
}

export function composeEncounter(spec: EncounterSpec, rng: Rng): Encounter {
  const validated = encounterSpecSchema.parse(spec);
  const schedules = validated.spawns.map((spawn) => {
    const child = rng.fork(`encounter:${validated.id}:${spawn.variant}`);
    const schedule = planSpawnPattern(spawn.pattern, spawn.count, child).map((r) =>
      Object.freeze(r),
    );
    return Object.freeze({
      variant: spawn.variant,
      pattern: spawn.pattern,
      schedule,
    });
  });
  return {
    id: validated.id,
    duration: validated.duration,
    isCheckpoint: validated.isCheckpoint,
    schedules: Object.freeze(schedules),
  };
}
