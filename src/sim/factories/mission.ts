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

// Each event fires at most once per mission run; the runner evaluates
// triggers every tick after the kill/encounter accounting.
export const missionEventTriggerSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("at-encounter-start"),
      index: z.number().int().nonnegative(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("at-kill-count"),
      threshold: z.number().int().positive(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("at-time"),
      seconds: z.number().nonnegative(),
    })
    .strict(),
]);

export const missionEventEffectSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("boss-bark"),
      // 120-char cap keeps the bark on a single HUD line at 12px mono.
      text: z.string().min(2).max(120),
    })
    .strict(),
  z
    .object({
      kind: z.literal("environmental-hazard"),
      label: z.string().min(2).max(40),
      detail: z.string().min(2).max(120).optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("surprise-wave"),
      variant: z.string().min(1),
      // 20-cap is the same hard limit composeEncounter enforces; mirror
      // it here to fail at defineMission rather than at runtime.
      count: z.number().int().positive().max(20),
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
    weapon: z.enum(WEAPON_ARCHETYPES),
    cutscene: cutsceneSchema,
    encounters: z.array(encounterSpecSchema).min(1),
    events: z.array(missionEventSchema).default([]),
    seed: z.number().int().optional(),
    // 9-life ceiling exists so a designer error (typo of 99) can't
    // turn a mission into an unkillable run.
    livesAllowance: z.number().int().positive().max(9).default(3),
    cashAward: z.number().int().nonnegative().optional(),
    secret: z.boolean().default(false),
    sGradeUnlockFrom: z.string().min(1).optional(),
    // Marks the canonical first-run tutorial mission. Designer-set so
    // catalog tests can carve out tutorial-only allowances (reduced
    // composition palette, easier balance) without hard-coding the id.
    tutorial: z.boolean().default(false),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.secret && !data.sGradeUnlockFrom) {
      ctx.addIssue({
        code: "custom",
        message: "secret missions must declare sGradeUnlockFrom",
        path: ["sGradeUnlockFrom"],
      });
    }
  });

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
