import { z } from "zod";
import type { Rng } from "../rng";
import {
  planSpawnPattern,
  SPAWN_PATTERNS,
  type SpawnPattern,
  type SpawnTimingRecord,
} from "./patterns";

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
export type EncounterSpec = z.input<typeof encounterSpecSchema>;

export interface EncounterSpawnSchedule {
  variant: string;
  pattern: SpawnPattern;
  schedule: ReadonlyArray<Readonly<SpawnTimingRecord>>;
}

export interface Encounter {
  id: string;
  duration: number | undefined;
  isCheckpoint: boolean;
  schedules: ReadonlyArray<Readonly<EncounterSpawnSchedule>>;
}

export function composeEncounter(spec: EncounterSpec, rng: Rng): Readonly<Encounter> {
  const validated = encounterSpecSchema.parse(spec);
  const occurrence = new Map<string, number>();
  const schedules = validated.spawns.map((spawn) => {
    // Same variant can appear multiple times in one encounter with
    // different (pattern, count). Include all three plus an occurrence
    // counter so duplicate spec entries still get distinct streams.
    const key = `${spawn.variant}:${spawn.pattern}:${spawn.count}`;
    const idx = occurrence.get(key) ?? 0;
    occurrence.set(key, idx + 1);
    const child = rng.fork(`encounter:${validated.id}:${key}:${idx}`);
    const schedule = Object.freeze(
      planSpawnPattern(spawn.pattern, spawn.count, child).map((r) => Object.freeze(r)),
    );
    return Object.freeze({
      variant: spawn.variant,
      pattern: spawn.pattern,
      schedule,
    });
  });
  return Object.freeze({
    id: validated.id,
    duration: validated.duration,
    isCheckpoint: validated.isCheckpoint,
    schedules: Object.freeze(schedules),
  });
}
