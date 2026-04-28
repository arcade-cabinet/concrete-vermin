import type { VerminSnapshot } from "../runtime/store";

export interface ThreatScored {
  vermin: VerminSnapshot;
  score: number;
}

export interface ThreatOptions {
  /**
   * Y of the "player line" — the floor the player stands on. Vermin
   * closer to it are more urgent. In CV's side-on view this is
   * `viewport.height` minus a small floor offset; the GovernorLoop
   * passes the live value so the threat picker stays viewport-agnostic.
   */
  playerLineY: number;
  /**
   * Penalty applied to vermin already at very low health so the
   * governor doesn't waste a heavy weapon's burst on a target that
   * a tap-fire follow-up would clear. 0 disables. Default 1.5 — chosen
   * so a near-dead 20-HP brute loses to a full-HP 20-HP brute at the
   * same position even when the weapon needs 3 shots to clear the latter.
   */
  lowHealthPenalty?: number;
}

/**
 * Threat = "how urgent is this vermin given my weapon."
 *
 * Score formula:
 *   proximity = 1 - clamp(distanceToPlayerLine / playerLineY, 0, 1)
 *   damageWeight = vermin.maxHealth (proxy for "is this a beefy threat")
 *   killWeight = max(1, ceil(vermin.health / weaponDamage))
 *   score = proximity * 100 + damageWeight - killWeight * 5
 *
 * Higher = more urgent. Returns null if no candidates.
 */
export function selectHighestThreat(
  vermin: ReadonlyArray<VerminSnapshot>,
  weaponDamage: number,
  opts: ThreatOptions,
): VerminSnapshot | null {
  if (vermin.length === 0) return null;
  let best: ThreatScored | null = null;
  for (const v of vermin) {
    if (v.health <= 0) continue;
    const score = scoreThreat(v, weaponDamage, opts);
    if (best === null || score > best.score) {
      best = { vermin: v, score };
    }
  }
  return best?.vermin ?? null;
}

export function scoreThreat(
  v: VerminSnapshot,
  weaponDamage: number,
  opts: ThreatOptions,
): number {
  const playerLineY = opts.playerLineY;
  const lowHealthPenalty = opts.lowHealthPenalty ?? 1.5;
  const distance = Math.abs(v.y - playerLineY);
  const proximity = 1 - Math.min(1, distance / Math.max(1, playerLineY));
  const damageWeight = v.maxHealth;
  const killShots = Math.max(1, Math.ceil(v.health / Math.max(1, weaponDamage)));
  const lowHealthMod = v.health < weaponDamage ? -lowHealthPenalty * v.maxHealth : 0;
  return proximity * 100 + damageWeight - killShots * 5 + lowHealthMod;
}
