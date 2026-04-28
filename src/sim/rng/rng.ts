import seedrandom from "seedrandom";

/**
 * Seedable PRNG for reproducible runs.
 * `seedrandom` is the single active random source for sim code.
 * A direct random call anywhere in src/sim/** is a CI blocker.
 */
export interface Rng {
  next(): number;
  range(min: number, max: number): number;
  int(min: number, max: number): number;
  pick<T>(arr: readonly T[]): T;
  weighted<T>(items: readonly T[], weights: readonly number[]): T;
  shuffle<T>(arr: T[]): T[];
  gaussian(): number;
  chance(p: number): boolean;
  /** Spawn an independent child RNG seeded from this one. The label keeps
   *  parallel forks deterministic across labelled call sites. */
  fork(label: string): Rng;
  /** Snapshot the internal state so the sequence can be replayed later. */
  serialize(): RngState;
  readonly seed: number;
}

export interface RngState {
  seed: number;
  state: string;
}

function mixLabel(seed: number, label: string): number {
  let h = seed >>> 0;
  for (let i = 0; i < label.length; i++) {
    h ^= label.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function makeRng(seed: number, restoreState?: string): Rng {
  const startSeed = seed >>> 0;
  const generator = restoreState
    ? seedrandom(String(startSeed), { state: JSON.parse(restoreState) })
    : seedrandom(String(startSeed), { state: true });

  const next = (): number => generator.quick();

  const shuffle = <T>(arr: T[]): T[] => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      const a = arr[i] as T;
      const b = arr[j] as T;
      arr[i] = b;
      arr[j] = a;
    }
    return arr;
  };

  return {
    next,
    range(min: number, max: number): number {
      return min + next() * (max - min);
    },
    int(min: number, max: number): number {
      return min + Math.floor(next() * (max - min + 1));
    },
    pick<T>(arr: readonly T[]): T {
      if (arr.length === 0) throw new Error("rng.pick: cannot pick from an empty array");
      return arr[Math.floor(next() * arr.length)] as T;
    },
    weighted<T>(items: readonly T[], weights: readonly number[]): T {
      if (items.length === 0) throw new Error("rng.weighted: empty items");
      if (items.length !== weights.length) {
        throw new Error("rng.weighted: items and weights length mismatch");
      }
      let total = 0;
      for (const w of weights) {
        if (w < 0) throw new Error("rng.weighted: negative weight");
        total += w;
      }
      if (total <= 0) throw new Error("rng.weighted: weights sum to zero");
      let roll = next() * total;
      for (let i = 0; i < items.length; i++) {
        roll -= weights[i] as number;
        if (roll < 0) return items[i] as T;
      }
      return items[items.length - 1] as T;
    },
    shuffle,
    gaussian(): number {
      return (next() + next() + next() + next() - 2) / 2;
    },
    chance(p: number): boolean {
      return next() < p;
    },
    fork(label: string): Rng {
      // Order-independent: derived from the parent's STARTING seed plus the
      // label. Calling fork() does NOT advance the parent stream, so the
      // order of sibling forks is irrelevant — important for encounter
      // composition where adding/removing/re-ordering spawn specs must
      // not perturb the others' deterministic streams.
      return makeRng(mixLabel(startSeed, label));
    },
    serialize(): RngState {
      return { seed: startSeed, state: JSON.stringify(generator.state()) };
    },
    get seed() {
      return startSeed;
    },
  };
}

export function createRng(seedInput: string | number): Rng {
  const seed = typeof seedInput === "number" ? seedInput : hashString(seedInput);
  return makeRng(seed);
}

export function deserializeRng(snapshot: RngState): Rng {
  return makeRng(snapshot.seed, snapshot.state);
}

function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** FNV-1a-style 32-bit mix of integer inputs. Pure and deterministic. */
export function hashSeed(...inputs: number[]): number {
  let h = 0x811c9dc5;
  for (const input of inputs) {
    const n = Math.trunc(input) >>> 0;
    for (let shift = 0; shift < 32; shift += 8) {
      h ^= (n >>> shift) & 0xff;
      h = Math.imul(h, 0x01000193) >>> 0;
    }
  }
  return h >>> 0;
}
