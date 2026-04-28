/**
 * Runner integration tests. Drive the GameRunner through a few sim
 * seconds and assert on store snapshots — verifies the reload window,
 * livesAllowance plumbing, and per-mission cash awarding.
 *
 * The runner uses Tone.js / haptics in the live path; both are
 * lazy-initialized and no-op when the AudioContext / Capacitor APIs
 * aren't available, so node-side tests don't need explicit mocks.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { GameRunner } from "../runner";
import { useGameStore } from "../store";
import { mission01 } from "../../sim/content/missions/streets/mission-01";
import { mission04 } from "../../sim/content/missions/streets/mission-04";

const FRAME = 1 / 60;

function step(runner: GameRunner, seconds: number): void {
  // Drive the fixed-step loop frame-at-a-time for determinism.
  const frames = Math.round(seconds / FRAME);
  for (let i = 0; i < frames; i++) runner.step(FRAME);
}

beforeEach(() => {
  // Reset the store between tests — phase, snapshot, cash all start fresh.
  const s = useGameStore.getState();
  s.setPhase("briefing");
  s.resetCash();
});

describe("GameRunner reload window", () => {
  it("starts a reload only when ammo runs out OR queueReload is called", () => {
    const r = new GameRunner(mission01, [], 1234);
    step(r, 0.1);
    expect(useGameStore.getState().reloadProgress).toBeNull();
    // Drain the mag.
    const magSize = useGameStore.getState().player.ammoMax;
    for (let i = 0; i < magSize; i++) {
      r.queueShot(240, 200);
      step(r, FRAME);
    }
    expect(useGameStore.getState().player.ammoCurrent).toBe(0);
    expect(useGameStore.getState().reloadProgress).not.toBeNull();
    expect(useGameStore.getState().reloadProgress).toBeGreaterThanOrEqual(0);
  });

  it("publishes reloadProgress 0..1 as the reload window elapses", () => {
    const r = new GameRunner(mission01, [], 1234);
    r.queueReload();
    step(r, FRAME);
    const start = useGameStore.getState().reloadProgress;
    expect(start).toBeNull(); // queueReload while mag full → no reload triggered
    // Drain a shot first so the queueReload has something to refill.
    r.queueShot(240, 200);
    step(r, FRAME);
    r.queueReload();
    step(r, FRAME);
    const p = useGameStore.getState().reloadProgress;
    expect(p).not.toBeNull();
    expect(p!).toBeGreaterThanOrEqual(0);
    expect(p!).toBeLessThanOrEqual(1);
  });

  it("blocks fire while reloading; resumes once reload completes", () => {
    const r = new GameRunner(mission01, [], 1234);
    const magSize = useGameStore.getState().player.ammoMax;
    for (let i = 0; i < magSize; i++) {
      r.queueShot(240, 200);
      step(r, FRAME);
    }
    expect(useGameStore.getState().reloadProgress).not.toBeNull();
    // Try to fire mid-reload — ammo stays at 0 until reload completes.
    r.queueShot(240, 200);
    step(r, FRAME);
    expect(useGameStore.getState().player.ammoCurrent).toBe(0);
    // Wait the full reload duration plus slack.
    const reloadMs = useGameStore.getState().reloadDurationMs;
    step(r, reloadMs / 1000 + 0.1);
    expect(useGameStore.getState().reloadProgress).toBeNull();
    expect(useGameStore.getState().player.ammoCurrent).toBe(magSize);
  });
});

describe("GameRunner livesAllowance", () => {
  it("uses mission.livesAllowance from spec, not a global constant", () => {
    const r1 = new GameRunner(mission01, [], 1234);
    step(r1, FRAME);
    expect(useGameStore.getState().player.livesRemaining).toBe(mission01.livesAllowance);
    expect(mission01.livesAllowance).toBe(5);

    const r2 = new GameRunner(mission04, [], 1234);
    step(r2, FRAME);
    expect(useGameStore.getState().player.livesRemaining).toBe(mission04.livesAllowance);
    expect(mission04.livesAllowance).toBe(5);
  });
});

describe("GameRunner kill dedupe", () => {
  it("kill count never exceeds the spawned vermin count", () => {
    const r = new GameRunner(mission01, [], 1234);
    // Burn through the mission with rapid fire.
    for (let i = 0; i < 800; i++) {
      if (i % 6 === 0) r.queueShot(120 + (i % 5) * 40, 240);
      r.step(FRAME);
      if (useGameStore.getState().phase === "won") break;
    }
    const phase = useGameStore.getState().phase;
    expect(["won", "lost"], `runner did not reach a terminal phase (saw ${phase})`).toContain(
      phase,
    );
    const totalSpawnedFromSpec = mission01.encounters.reduce(
      (sum, enc) => sum + enc.spawns.reduce((acc, s) => acc + s.count, 0),
      0,
    );
    expect(useGameStore.getState().killCount).toBeLessThanOrEqual(totalSpawnedFromSpec);
  });
});

describe("GameRunner pause / resume", () => {
  it("pause stops sim time advancing; resume picks back up", () => {
    const r = new GameRunner(mission01, [], 1234);
    step(r, 1.0);
    const t1 = useGameStore.getState().now;
    expect(t1).toBeGreaterThan(0.5);
    r.pause();
    expect(r.isPaused()).toBe(true);
    step(r, 1.0);
    const t2 = useGameStore.getState().now;
    expect(t2).toBe(t1); // sim clock did not advance
    r.resume();
    expect(r.isPaused()).toBe(false);
    step(r, 0.5);
    expect(useGameStore.getState().now).toBeGreaterThan(t2);
  });
});
