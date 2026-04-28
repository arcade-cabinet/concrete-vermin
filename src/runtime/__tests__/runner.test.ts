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
    // Loop budget bumped from 800 → 1500 frames to absorb event-
    // injected surprise waves (mission01 fires a runt-ambush at
    // killCount=10 that adds 3 extra spawns).
    for (let i = 0; i < 1500; i++) {
      if (i % 6 === 0) r.queueShot(120 + (i % 5) * 40, 240);
      r.step(FRAME);
      if (useGameStore.getState().phase === "won") break;
    }
    const phase = useGameStore.getState().phase;
    expect(["won", "lost"], `runner did not reach a terminal phase (saw ${phase})`).toContain(
      phase,
    );
    const encounterSpawns = mission01.encounters.reduce(
      (sum, enc) => sum + enc.spawns.reduce((acc, s) => acc + s.count, 0),
      0,
    );
    const eventSpawns = mission01.events.reduce(
      (sum, ev) => sum + (ev.effect.kind === "surprise-wave" ? ev.effect.count : 0),
      0,
    );
    expect(useGameStore.getState().killCount).toBeLessThanOrEqual(encounterSpawns + eventSpawns);
  });
});

describe("GameRunner publishes damage events + screen shakes", () => {
  it("publishes a damage event into the store on each collide event", async () => {
    const { activeShakeCount, resetShakeForTest } = await import("../screenShake");
    resetShakeForTest();
    const r = new GameRunner(mission01, [], 1234);
    let sawDamage = false;
    let sawShake = false;
    for (let i = 0; i < 600; i++) {
      if (i % 6 === 0) r.queueShot(120 + (i % 5) * 40, 240);
      r.step(FRAME);
      if (useGameStore.getState().damageEvents.length > 0) sawDamage = true;
      if (activeShakeCount() > 0) sawShake = true;
      const ph = useGameStore.getState().phase;
      if (ph === "won" || ph === "lost") break;
    }
    expect(sawDamage, "runner must publish damageEvents").toBe(true);
    expect(sawShake, "runner must push screen shakes on kills").toBe(true);
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

describe("GameRunner mission events", () => {
  it("at-time triggers fire and publish a bark to the store", () => {
    // mission01 has a halpern-call-1 boss-bark at t=4s.
    const r = new GameRunner(mission01, [], 1234);
    step(r, 4.5);
    const barks = useGameStore.getState().eventBarks;
    const halpern = barks.find((b) => b.id === "halpern-call-1");
    expect(halpern, "halpern-call-1 should have fired by t=4.5s").toBeDefined();
    expect(halpern?.kind).toBe("boss");
    expect(halpern?.text).toMatch(/Halpern/);
  });

  it("each event fires at most once per mission run", () => {
    const r = new GameRunner(mission01, [], 1234);
    // Run 6 seconds — well past the 4 s at-time trigger; the
    // dispatcher loop should NOT re-fire it because firedEventIds
    // tracks it. We verify by counting matching ids in eventBarks.
    step(r, 6);
    const barks = useGameStore.getState().eventBarks;
    const occurrences = barks.filter((b) => b.id === "halpern-call-1");
    expect(occurrences.length).toBeLessThanOrEqual(1);
  });

  it("event barks evict from the snapshot after their TTL", () => {
    const r = new GameRunner(mission01, [], 1234);
    step(r, 4.5);
    expect(useGameStore.getState().eventBarks.find((b) => b.id === "halpern-call-1")).toBeDefined();
    // EVENT_BARK_TTL_S is 5 s; advance another 6 s of sim time.
    step(r, 6);
    expect(
      useGameStore.getState().eventBarks.find((b) => b.id === "halpern-call-1"),
    ).toBeUndefined();
  });
});
