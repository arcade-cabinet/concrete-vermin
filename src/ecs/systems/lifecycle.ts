import type { World } from "koota";
import { Lifecycle } from "../traits";

/**
 * Lifecycle system: destroys entities whose deadAt has elapsed. Splash
 * effects use deadAt = spawn + ttl so this also collects them after
 * the animation window. Splashes themselves are spawned by the collide
 * system on kill events.
 */
export function lifecycleSystem(world: World, now: number): void {
  const toDestroy: ReturnType<World["query"]>[number][] = [];
  for (const e of world.query(Lifecycle)) {
    const l = e.get(Lifecycle);
    if (l && l.deadAt > 0 && l.deadAt <= now) toDestroy.push(e);
  }
  for (const e of toDestroy) e.destroy();
}
