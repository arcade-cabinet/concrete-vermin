import { describe, expect, it } from "vitest";
import { createRng } from "../../rng";
import { runTick, runTicks, type SimSystem, type SimWorld } from "../tick";

interface TestWorld extends SimWorld {
  counter: number;
  log: ReadonlyArray<string>;
  randomDraws: ReadonlyArray<number>;
}

const makeWorld = (): TestWorld => ({
  now: 0,
  tickIndex: 0,
  counter: 0,
  log: [],
  randomDraws: [],
});

describe("runTick", () => {
  it("advances now by dt and tickIndex by 1", () => {
    const w = runTick(makeWorld(), { systems: [], rng: createRng(1), dt: 1 / 60 });
    expect(w.now).toBeCloseTo(1 / 60);
    expect(w.tickIndex).toBe(1);
  });

  it("runs systems in registration order", () => {
    const a: SimSystem<TestWorld> = {
      id: "a",
      step: (w) => ({ ...w, log: [...w.log, "a"] }),
    };
    const b: SimSystem<TestWorld> = {
      id: "b",
      step: (w) => ({ ...w, log: [...w.log, "b"] }),
    };
    const c: SimSystem<TestWorld> = {
      id: "c",
      step: (w) => ({ ...w, log: [...w.log, "c"] }),
    };
    const w = runTick(makeWorld(), { systems: [a, b, c], rng: createRng(1), dt: 1 });
    expect(w.log).toEqual(["a", "b", "c"]);
  });

  it("each system gets a forked rng — sibling order doesn't perturb draws", () => {
    const draw: SimSystem<TestWorld> = {
      id: "drawer",
      step: (w, _dt, rng) => ({ ...w, randomDraws: [...w.randomDraws, rng.next()] }),
    };
    const noop: SimSystem<TestWorld> = { id: "noop", step: (w) => w };

    const a = runTick(makeWorld(), { systems: [draw, noop], rng: createRng(1), dt: 1 });
    const b = runTick(makeWorld(), { systems: [noop, draw], rng: createRng(1), dt: 1 });
    expect(a.randomDraws).toEqual(b.randomDraws);
  });

  it("two systems with the same id would get the same fork — guards against accidental collision", () => {
    const drawA: SimSystem<TestWorld> = {
      id: "shared",
      step: (w, _dt, rng) => ({ ...w, randomDraws: [...w.randomDraws, rng.next()] }),
    };
    const drawB: SimSystem<TestWorld> = {
      id: "shared",
      step: (w, _dt, rng) => ({ ...w, randomDraws: [...w.randomDraws, rng.next()] }),
    };
    const w = runTick(makeWorld(), { systems: [drawA, drawB], rng: createRng(1), dt: 1 });
    // Same fork label → same rng instance per fork → same first draw.
    expect(w.randomDraws[0]).toBe(w.randomDraws[1]);
  });

  it("is deterministic: same world + seed + system list → same output across N ticks", () => {
    const sys: SimSystem<TestWorld> = {
      id: "tick-counter",
      step: (w, _dt, rng) => ({
        ...w,
        counter: w.counter + 1,
        randomDraws: [...w.randomDraws, rng.next()],
      }),
    };
    const a = runTicks(makeWorld(), { systems: [sys], rng: createRng(42), dt: 1 / 60 }, 30);
    const b = runTicks(makeWorld(), { systems: [sys], rng: createRng(42), dt: 1 / 60 }, 30);
    expect(a).toEqual(b);
    expect(a.counter).toBe(30);
    expect(a.tickIndex).toBe(30);
    expect(a.now).toBeCloseTo(0.5);
  });

  it("does not mutate the input world", () => {
    const w = makeWorld();
    const before = JSON.stringify(w);
    runTick(w, {
      systems: [{ id: "x", step: (s) => ({ ...s, counter: 99 }) }],
      rng: createRng(1),
      dt: 1 / 60,
    });
    expect(JSON.stringify(w)).toBe(before);
  });
});
