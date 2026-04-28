import type { World } from "koota";
import { Lifecycle, Position, Velocity } from "../traits";

/**
 * Motion system: integrates position from velocity for every entity
 * with both. Pure per-entity, dt-scaled. Off-screen vermin (or stale
 * projectiles) are despawned by the lifecycle system, not here.
 */
export function motionSystem(world: World, dt: number): void {
  for (const e of world.query(Position, Velocity)) {
    const p = e.get(Position);
    const v = e.get(Velocity);
    if (!p || !v) continue;
    e.set(Position, { x: p.x + v.x * dt, y: p.y + v.y * dt });
  }
}

/**
 * Off-screen culler: marks entities outside the camera bounds as
 * dead so the lifecycle system collects them. Bounds are inclusive.
 */
export function cullOffscreenSystem(
  world: World,
  bounds: Readonly<{ minX: number; maxX: number; minY: number; maxY: number }>,
  now: number,
  margin = 64,
): void {
  for (const e of world.query(Position, Lifecycle)) {
    const p = e.get(Position);
    const l = e.get(Lifecycle);
    if (!p || !l || l.deadAt > 0) continue;
    if (
      p.x < bounds.minX - margin ||
      p.x > bounds.maxX + margin ||
      p.y < bounds.minY - margin ||
      p.y > bounds.maxY + margin
    ) {
      e.set(Lifecycle, { spawnedAt: l.spawnedAt, deadAt: now });
    }
  }
}
