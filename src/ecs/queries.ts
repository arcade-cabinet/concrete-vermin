import type { Entity, World } from "koota";
import { Collectible, Health, Lifecycle, Position, Projectile, Vermin } from "./traits";

/**
 * Pre-named query helpers. Systems use these instead of inlining
 * `world.query(...)` so the query hash stays stable across files (Koota
 * caches by hash) and so renaming a trait breaks one place, not many.
 *
 * Each helper returns the raw entity array; callers iterate and read
 * traits via entity.get(Trait).
 */

export const queryVermin = (world: World): readonly Entity[] => world.query(Vermin, Position);

export const queryProjectiles = (world: World): readonly Entity[] =>
  world.query(Projectile, Position);

export const queryCollectibles = (world: World): readonly Entity[] =>
  world.query(Collectible, Position);

/**
 * Alive = has Health and current > 0. We post-filter because Koota
 * doesn't have a "field-value query" — Health.current changes every
 * frame and would be a hash-buster.
 */
export const queryAlive = (world: World): Entity[] => {
  const out: Entity[] = [];
  const candidates = world.query(Health);
  for (const e of candidates) {
    const h = e.get(Health);
    if (h && h.current > 0) out.push(e);
  }
  return out;
};

/**
 * Returns vermin within `radius` of `pos`. Squared-distance compare to
 * skip the sqrt. Caller can sort by distance if it cares.
 */
export const queryNearReticle = (
  world: World,
  pos: Readonly<{ x: number; y: number }>,
  radius: number,
): Entity[] => {
  const out: Entity[] = [];
  const r2 = radius * radius;
  for (const e of queryVermin(world)) {
    const p = e.get(Position);
    if (!p) continue;
    const dx = p.x - pos.x;
    const dy = p.y - pos.y;
    if (dx * dx + dy * dy <= r2) out.push(e);
  }
  return out;
};

/** Lifecycle.deadAt > 0 means "queued for despawn." */
export const queryDying = (world: World): Entity[] => {
  const out: Entity[] = [];
  for (const e of world.query(Lifecycle)) {
    const l = e.get(Lifecycle);
    if (l && l.deadAt > 0) out.push(e);
  }
  return out;
};
