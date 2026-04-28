import { clamp } from "../_shared/math";
import type { HealthMod } from "../traits/vermin";

export interface WeaponInput {
  damage: number;
  headshotBonus: number;
  critChance: number;
  critMultiplier: number;
  damageMods: ReadonlyArray<number>;
  critChanceMods: ReadonlyArray<number>;
  armorPierce: number;
}

export interface TargetInput {
  health: number;
  healthMod: HealthMod;
  headshotMultiplier: number;
}

export interface HitInput {
  isHeadshot: boolean;
  critRoll: number;
}

export interface HitResult {
  damage: number;
  isHeadshot: boolean;
  isCrit: boolean;
  killed: boolean;
  remainingHealth: number;
}

// Armor reduction per healthMod bucket. 0 = no reduction, 0.5 = half damage.
// The values match the design's "fragile/normal/tough/armored" curve.
const ARMOR_REDUCTION: Record<HealthMod, number> = {
  fragile: 0,
  normal: 0,
  tough: 0.2,
  armored: 0.4,
};

export function resolveHit(weapon: WeaponInput, target: TargetInput, hit: HitInput): HitResult {
  const damageMod = weapon.damageMods.reduce((acc, m) => acc * m, 1);

  const headshotMult = hit.isHeadshot ? target.headshotMultiplier + weapon.headshotBonus : 1;

  const critChance = clamp(
    weapon.critChance + weapon.critChanceMods.reduce((a, b) => a + b, 0),
    0,
    1,
  );
  const isCrit = hit.critRoll < critChance;
  const critMult = isCrit ? weapon.critMultiplier : 1;

  // Armor pierce of 1 = ignore armor; 0 = full armor applies.
  const baseArmor = ARMOR_REDUCTION[target.healthMod];
  const effectiveArmor = baseArmor * (1 - clamp(weapon.armorPierce, 0, 1));
  const armorMult = 1 - effectiveArmor;

  const raw = weapon.damage * damageMod * headshotMult * critMult * armorMult;
  const damage = Math.max(1, Math.round(raw));

  const remainingHealth = Math.max(0, target.health - damage);
  const killed = remainingHealth <= 0;

  return { damage, isHeadshot: hit.isHeadshot, isCrit, killed, remainingHealth };
}
