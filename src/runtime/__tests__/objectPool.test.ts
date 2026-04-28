import { describe, expect, it } from "vitest";
import { createObjectPool } from "../objectPool";

describe("createObjectPool", () => {
  it("rejects zero / negative capacity", () => {
    expect(() => createObjectPool(0, () => ({}))).toThrow();
    expect(() => createObjectPool(-1, () => ({}))).toThrow();
  });

  it("acquire returns a fresh entry; liveCount tracks usage", () => {
    const pool = createObjectPool<{ x: number }>(4, () => ({ x: 0 }));
    expect(pool.liveCount).toBe(0);
    const a = pool.acquire();
    a.x = 1;
    expect(pool.liveCount).toBe(1);
    const b = pool.acquire();
    b.x = 2;
    expect(pool.liveCount).toBe(2);
    const snap = pool.liveSnapshot();
    expect(snap.length).toBe(2);
    expect(snap.map((e) => e.x).sort()).toEqual([1, 2]);
  });

  it("retainWhere drops entries whose predicate returns false", () => {
    const pool = createObjectPool<{ alive: boolean }>(4, () => ({ alive: false }));
    for (let i = 0; i < 4; i++) pool.acquire().alive = i % 2 === 0;
    expect(pool.liveCount).toBe(4);
    pool.retainWhere((e) => e.alive);
    expect(pool.liveCount).toBe(2);
  });

  it("acquires past capacity by evicting the oldest live entry", () => {
    const pool = createObjectPool<{ id: number }>(3, () => ({ id: -1 }));
    for (let i = 0; i < 3; i++) pool.acquire().id = i;
    expect(pool.liveCount).toBe(3);
    // 4th acquire — pool is full, oldest (id=0) gets evicted.
    pool.acquire().id = 99;
    expect(pool.liveCount).toBe(3);
    const ids = pool
      .liveSnapshot()
      .map((e) => e.id)
      .sort((a, b) => a - b);
    expect(ids).toContain(99);
    expect(ids).not.toContain(0);
  });

  it("re-uses freed slots without growing the underlying storage", () => {
    const pool = createObjectPool<{ id: number }>(3, () => ({ id: -1 }));
    // Acquire all three slots, then release all of them.
    const acquired = [pool.acquire(), pool.acquire(), pool.acquire()];
    acquired.forEach((e, i) => {
      e.id = i;
    });
    pool.retainWhere(() => false);
    expect(pool.liveCount).toBe(0);
    // Re-acquire — every entry must be one of the originals (no allocation).
    for (let i = 0; i < 3; i++) {
      const next = pool.acquire();
      expect(acquired).toContain(next);
    }
  });
});
