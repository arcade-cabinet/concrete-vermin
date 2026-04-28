import { describe, expect, it } from "vitest";
import { ACT_IDS } from "../../../factories/mission";
import { FIRST_MISSION_ID, getMission, listMissionsByAct, MISSIONS } from "../index";

describe("mission registry", () => {
  it("exposes 9 missions", () => {
    expect(MISSIONS).toHaveLength(9);
  });

  it("has unique ids", () => {
    const ids = MISSIONS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getMission returns by id and throws on unknown", () => {
    expect(getMission(FIRST_MISSION_ID).id).toBe(FIRST_MISSION_ID);
    expect(() => getMission("nope")).toThrow(/unknown mission/);
  });

  it("listMissionsByAct buckets correctly (4 streets, 3 underworld, 2 above)", () => {
    expect(listMissionsByAct("streets")).toHaveLength(4);
    expect(listMissionsByAct("underworld")).toHaveLength(3);
    expect(listMissionsByAct("above")).toHaveLength(2);
  });

  it("each act has at least one boss-scripted encounter", () => {
    for (const act of ACT_IDS) {
      const ms = listMissionsByAct(act);
      const hasBoss = ms.some((m) =>
        m.encounters.some((e) => e.spawns.some((s) => s.pattern === "boss-scripted")),
      );
      expect(hasBoss, `act ${act} missing boss`).toBe(true);
    }
  });
});
