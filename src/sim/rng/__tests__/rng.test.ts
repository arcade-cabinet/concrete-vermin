import { describe, expect, it } from "vitest";
import { createRng, deserializeRng, hashSeed } from "../rng";

describe("createRng", () => {
  it("is deterministic across two instances with the same seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    const sequence = (rng: ReturnType<typeof createRng>) =>
      Array.from({ length: 16 }, () => rng.next());
    expect(sequence(a)).toEqual(sequence(b));
  });

  it("accepts string seeds and hashes them deterministically", () => {
    const a = createRng("mission-01");
    const b = createRng("mission-01");
    expect(a.next()).toBe(b.next());
    expect(createRng("mission-01").next()).not.toBe(createRng("mission-02").next());
  });

  it("differs between distinct seeds", () => {
    expect(createRng(1).next()).not.toEqual(createRng(2).next());
  });

  it("int() returns inclusive integers in range", () => {
    const rng = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng.int(3, 9);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(9);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it("range() returns floats in [min, max)", () => {
    const rng = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng.range(0.5, 2.5);
      expect(v).toBeGreaterThanOrEqual(0.5);
      expect(v).toBeLessThan(2.5);
    }
  });

  it("pick() throws on empty arrays", () => {
    expect(() => createRng(1).pick([])).toThrow();
  });

  it("pick() returns an element from the array", () => {
    const rng = createRng(11);
    const arr = ["a", "b", "c"];
    for (let i = 0; i < 50; i++) expect(arr).toContain(rng.pick(arr));
  });

  it("weighted() respects relative frequency over many samples", () => {
    const rng = createRng(31);
    const items = ["a", "b", "c"] as const;
    const weights = [1, 3, 6];
    const counts: Record<string, number> = { a: 0, b: 0, c: 0 };
    const N = 10000;
    for (let i = 0; i < N; i++) counts[rng.weighted(items, weights)]++;
    expect(counts.a / N).toBeGreaterThan(0.07);
    expect(counts.a / N).toBeLessThan(0.13);
    expect(counts.b / N).toBeGreaterThan(0.27);
    expect(counts.b / N).toBeLessThan(0.33);
    expect(counts.c / N).toBeGreaterThan(0.57);
    expect(counts.c / N).toBeLessThan(0.63);
  });

  it("weighted() rejects mismatched lengths and zero/negative weights", () => {
    const rng = createRng(1);
    expect(() => rng.weighted(["a", "b"], [1])).toThrow();
    expect(() => rng.weighted(["a"], [0])).toThrow();
    expect(() => rng.weighted(["a"], [-1])).toThrow();
    expect(() => rng.weighted([], [])).toThrow();
  });

  it("shuffle() preserves elements (multiset equality)", () => {
    const rng = createRng(13);
    const original = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffled = rng.shuffle([...original]);
    expect(shuffled.slice().sort()).toEqual(original.slice().sort());
  });

  it("chance() obeys the probability roughly", () => {
    const rng = createRng(101);
    let hits = 0;
    const N = 10000;
    for (let i = 0; i < N; i++) if (rng.chance(0.3)) hits++;
    const ratio = hits / N;
    expect(ratio).toBeGreaterThan(0.27);
    expect(ratio).toBeLessThan(0.33);
  });

  it("fork() with the same label from the same point yields the same child stream", () => {
    const a = createRng(77).fork("encounter");
    const b = createRng(77).fork("encounter");
    expect(a.next()).toBe(b.next());
  });

  it("fork() with different labels yields different child streams", () => {
    const a = createRng(77).fork("a");
    const b = createRng(77).fork("b");
    expect(a.next()).not.toBe(b.next());
  });

  it("serialize() / deserializeRng() round-trips and resumes the stream", () => {
    const a = createRng(99);
    a.next();
    a.next();
    const snap = a.serialize();
    const tail = [a.next(), a.next(), a.next()];
    const b = deserializeRng(snap);
    expect([b.next(), b.next(), b.next()]).toEqual(tail);
  });

  it("exposes its starting seed", () => {
    expect(createRng(99).seed).toBe(99);
  });
});

describe("hashSeed", () => {
  it("returns the same value for identical inputs", () => {
    expect(hashSeed(1, 2, 3)).toBe(hashSeed(1, 2, 3));
  });

  it("returns different values for different inputs", () => {
    expect(hashSeed(1, 2, 3)).not.toBe(hashSeed(1, 2, 4));
  });

  it("returns an unsigned 32-bit integer", () => {
    const h = hashSeed(123, 456);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(0xffffffff);
  });
});
