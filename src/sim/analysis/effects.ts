/**
 * Per-card / per-variant effect estimator. Closed-form, no simulation:
 * given a baseline TTK (time-to-kill) and a candidate change (variant
 * tweak, weapon swap, mod added), returns the projected change in
 * mission expected-time and expected-grade. Designers use this for a
 * cheap "should we even simulate this" pre-flight before running a
 * sweep.
 *
 * Pure functions; no I/O.
 */

import { applyLoadout, MOD_REGISTRY, type WeaponMod } from "../archetypes/mods";
import { ARCHETYPES, type ArchetypeId } from "../archetypes/vermin";
import { WEAPON_REGISTRY, type WeaponArchetype } from "../archetypes/weapons";

export interface EffectEstimate {
  /** Expected damage per shot at point-blank, no headshot, no crit. */
  damagePerShot: number;
  /** Expected shots to kill a baseline rat (health = 1.0 reference). */
  shotsToKillRat: number;
  /** Expected shots to kill the boss-dumpster-bear (Act-I boss). */
  shotsToKillAct1Boss: number;
  /** Mag duration in seconds at full fire rate. */
  magDurationS: number;
  /** Reload tax: reload ms / mag duration s. Lower is better. */
  reloadTaxRatio: number;
}

export function estimateWeaponEffect(
  weaponId: keyof typeof WEAPON_REGISTRY,
  modIds: ReadonlyArray<string> = [],
): EffectEstimate {
  const weapon = WEAPON_REGISTRY[weaponId];
  const mods = resolveMods(modIds, weapon);
  const tuned = applyLoadout(weapon, mods);

  const damagePerShot = tuned.base.damage * tuned.base.pellets;
  const ratHealth = ARCHETYPES.rat.baseStats.health;
  const bossHealth = ARCHETYPES["boss-dumpster-bear"].baseStats.health;

  const shotsToKillRat = Math.max(1, Math.ceil(ratHealth / Math.max(0.001, damagePerShot)));
  const shotsToKillAct1Boss = Math.max(1, Math.ceil(bossHealth / Math.max(0.001, damagePerShot)));
  const magDurationS = tuned.base.magSize / Math.max(0.001, tuned.base.fireRate);
  const reloadTaxRatio = tuned.base.reloadMs / 1000 / Math.max(0.001, magDurationS);

  return Object.freeze({
    damagePerShot,
    shotsToKillRat,
    shotsToKillAct1Boss,
    magDurationS,
    reloadTaxRatio,
  });
}

/**
 * Estimate the effect of swapping a single variant's health/speed
 * trait. Returns a unitless "drift score": 0 = no effect, +ve =
 * harder, -ve = easier. Used by the autobalance to direction-find
 * before launching a full sweep.
 */
export function estimateVariantDrift(
  archetypeId: ArchetypeId,
  healthMul: number,
  speedMul: number,
): number {
  const archetype = ARCHETYPES[archetypeId];
  const base = archetype.baseStats;
  // Health is roughly linear in time-to-kill; speed is logarithmic in
  // engagement time (faster vermin compress the firing window). Bounty
  // dampens both.
  const healthDrift = (healthMul - 1) * (base.health / 4);
  const speedDrift = Math.log2(Math.max(0.1, speedMul)) * 0.4;
  const bountyDamp = Math.max(0.5, 1 - base.bounty / 200);
  return (healthDrift + speedDrift) * bountyDamp;
}

function resolveMods(
  modIds: ReadonlyArray<string>,
  weapon: WeaponArchetype,
): ReadonlyArray<Readonly<WeaponMod>> {
  const out: WeaponMod[] = [];
  for (const id of modIds) {
    const mod = MOD_REGISTRY.get(id);
    if (!mod) continue;
    if (mod.compatibleWith.length > 0 && !mod.compatibleWith.includes(weapon.id)) continue;
    out.push(mod);
  }
  return out;
}
