import type { Rng } from "../rng";

export interface SimWorld {
  now: number;
  tickIndex: number;
}

export type SimSystem<W extends SimWorld> = {
  id: string;
  step: (world: W, dt: number, rng: Rng) => W;
};

export interface TickOptions<W extends SimWorld> {
  systems: ReadonlyArray<SimSystem<W>>;
  rng: Rng;
  dt: number;
}

export function runTick<W extends SimWorld>(world: W, opts: TickOptions<W>): W {
  let next = world;
  for (const sys of opts.systems) {
    // Fork label includes tickIndex so each tick gets a fresh per-system
    // stream. Without this, the same system would draw the same number
    // every tick — AI/jitter would never evolve.
    const sysRng = opts.rng.fork(`${sys.id}:${world.tickIndex}`);
    next = sys.step(next, opts.dt, sysRng);
  }
  // Advance time AFTER systems so mid-tick reads see the start-of-tick clock.
  return { ...next, now: world.now + opts.dt, tickIndex: world.tickIndex + 1 };
}

export function runTicks<W extends SimWorld>(world: W, opts: TickOptions<W>, count: number): W {
  let current = world;
  for (let i = 0; i < count; i++) {
    current = runTick(current, opts);
  }
  return current;
}
