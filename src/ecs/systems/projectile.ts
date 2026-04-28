import type { World } from "koota";
import { Lifecycle, Projectile, Velocity } from "../traits";

/**
 * Projectile system: deducts rangeRemaining each tick by velocity*dt,
 * and marks the projectile dead when range hits 0. Hit-testing is the
 * collide system's job; this just enforces max-range falloff.
 */
export function projectileSystem(world: World, dt: number, now: number): void {
  for (const e of world.query(Projectile, Velocity, Lifecycle)) {
    const proj = e.get(Projectile);
    const v = e.get(Velocity);
    const l = e.get(Lifecycle);
    if (!proj || !v || !l || l.deadAt > 0) continue;

    const speed = Math.hypot(v.x, v.y);
    const newRange = proj.rangeRemaining - speed * dt;
    if (newRange <= 0) {
      e.set(Lifecycle, { spawnedAt: l.spawnedAt, deadAt: now });
    } else {
      e.set(Projectile, { ...proj, rangeRemaining: newRange });
    }
  }
}
