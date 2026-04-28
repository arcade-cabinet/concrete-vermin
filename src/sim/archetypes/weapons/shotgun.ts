import { type WeaponArchetype, weaponArchetypeSchema } from "./_types";

export const shotgun: Readonly<WeaponArchetype> = Object.freeze(
  weaponArchetypeSchema.parse({
    id: "shotgun",
    damage: 3,
    pellets: 8,
    fireRate: 1.2,
    magSize: 6,
    reloadMs: 1400,
    spread: 0.18,
    headshotBonus: 0.25,
    critChance: 0.05,
    critMultiplier: 2,
    armorPierce: 0.2,
    rangeMax: 220,
    projectileType: "pellet",
    trailType: "smoke-puff",
    spriteAtlas: "weapons/shotgun",
    audio: {
      fire: "sfx/weapon/shotgun-fire",
      reload: "sfx/weapon/shotgun-reload",
      empty: "sfx/weapon/empty-click",
    },
    reticleRadius: 14,
    reticleShape: "wide",
  }),
);
