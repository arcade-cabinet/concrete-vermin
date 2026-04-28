import { z } from "zod";
import type { Rng } from "../rng";
import {
  planSpawnPattern,
  SPAWN_PATTERNS,
  type SpawnPattern,
  type SpawnTimingRecord,
} from "./patterns";

/**
 * Encounter factory. Composes spawn-timing records (from patterns.ts)
 * with variant data into an immutable encounter spec.
 */

export { planSpawnPattern, SPAWN_PATTERNS, type SpawnPattern, type SpawnTimingRecord };

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
