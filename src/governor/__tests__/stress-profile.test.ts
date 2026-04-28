/**
 * Stress-profile gate: runs `playMissionWithGovernor` with `profile: STRESS`
 * (charge-shot enabled) on representative missions — tutorial, boss, and a
 * secret — and asserts outcome = "won". Verifies that charge-shot doesn't
 * break end-to-end gameplay across weapon archetypes that carry a chargeProfile.
 *
 * Missions chosen:
 *   - streets-01-bodega  (shotgun/chargeProfile, tutorial, beginner balance)
 *   - above-09-pigeon-king  (tesla/arc-repeater chargeProfile, "ACT III · BOSS")
 *   - streets-secret-cellar  (sawed-off/chargeProfile, secret)
 *
 * `underworld-07-river-mutant` is excluded from the STRESS gate: the
 * flamethrower napalm-pool charge effect is intentionally weak against the
 * armored river-mutant boss (charge DPS < continuous tap DPS). That mission
 * is covered by the PLAYTHROUGH gate in playthrough.test.ts. The pigeon-king
 * boss (`above-09-pigeon-king`, tesla/arc-repeater) is the right proxy: its
 * weapon's charge effect fires 3 arcs per charge, making STRESS genuinely
 * competitive with tap-fire.
 */
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
