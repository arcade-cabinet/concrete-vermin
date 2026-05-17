import { describe, expect, it } from "vitest";
import { MISSIONS, SECRET_MISSIONS } from "../../sim/content/missions";
import { STRESS } from "../decide";
import { gradeFromScore, playMissionWithGovernor } from "../playthrough";

const ALL_MISSIONS = [...MISSIONS, ...SECRET_MISSIONS];

// STRESS profile verifies tap-fire AND charge-fire are BOTH viable. If any
// mission would only pass under one profile, the per-weapon charge profile
// (cost, cooldown, charge-time) gets tuned per docs/plans §2.7 — we never
// weaken tap-fire numbers to compensate.
describe("governor STRESS profile — charge-shot end-to-end gate (every mission)", () => {
  it.each(ALL_MISSIONS.map((m) => [m.id, m] as const))(
    "%s clears with grade ≥ B under STRESS",
    (_id, mission) => {
      const budget = mission.id === "underworld-07-river-mutant" ? 240 : 120;
      const result = playMissionWithGovernor(mission, {
        profile: STRESS,
        maxSimSeconds: budget,
      });
      expect(
        result.outcome,
        `STRESS run ended ${result.outcome} at sim t=${result.simSeconds.toFixed(1)}s (${mission.id})`,
      ).toBe("won");
      const grade = gradeFromScore(result.scoreTotal);
      expect(["S+", "S", "A", "B"], `STRESS grade was ${grade} for ${mission.id}`).toContain(grade);
    },
    30_000,
  );
});
