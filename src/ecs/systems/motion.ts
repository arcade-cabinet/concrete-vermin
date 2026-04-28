import type { World } from "koota";
import { ARCHETYPES, type ArchetypeId } from "../../sim/archetypes/vermin";
import { Lifecycle, Position, Velocity, Vermin } from "../traits";

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

export interface CullEvent {
  /** Whether the culled entity was a vermin that reached the player line. */
  vermin: boolean;
  archetypeId: string;
  /** Contact damage to apply if vermin === true. */
  contactDamage: number;
}

/**
 * Off-screen culler: marks entities outside the camera bounds as
 * dead so the lifecycle system collects them. Bounds are inclusive.
 *
 * Returns CullEvents for vermin culled past the player line (bottom of
 * the play area) — the runner uses these to deduct contact damage. A
 * vermin culled because it left the top/sides (escaped) doesn't bite.
 */
export function cullOffscreenSystem(
  world: World,
  bounds: Readonly<{ minX: number; maxX: number; minY: number; maxY: number }>,
  now: number,
  margin = 64,
): ReadonlyArray<CullEvent> {
  const events: CullEvent[] = [];
  for (const e of world.query(Position, Lifecycle)) {
    const p = e.get(Position);
    const l = e.get(Lifecycle);
    if (!p || !l || l.deadAt > 0) continue;
    const offX = p.x < bounds.minX - margin || p.x > bounds.maxX + margin;
    const offBelow = p.y > bounds.maxY + margin;
    const offAbove = p.y < bounds.minY - margin;
    if (!(offX || offBelow || offAbove)) continue;
    e.set(Lifecycle, { spawnedAt: l.spawnedAt, deadAt: now });
    const v = e.get(Vermin);
    if (v && offBelow) {
      const arch = ARCHETYPES[v.archetypeId as ArchetypeId];
      if (arch) {
        events.push({
          vermin: true,
          archetypeId: v.archetypeId,
          contactDamage: arch.baseStats.contactDamage,
        });
      }
    }
  }
  return events;
}
