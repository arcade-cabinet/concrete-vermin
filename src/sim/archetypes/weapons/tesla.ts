import { type WeaponArchetype, weaponArchetypeSchema } from "./_types";

export const tesla: Readonly<WeaponArchetype> = Object.freeze(
  weaponArchetypeSchema.parse({
    id: "tesla",
    damage: 9,
    pellets: 1,
    fireRate: 1.5,
    magSize: 8,
    reloadMs: 2200,
    spread: 0.0,
    headshotBonus: 0.1,
    critChance: 0.15,
    critMultiplier: 2,
    armorPierce: 1,
    rangeMax: 320,
    projectileType: "arc",
    trailType: "lightning",
    spriteAtlas: "weapons/tesla",
    audio: {
      fire: "sfx/weapon/tesla-fire",
      reload: "sfx/weapon/tesla-reload",
      empty: "sfx/weapon/empty-click",
    },
  }),
);
