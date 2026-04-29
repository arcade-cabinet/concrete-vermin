import { describe, expect, it } from "vitest";
import {
  MISSIONS,
  SECRET_MISSIONS,
  getMission,
  listSecretMissionsByAct,
} from "../content/missions";
import { ACT_IDS, defineMission } from "../factories/mission";

describe("secret missions catalog", () => {
  it("declares exactly three secret missions, one per act", () => {
    expect(SECRET_MISSIONS).toHaveLength(3);
    const acts = new Set(SECRET_MISSIONS.map((m) => m.act));
    expect(acts.size).toBe(3);
    for (const act of ACT_IDS) {
      expect(listSecretMissionsByAct(act)).toHaveLength(1);
    }
  });

  it("every secret mission has secret=true and a real anchor", () => {
    const canonicalIds = new Set(MISSIONS.map((m) => m.id));
    for (const s of SECRET_MISSIONS) {
      expect(s.secret).toBe(true);
      expect(s.sGradeUnlockFrom).toBeDefined();
      expect(canonicalIds.has(s.sGradeUnlockFrom!)).toBe(true);
    }
  });

  it("secret missions are excluded from the linear MISSIONS list", () => {
    const linearIds = new Set(MISSIONS.map((m) => m.id));
    for (const s of SECRET_MISSIONS) {
      expect(linearIds.has(s.id)).toBe(false);
    }
  });

  it("getMission resolves both linear and secret ids", () => {
    for (const s of SECRET_MISSIONS) {
      expect(getMission(s.id).id).toBe(s.id);
    }
  });

  it("each secret mission carries 3-5 dynamic events like the canonical ones", () => {
    for (const s of SECRET_MISSIONS) {
      expect(s.events.length).toBeGreaterThanOrEqual(3);
      expect(s.events.length).toBeLessThanOrEqual(5);
    }
  });

  it("schema rejects secret missions without sGradeUnlockFrom", () => {
    expect(() =>
      defineMission({
        id: "bad-secret",
        act: "streets",
        weapon: "shotgun",
        secret: true,
        cutscene: {
          interstitial: { title: "X", body: "twenty char body twenty char body", skipAfterMs: 0 },
        },
        encounters: [
          {
            id: "x",
            isCheckpoint: true,
            spawns: [{ variant: "rat-mangy", count: 1, pattern: "left-flood" }],
          },
        ],
      }),
    ).toThrow(/sGradeUnlockFrom/);
  });
});
