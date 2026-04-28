import { describe, expect, it } from "vitest";
import {
  computeMissionGrade,
  initialScoreState,
  type KillEvent,
  MULTIPLIER_BASE,
  MULTIPLIER_CAP,
  MULTIPLIER_GRACE_S,
  MULTIPLIER_KILL_DELTA,
  MULTIPLIER_STYLE_DELTA,
  recordCollectible,
  recordKill,
  recordMiss,
  recordReload,
  STYLE_HEADSHOT_PCT,
  STYLE_VARIETY_PCT,
  tickDecay,
} from "../scoring";

const baseKill: KillEvent = {
  archetypeId: "rat",
  baseBounty: 30,
  healthScale: 1,
  isHeadshot: false,
  isMidAir: false,
  isTwoForOne: false,
};

describe("recordKill", () => {
  it("plain kill: base * multiplier, +0.1 multiplier, no flashes", () => {
    const after = recordKill(initialScoreState, baseKill, 1);
    expect(after.total).toBe(30 * 1.1);
    expect(after.multiplier).toBeCloseTo(MULTIPLIER_BASE + MULTIPLIER_KILL_DELTA);
    expect(after.modifierFlashes).toEqual([]);
  });

  it("headshot kill: +50% bonus + style multiplier delta", () => {
    const after = recordKill(initialScoreState, { ...baseKill, isHeadshot: true }, 1);
    const expected = Math.round(30 * (1 + STYLE_HEADSHOT_PCT) * (1 + MULTIPLIER_STYLE_DELTA));
    expect(after.total).toBe(expected);
    expect(after.modifierFlashes.map((f) => f.kind)).toEqual(["headshot"]);
  });

  it("two-for-one stacks with headshot in modifierBonusPct", () => {
    const after = recordKill(
      initialScoreState,
      { ...baseKill, isHeadshot: true, isTwoForOne: true },
      0,
    );
    expect(after.modifierFlashes.map((f) => f.kind).sort()).toEqual(
      ["headshot", "two-for-one"].sort(),
    );
  });

  it("mid-air bonus emits a flash and increases score", () => {
    const plain = recordKill(initialScoreState, baseKill, 0);
    const air = recordKill(initialScoreState, { ...baseKill, isMidAir: true }, 0);
    expect(air.total).toBeGreaterThan(plain.total);
    expect(air.modifierFlashes.some((f) => f.kind === "mid-air")).toBe(true);
  });

  it("variety bonus fires after 3 unique archetypes in last 4", () => {
    let s = initialScoreState;
    s = recordKill(s, { ...baseKill, archetypeId: "rat" }, 0);
    s = recordKill(s, { ...baseKill, archetypeId: "roach" }, 1);
    s = recordKill(s, { ...baseKill, archetypeId: "pigeon" }, 2);
    expect(
      s.modifierFlashes.some((f) => f.kind === "variety" && f.bonusPct === STYLE_VARIETY_PCT),
    ).toBe(true);
  });

  it("variety NOT triggered by 3 of the same kind", () => {
    let s = initialScoreState;
    s = recordKill(s, { ...baseKill, archetypeId: "rat" }, 0);
    s = recordKill(s, { ...baseKill, archetypeId: "rat" }, 1);
    s = recordKill(s, { ...baseKill, archetypeId: "rat" }, 2);
    expect(s.modifierFlashes.some((f) => f.kind === "variety")).toBe(false);
  });

  it("no-reload: no bonus until streak reaches 10", () => {
    let s = initialScoreState;
    for (let i = 0; i < 9; i++) s = recordKill(s, baseKill, i);
    expect(s.modifierFlashes.some((f) => f.kind === "no-reload")).toBe(false);
    s = recordKill(s, baseKill, 10);
    expect(s.modifierFlashes.some((f) => f.kind === "no-reload")).toBe(true);
  });

  it("no-reload bonus caps at +50%", () => {
    let s = initialScoreState;
    for (let i = 0; i < 30; i++) s = recordKill(s, baseKill, i);
    const last = s.modifierFlashes.filter((f) => f.kind === "no-reload").pop();
    expect(last?.bonusPct).toBeLessThanOrEqual(0.5);
  });

  it("multiplier caps at MULTIPLIER_CAP", () => {
    let s = initialScoreState;
    for (let i = 0; i < 200; i++) {
      s = recordKill(s, { ...baseKill, isHeadshot: true }, i);
    }
    expect(s.multiplier).toBe(MULTIPLIER_CAP);
  });

  it("grace + decay-at are pushed into the future on every kill", () => {
    const now = 5;
    const after = recordKill(initialScoreState, baseKill, now);
    expect(after.multiplierGraceUntil).toBe(now + MULTIPLIER_GRACE_S);
    expect(after.multiplierDecayAt).toBe(now + MULTIPLIER_GRACE_S);
  });

  it("scales bounty by healthScale", () => {
    const fat = recordKill(initialScoreState, { ...baseKill, healthScale: 2 }, 0);
    const norm = recordKill(initialScoreState, baseKill, 0);
    expect(fat.total).toBe(norm.total * 2);
  });
});

