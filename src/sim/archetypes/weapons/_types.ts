import { z } from "zod";

export const WEAPON_IDS = [
  "shotgun",
  "revolver",
  "smg",
  "sawed-off",
  "flamethrower",
  "tesla",
] as const;
export type WeaponId = (typeof WEAPON_IDS)[number];

export const PROJECTILE_TYPES = ["pellet", "bullet", "rapid-bullet", "flame", "arc"] as const;
export type ProjectileType = (typeof PROJECTILE_TYPES)[number];

export const TRAIL_TYPES = [
  "smoke-puff",
  "linear-tracer",
  "muzzle-burst",
  "plume",
  "lightning",
] as const;
export type TrailType = (typeof TRAIL_TYPES)[number];

/**
 * Frozen weapon archetype. Audio + sprite refs are strings the
 * render/audio bridges resolve at load time. The combat-relevant
 * stats live on the same record so the analysis sweeper can mutate a
 * single param at a time.
 */
export const weaponArchetypeSchema = z
  .object({
    id: z.enum(WEAPON_IDS),
    /** Per-projectile damage. */
    damage: z.number().int().positive(),
    /** Pellets per trigger pull (1 for single-fire, 8 for shotgun). */
    pellets: z.number().int().positive(),
    /** Shots per second (cap on rapid-fire). */
    fireRate: z.number().positive(),
    magSize: z.number().int().positive(),
    reloadMs: z.number().int().positive(),
    /** Half-cone spread in radians per shot. */
    spread: z.number().min(0),
    /** Additive headshot bonus on top of target's headshotMultiplier. */
    headshotBonus: z.number().min(0),
    /** Base crit chance [0..1]. */
    critChance: z.number().min(0).max(1),
    critMultiplier: z.number().min(1),
    /** Armor pierce [0..1] — 0 = full armor applies, 1 = ignore armor. */
    armorPierce: z.number().min(0).max(1),
    /** Effective range cap in stage units. */
    rangeMax: z.number().positive(),
    projectileType: z.enum(PROJECTILE_TYPES),
    trailType: z.enum(TRAIL_TYPES),
    spriteAtlas: z.string().min(1),
    audio: z.object({
      fire: z.string().min(1),
      reload: z.string().min(1),
      empty: z.string().min(1),
    }),
  })
  .strict();

export type WeaponArchetype = z.infer<typeof weaponArchetypeSchema>;
