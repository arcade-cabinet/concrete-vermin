/**
 * Predicate tests for the achievement registry. Each id must trigger
 * under exactly the conditions documented in its description, and must
 * not trigger when the conditions aren't met.
 */
import { describe, expect, it } from "vitest";
import {
  ACHIEVEMENTS,
  type AchievementContext,
  evaluateAchievements,
  getAchievement,
} from "../content/achievements";

const baseCtx = (overrides: Partial<AchievementContext> = {}): AchievementContext => ({
  missionId: "streets-01-bodega",
  missionAct: "streets",
  missionScore: 0,
  missionKills: 0,
  missionHeadshots: 0,
  missionCrits: 0,
  missionBossKills: 0,
  missionDamageTaken: 0,
  missionReloads: 0,
  missionMultiKill: { twoKill: 0, threeKill: 0, fiveKill: 0 },
  missionNoReload: false,
  missionWon: false,
  lifetime: { cashEarned: 0, missionsCompleted: 0, achievementsUnlocked: 0 },
  ...overrides,
});

describe("achievements registry", () => {
  it("includes at least 20 achievements", () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(20);
  });

  it("every id is unique", () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getAchievement returns the matching entry", () => {
    const a = getAchievement("first-blood");
    expect(a?.name).toBe("First Blood");
  });
});

describe("evaluateAchievements — bronze", () => {
  it("first-blood triggers on missionKills >= 1", () => {
    const ids = evaluateAchievements(baseCtx({ missionKills: 1 }), []);
    expect(ids).toContain("first-blood");
  });

  it("first-clear triggers on missionWon", () => {
    const ids = evaluateAchievements(baseCtx({ missionWon: true }), []);
    expect(ids).toContain("first-clear");
  });

  it("ten-kills triggers at 10 kills, not 9", () => {
    expect(evaluateAchievements(baseCtx({ missionKills: 9 }), [])).not.toContain("ten-kills");
    expect(evaluateAchievements(baseCtx({ missionKills: 10 }), [])).toContain("ten-kills");
  });

  it("first-cash triggers at lifetime $100", () => {
    expect(
      evaluateAchievements(baseCtx({ lifetime: { cashEarned: 100, missionsCompleted: 0, achievementsUnlocked: 0 } }), []),
    ).toContain("first-cash");
  });

  it("first-headshot triggers on missionHeadshots >= 1", () => {
    expect(evaluateAchievements(baseCtx({ missionHeadshots: 1 }), [])).toContain("first-headshot");
  });

  it("first-multi-kill triggers on twoKill", () => {
    expect(
      evaluateAchievements(baseCtx({ missionMultiKill: { twoKill: 1, threeKill: 0, fiveKill: 0 } }), []),
    ).toContain("first-multi-kill");
  });
});

describe("evaluateAchievements — silver", () => {
  it("no-damage-streets requires win + streets + zero damage", () => {
    const ids = evaluateAchievements(
      baseCtx({ missionWon: true, missionAct: "streets", missionDamageTaken: 0 }),
      [],
    );
    expect(ids).toContain("no-damage-streets");
    // Damage taken kills the unlock.
    const ids2 = evaluateAchievements(
      baseCtx({ missionWon: true, missionAct: "streets", missionDamageTaken: 5 }),
      [],
    );
    expect(ids2).not.toContain("no-damage-streets");
    // Wrong act doesn't trigger streets-tier.
    const ids3 = evaluateAchievements(
      baseCtx({ missionWon: true, missionAct: "underworld", missionDamageTaken: 0 }),
      [],
    );
    expect(ids3).not.toContain("no-damage-streets");
  });

  it("five-kill triggers on fiveKill multi", () => {
    expect(
      evaluateAchievements(baseCtx({ missionMultiKill: { twoKill: 0, threeKill: 0, fiveKill: 1 } }), []),
    ).toContain("five-kill");
  });

  it("no-reload-clear requires win + noReload", () => {
    expect(
      evaluateAchievements(baseCtx({ missionWon: true, missionNoReload: true }), []),
    ).toContain("no-reload-clear");
    expect(
      evaluateAchievements(baseCtx({ missionWon: false, missionNoReload: true }), []),
    ).not.toContain("no-reload-clear");
  });

  it("thousand-cash triggers at $1000 lifetime", () => {
    expect(
      evaluateAchievements(
        baseCtx({ lifetime: { cashEarned: 1000, missionsCompleted: 0, achievementsUnlocked: 0 } }),
        [],
      ),
    ).toContain("thousand-cash");
  });

  it("boss-kill triggers on missionBossKills >= 1", () => {
    expect(evaluateAchievements(baseCtx({ missionBossKills: 1 }), [])).toContain("boss-kill");
  });
});

describe("evaluateAchievements — gold", () => {
  it("s-grade-streets requires win + streets + S grade", () => {
    expect(
      evaluateAchievements(
        baseCtx({ missionWon: true, missionAct: "streets", missionGrade: "S" }),
        [],
      ),
    ).toContain("s-grade-streets");
    expect(
      evaluateAchievements(
        baseCtx({ missionWon: true, missionAct: "streets", missionGrade: "A" }),
        [],
      ),
    ).not.toContain("s-grade-streets");
  });

  it("all-missions-cleared triggers at 8 missionsCompleted", () => {
    expect(
      evaluateAchievements(
        baseCtx({ lifetime: { cashEarned: 0, missionsCompleted: 8, achievementsUnlocked: 0 } }),
        [],
      ),
    ).toContain("all-missions-cleared");
  });
});

describe("evaluateAchievements — already-unlocked filter", () => {
  it("does not re-unlock", () => {
    const ids = evaluateAchievements(baseCtx({ missionKills: 1 }), ["first-blood"]);
    expect(ids).not.toContain("first-blood");
  });
});

describe("evaluateAchievements — secret tier", () => {
  it("secret-completionist triggers at 20 unlocked", () => {
    expect(
      evaluateAchievements(
        baseCtx({ lifetime: { cashEarned: 0, missionsCompleted: 0, achievementsUnlocked: 20 } }),
        [],
      ),
    ).toContain("secret-completionist");
  });

  it("secret-pigeon-king is gated by the runtime tracker (predicate is always false)", () => {
    // The fast-boss-kill timing event is published from the runtime, not
    // the context; the registry predicate intentionally returns false so
    // the only unlock path is the dedicated event hook in the tracker.
    expect(evaluateAchievements(baseCtx({ missionBossKills: 1 }), [])).not.toContain(
      "secret-pigeon-king",
    );
  });
});
