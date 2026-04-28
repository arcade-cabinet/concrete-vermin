import { type WeaponArchetype, weaponArchetypeSchema } from "./_types";

export const revolver: Readonly<WeaponArchetype> = Object.freeze(
  weaponArchetypeSchema.parse({
    id: "revolver",
    damage: 7,
    pellets: 1,
    fireRate: 2.0,
    magSize: 6,
    reloadMs: 1800,
    spread: 0.02,
    headshotBonus: 0.5,
    critChance: 0.1,
    critMultiplier: 2.5,
    armorPierce: 0.6,
    rangeMax: 480,
    projectileType: "bullet",
    trailType: "linear-tracer",
    spriteAtlas: "weapons/revolver",
    audio: {
      fire: "sfx/weapon/revolver-fire",
      reload: "sfx/weapon/revolver-reload",
      empty: "sfx/weapon/empty-click",
    },
    reticleRadius: 6,
    reticleShape: "diamond",
    chargeProfile: { maxChargeMs: 1200, shellsConsumed: 3, effect: "auto-burst" },
  }),
);
