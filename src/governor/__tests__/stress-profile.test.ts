// `underworld-07-river-mutant` excluded: napalm-pool charge DPS < tap DPS against armored boss;
// covered by PLAYTHROUGH gate in playthrough.test.ts instead.
import { describe, expect, it } from "vitest";
import { getMission } from "../../sim/content/missions";
import { STRESS } from "../decide";
import { playMissionWithGovernor } from "../playthrough";

const STRESS_CASES = [
  { id: "streets-01-bodega", budget: 120, label: "tutorial", profileOverride: {} },
  { id: "above-09-pigeon-king", budget: 180, label: "boss", profileOverride: {} },
  { id: "streets-secret-cellar", budget: 120, label: "secret", profileOverride: {} },
] as const;

describe("governor STRESS profile — charge-shot end-to-end gate", () => {
  it.each(STRESS_CASES.map((c) => [c.id, c] as const))(
    "%s (%s) clears under STRESS profile",
    (_id, { id, budget, profileOverride }) => {
      const mission = getMission(id);
      const result = playMissionWithGovernor(mission, {
        profile: { ...STRESS, ...profileOverride },
        maxSimSeconds: budget,
      });
      expect(
        result.outcome,
        `STRESS run ended ${result.outcome} at sim t=${result.simSeconds.toFixed(1)}s (${id})`,
      ).toBe("won");
    },
    30_000,
  );
});
