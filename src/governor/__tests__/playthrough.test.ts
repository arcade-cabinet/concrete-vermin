import { describe, expect, it } from "vitest";
import { MISSIONS, SECRET_MISSIONS } from "../../sim/content/missions";
import { gradeFromScore, playMissionWithGovernor } from "../playthrough";

const ALL_MISSIONS = [...MISSIONS, ...SECRET_MISSIONS];

describe("mission registry sanity", () => {
  it("ALL_MISSIONS is non-empty", () => {
    expect(ALL_MISSIONS.length).toBeGreaterThan(0);
  });
});

describe("governor end-to-end playthrough — strict gate", () => {
  it.each(ALL_MISSIONS.map((m) => [m.id, m] as const))(
    "%s clears with grade ≥ B",
    (_id, mission) => {
      const budget = mission.id === "underworld-07-river-mutant" ? 240 : 120;
      const result = playMissionWithGovernor(mission, { maxSimSeconds: budget });
      expect(
        result.outcome,
        `mission ended ${result.outcome} at sim t=${result.simSeconds.toFixed(1)}s`,
      ).toBe("won");
      const grade = gradeFromScore(result.scoreTotal);
      expect(["S+", "S", "A", "B"]).toContain(grade);
    },
    30_000,
  );
});
