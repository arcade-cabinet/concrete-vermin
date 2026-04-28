import { z } from "zod";
import { encounterSpecSchema } from "./encounter";
import { SPAWN_PATTERNS } from "./patterns";

export const ACT_IDS = ["streets", "underworld", "above"] as const;
export type ActId = (typeof ACT_IDS)[number];

export const WEAPON_ARCHETYPES = [
  "shotgun",
  "revolver",
  "smg",
  "sawed-off",
  "flamethrower",
  "tesla",
] as const;
export type WeaponArchetype = (typeof WEAPON_ARCHETYPES)[number];

export const collectibleSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    /** Anchor name in the diorama where the artifact will be placed. */
    anchor: z.string().min(1),
    /** Pulpy paragraph(s) of prose; rendered in ArtifactReader overlay. */
    prose: z.string().min(20),
    /** Optional READ MORE expanded body (longer scrollable content). */
    extended: z.string().optional(),
  })
  .strict();

export const interstitialSchema = z
  .object({
    title: z.string().min(1),
    body: z.string().min(20),
    skipAfterMs: z.number().int().nonnegative().default(600),
  })
  .strict();

export const cutsceneSchema = z
  .object({
    interstitial: interstitialSchema,
    collectibles: z.array(collectibleSchema).default([]),
  })
  .strict();

/**
 * Mid-mission dynamic event triggers. The runner inspects each event's
 * trigger every tick after the kill / encounter accounting; when a
 * trigger fires for the first time, the corresponding effect publishes
 * to the store (boss-bark string, surprise-wave spawn injection, or
 * environmental-hazard label). Each event fires at most once per
 * mission run.
 */
export const missionEventTriggerSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("at-encounter-start"),
      /** 0-based encounter index. Fires when that encounter becomes active. */
      index: z.number().int().nonnegative(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("at-kill-count"),
      /** Cumulative mission kill count threshold (>=). */
      threshold: z.number().int().positive(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("at-time"),
      /** Mission seconds (sim time). */
      seconds: z.number().nonnegative(),
    })
    .strict(),
]);

export const missionEventEffectSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("boss-bark"),
      /** HUD + SR string. Should be short (<=80 chars to fit one HUD line). */
      text: z.string().min(2).max(120),
    })
    .strict(),
  z
    .object({
      kind: z.literal("environmental-hazard"),
      /** HUD label (e.g., "PIPE BURST", "BLACKOUT", "CROSSWIND"). */
      label: z.string().min(2).max(40),
      /** Optional flavor sub-line. */
      detail: z.string().min(2).max(120).optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("surprise-wave"),
      /** Variant id from the bestiary. */
      variant: z.string().min(1),
      /** Number of additional vermin to spawn. */
      count: z.number().int().positive().max(20),
      /** Spawn pattern key (must be one supported by composeEncounter). */
      pattern: z.enum(SPAWN_PATTERNS).default("left-flood"),
    })
    .strict(),
]);

export const missionEventSchema = z
  .object({
    id: z.string().min(1),
    trigger: missionEventTriggerSchema,
    effect: missionEventEffectSchema,
  })
  .strict();

export const missionSpecSchema = z
  .object({
    id: z.string().min(1),
    act: z.enum(ACT_IDS),
    /** Default loadout — player may swap in pawn shop. */
    weapon: z.enum(WEAPON_ARCHETYPES),
    cutscene: cutsceneSchema,
    encounters: z.array(encounterSpecSchema).min(1),
    /**
     * Mid-mission dynamic events (boss-bark, environmental-hazard,
     * surprise-wave). Each fires at most once. Optional; missions
     * without events run as before.
     */
    events: z.array(missionEventSchema).default([]),
    /** Optional designer-authored seed for replay. */
    seed: z.number().int().optional(),
    /**
     * Lives the player gets to clear this mission. Defaults to 3.
     * Boss missions and the tutorial extend to 5 so a single bad
     * spawn doesn't ice the run.
     */
    livesAllowance: z.number().int().positive().max(9).default(3),
    /**
     * Cash awarded on first clear. Optional; falls back to a per-act
     * default in the runner (Streets 100 / Underworld 200 / Above 350
     * for boss tiers).
     */
    cashAward: z.number().int().nonnegative().optional(),
  })
  .strict();

export type Collectible = z.infer<typeof collectibleSchema>;
export type Interstitial = z.input<typeof interstitialSchema>;
export type Cutscene = z.input<typeof cutsceneSchema>;
export type MissionEventTrigger = z.infer<typeof missionEventTriggerSchema>;
export type MissionEventEffect = z.infer<typeof missionEventEffectSchema>;
export type MissionEvent = z.infer<typeof missionEventSchema>;
export type MissionSpec = z.input<typeof missionSpecSchema>;
export type Mission = z.infer<typeof missionSpecSchema>;

export function defineMission(spec: MissionSpec): Mission {
  const result = missionSpecSchema.safeParse(spec);
  if (!result.success) {
    throw new Error(
      `defineMission: invalid mission "${spec.id ?? "<unknown>"}": ${result.error.message}`,
    );
  }
  return Object.freeze(result.data);
}
