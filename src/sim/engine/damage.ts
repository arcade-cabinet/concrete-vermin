import type { HealthMod } from "../traits/vermin";

/**
 * Pure damage resolver. Takes plain records — no ECS handles, no rng,
 * no side effects. The encounter loop calls this once per shot/hit.
 *
 * Design §3 (combat) and §4 (scoring) govern these formulas. The
 * `headshotMultiplier` lives on the vermin archetype; the weapon
 * supplies a flat `headshotBonus` (additive on top) so weapon mods
 * like `scope` can stack with the target's natural weak point.
 *
 * Mod stacking is multiplicative for damage (so an extended mag at
 * 1.0 doesn't change damage, while a +0.25 incendiary multiplies in).
 * Crit chance is additive across mods, clamped to [0, 1].
 */

import { clamp } from "../_shared/math";

export interface WeaponInput {
  /** Base per-projectile damage before mods. */
  damage: number;
  /** Additive headshot bonus on top of the target's headshotMultiplier (0 = none). */
  headshotBonus: number;
  /** Base crit chance [0..1]. */
  critChance: number;
  /** Crit damage multiplier (≥1). */
  critMultiplier: number;
  /** Multiplicative damage mods (e.g. [1.25, 1.1] = 1.375x). */
  damageMods: ReadonlyArray<number>;
  /** Additive crit-chance mods (e.g. [0.05, 0.1] = +0.15). */
  critChanceMods: ReadonlyArray<number>;
  /** Armor-piercing fraction [0..1]. 0 = armor fully applies; 1 = ignore armor entirely. */
  armorPierce: number;
}

export interface TargetInput {
  health: number;
  /** Trait-derived health bucket. Determines armor reduction. */
  healthMod: HealthMod;
  /** Per-target headshot multiplier from the archetype (e.g. 2.0 for rats, 1.0 for armored). */
  headshotMultiplier: number;
}

export interface HitInput {
  isHeadshot: boolean;
  /** RNG draw in [0, 1) for the crit roll. The caller forks rng and draws ONE number. */
  critRoll: number;
}

export interface HitResult {
  damage: number;
  isHeadshot: boolean;
  isCrit: boolean;
  killed: boolean;
  /** Health remaining after this hit (clamped to ≥0). */
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
