import { describe, expect, it } from "vitest";
import { createRng } from "../../rng";
import {
  composeEncounter,
  encounterSpecSchema,
  planSpawnPattern,
  SPAWN_PATTERNS,
  type SpawnPattern,
} from "../encounter";

describe("planSpawnPattern", () => {
  it("returns one entry per count", () => {
    for (const pattern of SPAWN_PATTERNS) {
      const records = planSpawnPattern(pattern, 5, createRng(1));
      expect(records.length).toBe(5);
    }
  });

  it("returns no entries for non-positive count", () => {
    expect(planSpawnPattern("left-flood", 0, createRng(1))).toEqual([]);
    expect(planSpawnPattern("left-flood", -2, createRng(1))).toEqual([]);
  });

  it("rejects counts beyond the safety cap of 64", () => {
    expect(() => planSpawnPattern("left-flood", 100, createRng(1))).toThrow();
  });

  it("delays are monotonically non-decreasing per pattern", () => {
    for (const pattern of SPAWN_PATTERNS) {
      const records = planSpawnPattern(pattern, 8, createRng(1));
      for (let i = 1; i < records.length; i++) {
        const prev = records[i - 1];
        const cur = records[i];
        if (!prev || !cur) continue;
        expect(cur.delayS).toBeGreaterThanOrEqual(prev.delayS);
      }
    }
  });

  it("left-flood and right-flood put spawns at opposite x edges", () => {
    const left = planSpawnPattern("left-flood", 4, createRng(1));
    const right = planSpawnPattern("right-flood", 4, createRng(1));
    for (const r of left) expect(r.position.x).toBeLessThan(0.2);
    for (const r of right) expect(r.position.x).toBeGreaterThan(0.8);
    for (const r of left) expect(r.velocity.x).toBeGreaterThan(0);
    for (const r of right) expect(r.velocity.x).toBeLessThan(0);
  });

  it("ceiling-drop has positive y velocity (falling)", () => {
    for (const r of planSpawnPattern("ceiling-drop", 5, createRng(1))) {
      expect(r.velocity.y).toBeGreaterThan(0);
      expect(r.position.y).toBeLessThan(0.2);
    }
  });

  it("dive-from-sky starts high and dives downward", () => {
    for (const r of planSpawnPattern("dive-from-sky", 5, createRng(1))) {
      expect(r.position.y).toBeLessThan(0.2);
      expect(r.velocity.y).toBeGreaterThan(0);
    }
  });

  it("surface-from-grate originates near the floor and pushes up", () => {
    for (const r of planSpawnPattern("surface-from-grate", 5, createRng(1))) {
      expect(r.position.y).toBeGreaterThan(0.85);
      expect(r.velocity.y).toBeLessThan(0);
    }
  });

  it("mixed-wave alternates left/right (sees both signs of velocity.x)", () => {
    const records = planSpawnPattern("mixed-wave", 6, createRng(1));
    const xs = records.map((r) => Math.sign(r.velocity.x));
    expect(xs).toContain(1);
    expect(xs).toContain(-1);
  });

  it("boss-scripted spawns center-stage with no initial velocity", () => {
    for (const r of planSpawnPattern("boss-scripted", 1, createRng(1))) {
      expect(r.position.x).toBe(0.5);
      expect(r.position.y).toBe(0.5);
      expect(r.velocity).toEqual({ x: 0, y: 0 });
    }
  });

  it("is deterministic — same rng yields same records", () => {
    for (const pattern of SPAWN_PATTERNS as readonly SpawnPattern[]) {
      const a = planSpawnPattern(pattern, 5, createRng(7));
      const b = planSpawnPattern(pattern, 5, createRng(7));
      expect(a).toEqual(b);
    }
  });
});

describe("encounterSpecSchema", () => {
  it("rejects missing variant", () => {
    expect(() =>
      encounterSpecSchema.parse({
        id: "e",
        spawns: [{ count: 1, pattern: "left-flood" }],
      }),
    ).toThrow();
  });

  it("rejects unknown patterns", () => {
    expect(() =>
      encounterSpecSchema.parse({
        id: "e",
        spawns: [{ variant: "v", count: 1, pattern: "no-such-pattern" }],
      }),
    ).toThrow();
  });

  it("rejects empty spawns array", () => {
    expect(() => encounterSpecSchema.parse({ id: "e", spawns: [] })).toThrow();
  });

  it("accepts a minimal valid spec", () => {
    const parsed = encounterSpecSchema.parse({
      id: "tutorial-1",
      spawns: [{ variant: "sewer-rat", count: 4, pattern: "left-flood" }],
    });
    expect(parsed.isCheckpoint).toBe(false);
  });
});

describe("composeEncounter", () => {
  it("produces one schedule per spawn spec", () => {
    const enc = composeEncounter(
      {
        id: "e1",
        spawns: [
          { variant: "sewer-rat", count: 3, pattern: "left-flood" },
          { variant: "subway-roach", count: 2, pattern: "ceiling-drop" },
        ],
      },
      createRng(1),
    );
    expect(enc.schedules.length).toBe(2);
    expect(enc.schedules[0]?.schedule.length).toBe(3);
    expect(enc.schedules[1]?.schedule.length).toBe(2);
  });

  it("freezes schedules at every level", () => {
    const enc = composeEncounter(
      { id: "e", spawns: [{ variant: "v", count: 1, pattern: "left-flood" }] },
      createRng(1),
    );
    expect(Object.isFrozen(enc.schedules)).toBe(true);
    expect(Object.isFrozen(enc.schedules[0])).toBe(true);
    expect(Object.isFrozen(enc.schedules[0]?.schedule[0])).toBe(true);
  });

  it("is deterministic", () => {
    const spec = {
      id: "e",
      spawns: [
        { variant: "v1", count: 4, pattern: "left-flood" as const },
        { variant: "v2", count: 4, pattern: "right-flood" as const },
      ],
    };
    const a = composeEncounter(spec, createRng(99));
    const b = composeEncounter(spec, createRng(99));
    expect(a).toEqual(b);
  });

  it("uses forked rngs so sibling spawns don't disturb each other", () => {
    // Swapping the order of spawns should not change a given variant's
    // schedule, because each variant has its own forked rng stream.
    const spec1 = {
      id: "e",
      spawns: [
        { variant: "a", count: 4, pattern: "left-flood" as const },
        { variant: "b", count: 4, pattern: "right-flood" as const },
      ],
    };
    const spec2 = {
      id: "e",
      spawns: [
        { variant: "b", count: 4, pattern: "right-flood" as const },
        { variant: "a", count: 4, pattern: "left-flood" as const },
      ],
    };
    const e1 = composeEncounter(spec1, createRng(123));
    const e2 = composeEncounter(spec2, createRng(123));
    const aOf = (e: typeof e1) => e.schedules.find((s) => s.variant === "a");
    expect(aOf(e1)).toEqual(aOf(e2));
  });
});
