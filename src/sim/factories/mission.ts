import { z } from "zod";
import { encounterSpecSchema } from "./encounter";

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

export const missionSpecSchema = z
  .object({
    id: z.string().min(1),
    act: z.enum(ACT_IDS),
    /** Default loadout — player may swap in pawn shop. */
    weapon: z.enum(WEAPON_ARCHETYPES),
    cutscene: cutsceneSchema,
    encounters: z.array(encounterSpecSchema).min(1),
    /** Optional designer-authored seed for replay. */
    seed: z.number().int().optional(),
  })
  .strict();

export type Collectible = z.infer<typeof collectibleSchema>;
export type Interstitial = z.input<typeof interstitialSchema>;
export type Cutscene = z.input<typeof cutsceneSchema>;
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
