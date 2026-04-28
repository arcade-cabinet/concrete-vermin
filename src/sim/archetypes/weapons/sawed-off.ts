import { type WeaponArchetype, weaponArchetypeSchema } from "./_types";

export const sawedOff: Readonly<WeaponArchetype> = Object.freeze(
  weaponArchetypeSchema.parse({
    id: "sawed-off",
    damage: 4,
    pellets: 12,
    fireRate: 0.7,
    magSize: 2,
    reloadMs: 1900,
    spread: 0.32,
    headshotBonus: 0.3,
    critChance: 0.05,
    critMultiplier: 2,
    armorPierce: 0.1,
    rangeMax: 130,
    projectileType: "pellet",
    trailType: "smoke-puff",
    spriteAtlas: "weapons/sawed-off",
    audio: {
      fire: "sfx/weapon/sawed-off-fire",
      reload: "sfx/weapon/sawed-off-reload",
      empty: "sfx/weapon/empty-click",
    },
    reticleRadius: 18,
    reticleShape: "wide",
  }),
);
