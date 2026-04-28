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

export const weaponArchetypeSchema = z
  .object({
    id: z.enum(WEAPON_IDS),
    damage: z.number().int().positive(),
    pellets: z.number().int().positive(),
    fireRate: z.number().positive(),
    magSize: z.number().int().positive(),
    reloadMs: z.number().int().positive(),
    /** Half-cone spread in radians per shot. */
    spread: z.number().min(0),
    headshotBonus: z.number().min(0),
    critChance: z.number().min(0).max(1),
    critMultiplier: z.number().min(1),
    /** 0 = full armor applies; 1 = ignore armor entirely. */
    armorPierce: z.number().min(0).max(1),
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
