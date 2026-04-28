/**
 * Aim assist: snap the reticle to the nearest vermin within a small
 * radius. Pure function — caller passes the raw reticle, the live
 * vermin snapshot, and the assist radius; we return either the
 * original reticle or a snapped version.
 *
 * Default radius is 5 px (sim coords). The radius is intentionally
 * tight — the assist nudges aim onto a target the player nearly
 * grazed; it doesn't pull the reticle across the screen.
 */

export interface AimTarget {
  x: number;
  y: number;
  width: number;
  height: number;
}

const DEFAULT_RADIUS = 5;

/**
 * Snap reticle (rx, ry) to the centre of the nearest vermin whose
 * AABB-expanded edge is within `radius` of the reticle. Returns the
 * snapped point, or the original reticle if nothing qualifies.
 *
 * Bosses pull stronger (3× radius bonus) so the assist always reads
 * the boss as the priority target — losing the assist on a boss is
 * the worst possible UX.
 */
export function applyAimAssist<T extends AimTarget>(
  rx: number,
  ry: number,
  vermin: ReadonlyArray<T & { archetypeId: string }>,
  radius: number = DEFAULT_RADIUS,
): { x: number; y: number; snapped: boolean; target: T | null } {
  let best: T | null = null;
  let bestScore = Infinity;
  for (const v of vermin) {
    const hw = v.width / 2;
    const hh = v.height / 2;
    // Distance from reticle to the AABB perimeter (0 if inside).
    const dx = Math.max(0, Math.abs(rx - v.x) - hw);
    const dy = Math.max(0, Math.abs(ry - v.y) - hh);
    const dist = Math.hypot(dx, dy);
    const isBoss = v.archetypeId.startsWith("boss-");
    const effectiveRadius = isBoss ? radius * 3 : radius;
    if (dist > effectiveRadius) continue;
    // Score by raw distance (boss bonus is on the radius, not the
    // ranking) so two competing non-boss targets get picked by
    // proximity, but a far boss never beats a close mook.
    if (dist < bestScore) {
      bestScore = dist;
      best = v;
    }
  }
  if (!best) return { x: rx, y: ry, snapped: false, target: null };
  return { x: best.x, y: best.y, snapped: true, target: best };
}
