import { describe, expect, it } from "vitest";
import { MISSIONS, SECRET_MISSIONS } from "../../sim/content/missions";
import { gradeFromScore, playMissionWithGovernor } from "../playthrough";

const ALL_MISSIONS = [...MISSIONS, ...SECRET_MISSIONS];

// Missions the current PLAYTHROUGH profile clears at grade ≥ B with default
// loadout. The remaining missions in ALL_MISSIONS are tracked under the
// "known-weak" suite below — Phase 1.4 (governor tuning) migrates them
// here as the lead-prediction + target-picking improve.
const STRICT_PASS_IDS = new Set([
  "streets-01-bodega",
  "streets-02-alley",
  "underworld-05-subway",
  "underworld-secret-cathedral",
  "above-secret-grandfather",
]);

const strictMissions = ALL_MISSIONS.filter((m) => STRICT_PASS_IDS.has(m.id));
const knownWeakMissions = ALL_MISSIONS.filter((m) => !STRICT_PASS_IDS.has(m.id));

describe("STRICT_PASS_IDS integrity", () => {
  it("every id in STRICT_PASS_IDS exists in ALL_MISSIONS", () => {
    const allIds = new Set(ALL_MISSIONS.map((m) => m.id));
    for (const id of STRICT_PASS_IDS) {
      expect(allIds, `STRICT_PASS_IDS contains unknown id "${id}"`).toContain(id);
    }
  });

  it("strictMissions + knownWeakMissions covers all missions with no overlap", () => {
    expect(strictMissions.length + knownWeakMissions.length).toBe(ALL_MISSIONS.length);
    const strictIds = new Set(strictMissions.map((m) => m.id));
    const weakIds = new Set(knownWeakMissions.map((m) => m.id));
    for (const id of strictIds) {
      expect(weakIds.has(id), `id "${id}" appears in both suites`).toBe(false);
    }
  });
});

describe("governor end-to-end playthrough — strict gate", () => {
  it.each(strictMissions.map((m) => [m.id, m] as const))(
    "%s clears with grade ≥ B",
    (_id, mission) => {
      const result = playMissionWithGovernor(mission, { maxSimSeconds: 240 });
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

describe("governor end-to-end playthrough — known-weak (harness only)", () => {
  // These missions don't yet hit grade ≥ B with the default profile; some
  // time out. Asserting only that the harness completes without throwing
  // documents the gap and prevents the harness from hiding regressions.
  // Move IDs to STRICT_PASS_IDS as Phase 1.4 closes the gap.
  it.each(knownWeakMissions.map((m) => [m.id, m] as const))(
    "%s — harness completes without throwing",
    (_id, mission) => {
      const result = playMissionWithGovernor(mission, { maxSimSeconds: 60 });
      expect(["won", "lost", "timeout"]).toContain(result.outcome);
    },
    30_000,
  );
});
