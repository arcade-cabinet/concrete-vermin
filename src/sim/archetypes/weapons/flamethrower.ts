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
    reticleRadius: 20,
    reticleShape: "ring",
    chargeProfile: {
      maxChargeMs: 700,
      shellsConsumed: 4,
      effect: "napalm-pool",
      // Stationary AOE only pays off on slow / non-boss targets — moving
      // bosses out-walk the pool faster than the DoT can land.
      governorGate: { refuseIfBoss: true, maxTargetSpeed: 30 },
    },
  }),
);