describe("recordMiss", () => {
  it("multiplies by 0.85 but never below MULTIPLIER_BASE", () => {
    let s = recordKill(initialScoreState, { ...baseKill, isHeadshot: true }, 0);
    const beforeM = s.multiplier;
    s = recordMiss(s, 1);
    expect(s.multiplier).toBeCloseTo(Math.max(MULTIPLIER_BASE, beforeM * 0.85));
  });

  it("a miss from idle leaves multiplier at base", () => {
    expect(recordMiss(initialScoreState, 0).multiplier).toBe(MULTIPLIER_BASE);
  });
});

describe("recordReload", () => {
  it("zeroes the no-reload streak only", () => {
    const s1 = recordKill(initialScoreState, baseKill, 0);
    const s2 = recordKill(s1, baseKill, 1);
    expect(s2.noReloadStreak).toBe(2);
    const s3 = recordReload(s2);
    expect(s3.noReloadStreak).toBe(0);
    expect(s3.total).toBe(s2.total);
    expect(s3.multiplier).toBe(s2.multiplier);
  });
});

describe("recordCollectible", () => {
  it("extends multiplier grace by COLLECTIBLE_GRACE_BONUS_S", () => {
    const s = recordCollectible(initialScoreState, 10);
    expect(s.multiplierGraceUntil).toBeGreaterThanOrEqual(15);
    expect(s.multiplierDecayAt).toBeGreaterThanOrEqual(15);
  });
});

describe("tickDecay", () => {
  it("does nothing during grace", () => {
    const s = recordKill(initialScoreState, baseKill, 0);
    expect(tickDecay(s, MULTIPLIER_GRACE_S - 0.1).multiplier).toBe(s.multiplier);
  });

  it("decays after grace expires", () => {
    let s = recordKill(initialScoreState, { ...baseKill, isHeadshot: true }, 0);
    const start = s.multiplier;
    s = tickDecay(s, MULTIPLIER_GRACE_S + 1);
    expect(s.multiplier).toBeLessThan(start);
    expect(s.multiplier).toBeGreaterThanOrEqual(MULTIPLIER_BASE);
  });

  it("never decays below MULTIPLIER_BASE", () => {
    let s = recordKill(initialScoreState, baseKill, 0);
    s = tickDecay(s, 60);
    expect(s.multiplier).toBe(MULTIPLIER_BASE);
  });
});

describe("computeMissionGrade", () => {
  const par = { parScore: 1000, parAccuracy: 0.7 };
  const stats = {
    shotsFired: 100,
    shotsHit: 80,
    artifactsFound: 2,
    artifactsAvailable: 2,
    livesLost: 0,
    damageTaken: 0,
    killsByArchetype: {},
  };

  it("perfect run scores S+", () => {
    const r = computeMissionGrade(2000, stats, par);
    expect(r.grade).toBe("S+");
    expect(r.components.score).toBe(1.5);
    expect(r.components.accuracy).toBeCloseTo(0.8);
  });

  it("zero score with zero accuracy = F", () => {
    const r = computeMissionGrade(0, { ...stats, shotsFired: 100, shotsHit: 0 }, par);
    expect(r.grade).toBe("F");
  });

  it("score exactly at par with high accuracy + full artifacts ~ S", () => {
    const r = computeMissionGrade(par.parScore, stats, par);
    expect(r.components.score).toBe(1.0);
    expect(["A", "S"]).toContain(r.grade);
  });

  it("zero artifacts available = collect = 1.0 (no penalty)", () => {
    const r = computeMissionGrade(
      1000,
      { ...stats, artifactsAvailable: 0, artifactsFound: 0 },
      par,
    );
    expect(r.components.collect).toBe(1);
  });

  it("zero shotsFired returns accuracy 0", () => {
    const r = computeMissionGrade(0, { ...stats, shotsFired: 0, shotsHit: 0 }, par);
    expect(r.components.accuracy).toBe(0);
  });
});
