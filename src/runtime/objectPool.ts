/**
 * Tiny pre-allocated object pool. Avoids per-tick allocation for the
 * runner's transient records (muzzleFlash + damageEvent) — the GC
 * tail-latency that produces shows up as ~2-4 ms hitches every second
 * or two on mid-tier mobile (Chrome 120 + on-screen Pixi canvas).
 *
 * Pure: no DOM, no React. Sized to a fixed cap; if a caller asks for an
 * acquire when full, the pool returns the oldest entry (a circular-
 * buffer eviction). That's deliberate — the alternative would be either
 * to drop the request or to grow the pool unboundedly. For visual-only
 * transients (a flash or floating damage number), evicting an old entry
 * the player can't see anymore is the right call.
 */

export interface ObjectPool<T> {
  /** Capacity (fixed). */
  readonly capacity: number;
  /** Acquire a fresh entry, recycling the oldest if full. */
  acquire(): T;
  /** Snapshot of currently-live entries (allocates a new array). */
  liveSnapshot(): ReadonlyArray<T>;
  /** Mark every entry whose `predicate` returns true as available. */
  retainWhere(predicate: (entry: T) => boolean): void;
  /** Number of live entries right now. */
  readonly liveCount: number;
}

export function createObjectPool<T>(capacity: number, factory: () => T): ObjectPool<T> {
  if (capacity <= 0) throw new Error("capacity must be positive");
  // Slots holds the storage; live[i] flips true when slot i is in use.
  const slots: T[] = new Array(capacity).fill(null).map(() => factory());
  const live: boolean[] = new Array(capacity).fill(false);
  // Insertion order tracker for circular eviction. nextIndex points at
  // the next slot to fill on acquire(); when the pool is full we
  // overwrite that slot.
  let nextIndex = 0;

  const pool: ObjectPool<T> = {
    capacity,
    get liveCount() {
      let n = 0;
      for (const l of live) if (l) n++;
      return n;
    },
    acquire(): T {
      // Prefer a free slot near `nextIndex` to keep ordering coherent.
      for (let probe = 0; probe < capacity; probe++) {
        const i = (nextIndex + probe) % capacity;
        if (!live[i]) {
          live[i] = true;
          nextIndex = (i + 1) % capacity;
          return slots[i]!;
        }
      }
      // Pool full — evict at nextIndex.
      const i = nextIndex;
      live[i] = true;
      nextIndex = (i + 1) % capacity;
      return slots[i]!;
    },
    liveSnapshot(): ReadonlyArray<T> {
      const out: T[] = [];
      for (let i = 0; i < capacity; i++) {
        if (live[i]) out.push(slots[i]!);
      }
      return out;
    },
    retainWhere(predicate: (entry: T) => boolean): void {
      for (let i = 0; i < capacity; i++) {
        if (live[i] && !predicate(slots[i]!)) {
          live[i] = false;
        }
      }
    },
  };
  return pool;
}
