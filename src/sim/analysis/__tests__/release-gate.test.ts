/**
 * Release-gate test. Verifies the lock state for the v1 mission set.
 *
 * The release gate fires only when the env var RELEASE_GATING=1 is
 * set — locally the suite is informational. CI's release.yml sets the
 * variable so this test fails the release if any v1 mission has
 * drifted out of STABLE.
 *
 * The test uses the abstract benchmark; it doesn't need a browser or
 * Pixi. Three smoke passes generate the rolling history that
 * deriveLockRecommendations consumes.
 */

import { describe, expect, it } from "vitest";
import { deriveLockRecommendations, type LockState, runSeededBenchmark } from "../index";
import { MISSIONS } from "../../content/missions";

const RELEASE_GATING = process.env.RELEASE_GATING === "1";
const SEEDS = Array.from({ length: 5 }, (_, i) => 19790101 + i * 7);

describe("release-gate", () => {
  // The v1 lock target. STABLE means the dominant grade across the
  // 3-pass smoke history doesn't flap — the mission has converged.
  // UNSTABLE = mission is moving; UNMEASURED = not enough history.
  const ALLOWED: ReadonlyArray<LockState> = ["STABLE", "UNSTABLE", "UNMEASURED"];
  const STRICT: ReadonlyArray<LockState> = ["STABLE"];

  it("every v1 mission lands in an allowed lock state under the median governor", () => {
    const passA = MISSIONS.map((m) => runSeededBenchmark(m.id, SEEDS, "median"));
    const passB = MISSIONS.map((m) => runSeededBenchmark(m.id, SEEDS, "median"));
    const passC = MISSIONS.map((m) => runSeededBenchmark(m.id, SEEDS, "median"));
    const recs = deriveLockRecommendations([...passA, ...passB, ...passC]);

    expect(recs).toHaveLength(MISSIONS.length);

    const target = RELEASE_GATING ? STRICT : ALLOWED;
    for (const r of recs) {
      expect(target, `mission ${r.missionId} → ${r.state}`).toContain(r.state);
    }
  });

  it("v1 missions are deterministic — same seeds → same lock", () => {
    const run = () => {
      const a = MISSIONS.map((m) => runSeededBenchmark(m.id, SEEDS, "median"));
      const b = MISSIONS.map((m) => runSeededBenchmark(m.id, SEEDS, "median"));
      const c = MISSIONS.map((m) => runSeededBenchmark(m.id, SEEDS, "median"));
      return deriveLockRecommendations([...a, ...b, ...c]);
    };
    const first = run();
    const second = run();
    expect(first).toEqual(second);
  });
});
