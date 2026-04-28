import type { World } from "koota";
import { getVariant } from "../../sim/content/variants";
import { composeVermin } from "../../sim/factories/actor";
import type { SpawnTimingRecord } from "../../sim/factories/patterns";
import type { Rng } from "../../sim/rng";
import { spawnVermin } from "../actions";

/**
 * Schedule entry the spawn system consumes. Each entry is one vermin
 * to be spawned at `delayS` after the encounter went ACTIVE, with a
 * stage-relative position the system maps onto the zone bounds.
 */
export interface PendingSpawn {
  variantId: string;
  timing: SpawnTimingRecord;
  /** Sim time when the encounter became ACTIVE (the delayS reference). */
  activeStartedAt: number;
  /** Stage zone the spawn position maps into. */
  zone: Readonly<{ minX: number; maxX: number; minY: number; maxY: number }>;
  /** Set true once the system has spawned this entry; pruning is the caller's job. */
  spawned?: boolean;
}

export function spawnSystem(world: World, rng: Rng, now: number, pending: PendingSpawn[]): void {
  for (const ps of pending) {
    if (ps.spawned) continue;
    if (now - ps.activeStartedAt < ps.timing.delayS) continue;

    const variant = getVariant(ps.variantId);
    if (!variant) {
      ps.spawned = true; // never re-attempt invalid variant
      continue;
    }
    const childRng = rng.fork(`spawn:${ps.variantId}:${ps.timing.index}`);
    const rec = composeVermin(variant.archetype, variant.traits, childRng);

    const w = ps.zone.maxX - ps.zone.minX;
    const h = ps.zone.maxY - ps.zone.minY;
    const px = ps.zone.minX + ps.timing.position.x * w;
    const py = ps.zone.minY + ps.timing.position.y * h;
    const vx = ps.timing.velocity.x * 40;
    const vy = ps.timing.velocity.y * 40;

    spawnVermin(world, rec, {
      position: { x: px, y: py },
      velocity: { x: vx, y: vy },
      now,
    });
    ps.spawned = true;
  }
}
