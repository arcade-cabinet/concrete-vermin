import { z } from "zod";

export const ARCHETYPE_IDS = [
  "rat",
  "roach",
  "pigeon",
  "raccoon",
  "seagull",
  "feral-cat",
  "sewer-fish",
  "street-dog",
  "goose",
  "boss-dumpster-bear",
  "boss-river-mutant",
  "boss-pigeon-king",
] as const;

export type ArchetypeId = (typeof ARCHETYPE_IDS)[number];

export const AI_BRAINS = [
  "ground-swarm",
  "wall-climber",
  "erratic-flyer",
  "dive-bomber",
  "lunger",
  "ambusher",
  "pop-up",
  "charger",
  "mixed-threat",
  "boss-scripted",
] as const;

export type AIBrain = (typeof AI_BRAINS)[number];

export const LOCOMOTIONS = ["ground", "wall", "flying", "amphibious", "mixed"] as const;
export type Locomotion = (typeof LOCOMOTIONS)[number];

export const archetypeSchema = z
  .object({
    id: z.enum(ARCHETYPE_IDS),
    brain: z.enum(AI_BRAINS),
    locomotion: z.enum(LOCOMOTIONS),
    baseStats: z.object({
      health: z.number().int().positive(),
      speed: z.number().positive(),
      contactDamage: z.number().int().nonnegative(),
      bounty: z.number().int().positive(),
      headshotMultiplier: z.number().min(1).max(8),
    }),
    hitbox: z.object({
      width: z.number().positive(),
      height: z.number().positive(),
      headOffset: z.object({ x: z.number(), y: z.number() }),
    }),
    spriteAtlas: z.string().min(1),
    audio: z.object({
      spawn: z.string().min(1),
      hit: z.string().min(1),
      death: z.string().min(1),
      idle: z.string().min(1).optional(),
    }),
    isBoss: z.boolean().default(false),
  })
  .strict();

export type Archetype = z.infer<typeof archetypeSchema>;
