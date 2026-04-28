import type { Rng } from "../rng";

/**
 * Fixed-step pure tick. The sim is structured as a snapshot + a list
 * of system functions; each system is `(world, dt, rng) => world` and
 * runs in registration order. The tick loop is "pure" in the sense
 * that it doesn't reach for ECS handles — it just folds systems over
 * a snapshot.
 *
 * The renderer never calls runTick directly; it samples the world via
 * `useFrame`-style queries on the ECS bridge. The mission ticker calls
 * `runTick` at a fixed 60Hz cadence (or a deterministic substep
 * sequence for headless analysis sweeps).
 *
 * For determinism: the rng is forked for each system so a system's
 * draws don't shift the seed for sibling systems. The fork label is
 * the system's `id` — stable, source-controlled.
 */

export interface SimWorld {
  /** Sim seconds since mission start. */
  now: number;
  /** Tick index since mission start. Starts at 0. */
  tickIndex: number;
}

export type SimSystem<W extends SimWorld> = {
  id: string;
  step: (world: W, dt: number, rng: Rng) => W;
};

export interface TickOptions<W extends SimWorld> {
  systems: ReadonlyArray<SimSystem<W>>;
  /** Master rng for the tick. Each system gets a forked child. */
  rng: Rng;
  /** Fixed timestep in seconds. */
  dt: number;
}

export function runTick<W extends SimWorld>(world: W, opts: TickOptions<W>): W {
  let next = world;
  for (const sys of opts.systems) {
    const sysRng = opts.rng.fork(sys.id);
    next = sys.step(next, opts.dt, sysRng);
  }
  // Advance time AFTER systems so mid-tick reads see the start-of-tick clock.
  return { ...next, now: world.now + opts.dt, tickIndex: world.tickIndex + 1 };
}

/** Convenience: run N ticks in sequence. Useful for analysis + tests. */
export function runTicks<W extends SimWorld>(world: W, opts: TickOptions<W>, count: number): W {
  let current = world;
  for (let i = 0; i < count; i++) {
    current = runTick(current, opts);
  }
  return current;
}
