import { type WeaponArchetype, weaponArchetypeSchema } from "./_types";

export const flamethrower: Readonly<WeaponArchetype> = Object.freeze(
  weaponArchetypeSchema.parse({
    id: "flamethrower",
    damage: 1,
    pellets: 1,
    fireRate: 24,
    magSize: 80,
    reloadMs: 2400,
    spread: 0.22,
    headshotBonus: 0,
    critChance: 0,
    critMultiplier: 1,
    armorPierce: 0.5,
    rangeMax: 180,
    projectileType: "flame",
    trailType: "plume",
    spriteAtlas: "weapons/flamethrower",
    audio: {
      fire: "sfx/weapon/flame-fire",
      reload: "sfx/weapon/flame-reload",
      empty: "sfx/weapon/empty-click",
    },
  }),
);
