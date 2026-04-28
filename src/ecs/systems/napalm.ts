import type { World } from "koota";
import { Health, Lifecycle, NapalmPool, Position } from "../traits";

/**
 * Napalm pool system — runs once per sim tick (at 60 Hz).
 *
 * 1. Destroys any pool whose `expiresAt` has passed.
 * 2. For each live pool, applies per-tick DoT to every vermin within radius.
 *    Vermin in two overlapping pools take combined DPS (each pool entity
 *    applies its own damage independently — no summing, just two passes).
 *
 * Sim-pure: no imports from runtime/, ui/, audio/, or platform/.
 */
export function napalmSystem(world: World, nowMs: number): void {
  // Collect expired pools before the damage pass so we don't apply damage
  // from a pool that expired this exact tick.
  const expired: ReturnType<World["query"]>[number][] = [];
  for (const poolEntity of world.query(NapalmPool)) {
    const pool = poolEntity.get(NapalmPool);
    if (pool && nowMs >= pool.expiresAt) {
      expired.push(poolEntity);
    }
  }
  for (const e of expired) {
    e.destroy();
  }

  // Per-tick damage at ~60 fps: dps / 60.
  const DT_S = 1 / 60;

  for (const poolEntity of world.query(NapalmPool)) {
    const pool = poolEntity.get(NapalmPool);
    if (!pool) continue;

    for (const entity of world.query(Position, Health, Lifecycle)) {
      const lc = entity.get(Lifecycle);
      // Skip dead entities.
      if (!lc || lc.deadAt > 0) continue;

      const pos = entity.get(Position);
      if (!pos) continue;

      const dist = Math.hypot(pos.x - pool.x, pos.y - pool.y);
      if (dist > pool.radius) continue;

      const health = entity.get(Health);
      if (!health) continue;

      const dmg = pool.dps * DT_S;
      entity.set(Health, { current: Math.max(0, health.current - dmg), max: health.max });

      // If health drained to 0, mark for lifecycle GC.
      const updated = entity.get(Health);
      if (updated && updated.current <= 0 && lc.deadAt === 0) {
        entity.set(Lifecycle, { spawnedAt: lc.spawnedAt, deadAt: nowMs / 1000 });
      }
    }
  }
}
