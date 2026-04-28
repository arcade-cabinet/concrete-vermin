import { describe, expect, it } from "vitest";
import { accumulate, initialRunStats, type RunEvent, type RunStats, summarize } from "../runStats";

const fold = (events: RunEvent[]): RunStats =>
  events.reduce((s, e) => accumulate(s, e), initialRunStats);

describe("accumulate", () => {
  it("counts shots fired and hit independently", () => {
    const s = fold([
      { kind: "shot-fired" },
      { kind: "shot-fired" },
      { kind: "shot-fired" },
      { kind: "shot-hit" },
      { kind: "shot-hit" },
    ]);
    expect(s.shotsFired).toBe(3);
    expect(s.shotsHit).toBe(2);
  });

  it("kill aggregates per-archetype and total", () => {
    const s = fold([
      { kind: "kill", archetypeId: "rat", at: 0 },
      { kind: "kill", archetypeId: "rat", at: 1 },
      { kind: "kill", archetypeId: "pigeon", at: 2 },
    ]);
    expect(s.killsByArchetype.rat).toBe(2);
    expect(s.killsByArchetype.pigeon).toBe(1);
    expect(s.totalKills).toBe(3);
  });

  it("damage-taken sums amounts", () => {
    const s = fold([
      { kind: "damage-taken", amount: 5 },
      { kind: "damage-taken", amount: 3 },
    ]);
    expect(s.damageTaken).toBe(8);
  });

  it("life-lost increments", () => {
    const s = fold([{ kind: "life-lost" }, { kind: "life-lost" }]);
    expect(s.livesLost).toBe(2);
  });

  it("artifact registered/found tracked separately", () => {
    const s = fold([
      { kind: "artifact-registered" },
      { kind: "artifact-registered" },
      { kind: "artifact-found" },
    ]);
    expect(s.artifactsAvailable).toBe(2);
    expect(s.artifactsFound).toBe(1);
  });

  it("multiplier-sample tracks max only", () => {
    const s = fold([
      { kind: "multiplier-sample", value: 1.5 },
      { kind: "multiplier-sample", value: 3.2 },
      { kind: "multiplier-sample", value: 2.0 },
    ]);
    expect(s.maxMultiplier).toBe(3.2);
  });

  it("multiplier never decreases below initial 1", () => {
    const s = fold([{ kind: "multiplier-sample", value: 0.1 }]);
    expect(s.maxMultiplier).toBe(1);
  });
});

describe("hot-moment detection", () => {
  it("emits a hot moment when 5 kills happen within 4 seconds", () => {
    const s = fold([
      { kind: "kill", archetypeId: "rat", at: 0 },
      { kind: "kill", archetypeId: "rat", at: 1 },
      { kind: "kill", archetypeId: "rat", at: 2 },
      { kind: "kill", archetypeId: "rat", at: 3 },
      { kind: "kill", archetypeId: "rat", at: 3.5 },
    ]);
    expect(s.hotMoments.length).toBe(1);
    expect(s.hotMoments[0]?.kills).toBe(5);
  });

  it("does NOT emit a hot moment if kills span >4 seconds", () => {
    const s = fold([
      { kind: "kill", archetypeId: "rat", at: 0 },
      { kind: "kill", archetypeId: "rat", at: 2 },
      { kind: "kill", archetypeId: "rat", at: 4 },
      { kind: "kill", archetypeId: "rat", at: 6 },
      { kind: "kill", archetypeId: "rat", at: 8 },
    ]);
    expect(s.hotMoments).toEqual([]);
  });

  it("extends a hot moment as more kills land in the same window", () => {
    const s = fold([
      { kind: "kill", archetypeId: "rat", at: 0 },
      { kind: "kill", archetypeId: "rat", at: 0.5 },
      { kind: "kill", archetypeId: "rat", at: 1 },
      { kind: "kill", archetypeId: "rat", at: 1.5 },
      { kind: "kill", archetypeId: "rat", at: 2 },
      { kind: "kill", archetypeId: "rat", at: 2.5 },
    ]);
    expect(s.hotMoments.length).toBe(1);
    expect(s.hotMoments[0]?.kills).toBe(6);
    expect(s.hotMoments[0]?.endAt).toBe(2.5);
  });

  it("starts a new hot moment after the previous window slides past", () => {
    const s = fold([
      // First burst: 5 kills @ 0..3
      { kind: "kill", archetypeId: "rat", at: 0 },
      { kind: "kill", archetypeId: "rat", at: 0.5 },
      { kind: "kill", archetypeId: "rat", at: 1 },
      { kind: "kill", archetypeId: "rat", at: 2 },
      { kind: "kill", archetypeId: "rat", at: 3 },
      // Long gap
      { kind: "kill", archetypeId: "rat", at: 30 },
      // Second burst: 4 more in the window @ 31..32.5
      { kind: "kill", archetypeId: "rat", at: 31 },
      { kind: "kill", archetypeId: "rat", at: 31.5 },
      { kind: "kill", archetypeId: "rat", at: 32 },
      { kind: "kill", archetypeId: "rat", at: 32.5 },
    ]);
    expect(s.hotMoments.length).toBe(2);
    expect(s.hotMoments[0]?.startAt).toBe(0);
    expect(s.hotMoments[1]?.startAt).toBe(30);
  });
});

describe("summarize", () => {
  it("trims to MissionStats + side-data", () => {
    const s = fold([
      { kind: "shot-fired" },
      { kind: "shot-fired" },
      { kind: "shot-hit" },
      { kind: "kill", archetypeId: "rat", at: 0 },
      { kind: "damage-taken", amount: 4 },
      { kind: "life-lost" },
      { kind: "artifact-registered" },
      { kind: "artifact-found" },
      { kind: "multiplier-sample", value: 2.5 },
    ]);
    const r = summarize(s);
    expect(r.stats).toEqual({
      shotsFired: 2,
      shotsHit: 1,
      artifactsFound: 1,
      artifactsAvailable: 1,
      livesLost: 1,
      damageTaken: 4,
      killsByArchetype: { rat: 1 },
    });
    expect(r.maxMultiplier).toBe(2.5);
    expect(r.totalKills).toBe(1);
    expect(r.hotMoments).toEqual([]);
  });
});

describe("immutability", () => {
  it("does not mutate the input snapshot", () => {
    const before = JSON.stringify(initialRunStats);
    accumulate(initialRunStats, { kind: "kill", archetypeId: "rat", at: 0 });
    expect(JSON.stringify(initialRunStats)).toBe(before);
  });
});
