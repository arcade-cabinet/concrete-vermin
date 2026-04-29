import { type WeaponArchetype, weaponArchetypeSchema } from "./_types";

export const smg: Readonly<WeaponArchetype> = Object.freeze(
  weaponArchetypeSchema.parse({
    id: "smg",
    damage: 2,
    pellets: 1,
    fireRate: 11,
    magSize: 30,
    reloadMs: 1700,
    spread: 0.06,
    headshotBonus: 0.15,
    critChance: 0.03,
    critMultiplier: 2,
    armorPierce: 0.3,
    rangeMax: 360,
    projectileType: "rapid-bullet",
    trailType: "muzzle-burst",
    spriteAtlas: "weapons/smg",
    audio: {
      fire: "sfx/weapon/smg-fire",
      reload: "sfx/weapon/smg-reload",
      empty: "sfx/weapon/empty-click",
    },
    reticleRadius: 9,
    reticleShape: "ring",
    chargeProfile: { maxChargeMs: 1500, shellsConsumed: 8, effect: "mag-dump-cone" },
  }),
);
