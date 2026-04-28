import type { VerminSnapshot } from "../runtime/store";

export interface ThreatOptions {
  playerLineY: number;
  /**
   * When true, demote vermin already at < weapon-damage HP so we don't
   * waste a heavy variant on a target a tap-fire would clear. Penalty
   * scales by weaponDamage so it does not swamp big-target damageWeight.
   */
  lowHealthPenalty?: number;
}

export function selectHighestThreat(
  vermin: ReadonlyArray<VerminSnapshot>,
  weaponDamage: number,
  opts: ThreatOptions,
): VerminSnapshot | null {
  let bestVermin: VerminSnapshot | null = null;
  let bestScore = -Infinity;
  for (const v of vermin) {
    if (v.health <= 0) continue;
    const score = scoreThreat(v, weaponDamage, opts);
    if (score > bestScore) {
      bestVermin = v;
      bestScore = score;
    }
  }
  return bestVermin;
}

export function scoreThreat(
  v: VerminSnapshot,
  weaponDamage: number,
  opts: ThreatOptions,
): number {
  const lowHealthPenalty = opts.lowHealthPenalty ?? 1.5;
  const distance = Math.abs(v.y - opts.playerLineY);
  const proximity = 1 - Math.min(1, distance / opts.playerLineY);
  const damageWeight = v.maxHealth;
  const killShots = Math.max(1, Math.ceil(v.health / weaponDamage));
  const lowHealthMod = v.health < weaponDamage ? -lowHealthPenalty * weaponDamage : 0;
  return proximity * 100 + damageWeight - killShots * 5 + lowHealthMod;
}
