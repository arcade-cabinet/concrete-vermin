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

/** Reticle shape — drives both the on-screen visual and the hit-box for tap-to-fire. */
export const RETICLE_SHAPES = ["cross", "ring", "double", "wide", "diamond"] as const;
export type ReticleShape = (typeof RETICLE_SHAPES)[number];

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
    /**
     * Hit-box radius (sim units) for the click-as-reticle model. The
     * reticle visual is drawn at this radius and any vermin centered
     * within it on a tap counts as a hit. Larger weapons (shotgun,
     * sawed-off) have wider reticles; precise weapons (revolver,
     * tesla) have tight ones.
     */
    reticleRadius: z.number().positive().default(8),
    reticleShape: z.enum(RETICLE_SHAPES).default("cross"),
    /**
     * Optional charge-shot profile. When present, the player can hold
     * to charge before releasing for a powerful variant effect. The
     * effect key drives the effect logic in the runtime.
     */
    chargeProfile: z
      .object({
        maxChargeMs: z.number().int().positive(),
        shellsConsumed: z.number().int().positive(),
        effect: z.enum([
          "wide-spray",
          "auto-burst",
          "double-barrel",
          "mag-dump-cone",
          "arc-repeater",
          "napalm-pool",
        ] as const),
      })
      .optional(),
  })
  .strict();

export type WeaponArchetype = z.infer<typeof weaponArchetypeSchema>;
