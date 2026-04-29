import { beforeEach, describe, expect, it } from "vitest";
import { isMissionUnlocked, usePlayerProgress } from "../PlayerProgress";

describe("PlayerProgress", () => {
  beforeEach(() => {
    usePlayerProgress.getState().reset();
  });

  it("starts with shotgun unlocked, $0, no mods, no completed missions", () => {
    const s = usePlayerProgress.getState();
    expect(s.cash).toBe(0);
    expect(s.unlockedWeapons).toEqual(["shotgun"]);
    expect(s.activeMods).toEqual([]);
    expect(s.completedMissionIds).toEqual([]);
    expect(s.selectedMissionId).toBe("streets-01-bodega");
  });

  it("awardCash adds; spendCash debits and reports success/failure", () => {
    usePlayerProgress.getState().awardCash(50);
    expect(usePlayerProgress.getState().cash).toBe(50);
    expect(usePlayerProgress.getState().spendCash(20)).toBe(true);
    expect(usePlayerProgress.getState().cash).toBe(30);
    expect(usePlayerProgress.getState().spendCash(999)).toBe(false);
    expect(usePlayerProgress.getState().cash).toBe(30);
  });

  it("toggleMod is idempotent on/off", () => {
    usePlayerProgress.getState().toggleMod("tight-choke");
    expect(usePlayerProgress.getState().activeMods).toEqual(["tight-choke"]);
    usePlayerProgress.getState().toggleMod("tight-choke");
    expect(usePlayerProgress.getState().activeMods).toEqual([]);
  });

  it("first mission is always unlocked, others gate on prior completion", () => {
    expect(isMissionUnlocked("streets-01-bodega", [])).toBe(true);
    expect(isMissionUnlocked("streets-02-alley", [])).toBe(false);
    expect(isMissionUnlocked("streets-02-alley", ["streets-01-bodega"])).toBe(true);
  });

  it("unlockMission is additive and dedupes", () => {
    usePlayerProgress.getState().unlockMission("streets-01-bodega");
    usePlayerProgress.getState().unlockMission("streets-01-bodega");
    expect(usePlayerProgress.getState().completedMissionIds).toEqual(["streets-01-bodega"]);
  });

  it("secret missions stay locked without an S-grade on their anchor", () => {
    expect(isMissionUnlocked("streets-secret-cellar", ["streets-04-dumpster-bear"], [])).toBe(
      false,
    );
    expect(
      isMissionUnlocked(
        "streets-secret-cellar",
        ["streets-04-dumpster-bear"],
        ["streets-04-dumpster-bear"],
      ),
    ).toBe(true);
  });

  it("markSGradeEarned is additive and dedupes", () => {
    usePlayerProgress.getState().markSGradeEarned("streets-01-bodega");
    usePlayerProgress.getState().markSGradeEarned("streets-01-bodega");
    expect(usePlayerProgress.getState().sGradeMissionIds).toEqual(["streets-01-bodega"]);
  });

  it("each secret mission unlocks ONLY when its named anchor has an S-grade", () => {
    expect(isMissionUnlocked("underworld-secret-cathedral", [], [])).toBe(false);
    expect(isMissionUnlocked("underworld-secret-cathedral", [], ["streets-01-bodega"])).toBe(false);
    expect(
      isMissionUnlocked("underworld-secret-cathedral", [], ["underworld-07-river-mutant"]),
    ).toBe(true);
    expect(isMissionUnlocked("above-secret-grandfather", [], ["above-09-pigeon-king"])).toBe(true);
  });
});
