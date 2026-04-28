/**
 * Integration: the lifecycle broker (Capacitor App + visibilitychange)
 * actually freezes a live GameRunner when the OS backgrounds the app
 * and resumes it on return. Complements lifecycle.dom.test.ts (which
 * only asserts the broker fires its own callbacks) by closing the loop
 * through the real runner.pause / runner.resume contract — i.e., proves
 * "off-screen contact damage cannot eat lives" end-to-end on BOTH the
 * Capacitor native path AND the web visibilitychange path.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface CapacitorAppStateChange {
  isActive: boolean;
}

// Capture the registered Capacitor callback so we can simulate native
// appStateChange events without a real bridge. Without this, the
// native path is dead code in the test.
let capturedAppStateCb: ((state: CapacitorAppStateChange) => void) | null = null;
const addListener = vi.fn();
vi.mock("@capacitor/app", () => ({
  App: {
    addListener: (...args: unknown[]) => addListener(...args),
  },
}));

import { GameRunner } from "../../runtime/runner";
import { INITIAL_SNAPSHOT, useGameStore } from "../../runtime/store";
import { mission01 } from "../../sim/content/missions/streets/mission-01";
import { installAppLifecycle } from "../lifecycle";

const FRAME = 1 / 60;

function step(runner: GameRunner, seconds: number): void {
  const frames = Math.round(seconds / FRAME);
  for (let i = 0; i < frames; i++) runner.step(FRAME);
}

function setVisibility(state: "visible" | "hidden"): void {
  Object.defineProperty(document, "visibilityState", {
    value: state,
    configurable: true,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

function fireAppStateChange(isActive: boolean): void {
  // Hard assertion above; if we reach the call cb is non-null. The
  // optional chain would silently swallow a regression where the
  // assertion stops throwing — non-null assertion is the honest form.
  expect(capturedAppStateCb, "Capacitor appStateChange callback not registered").not.toBeNull();
  // biome-ignore lint/style/noNonNullAssertion: see comment above
  capturedAppStateCb!({ isActive });
}

beforeEach(() => {
  capturedAppStateCb = null;
  addListener.mockImplementation((event, cb) => {
    if (event === "appStateChange") capturedAppStateCb = cb;
    return Promise.resolve({ remove: () => {} });
  });
  // Full snapshot reset — partial reset would leak state between
  // tests because the store is a Zustand singleton. INITIAL_SNAPSHOT
  // covers everything except runner-owned `player`, which we reset
  // alongside it (see store.ts INITIAL_SNAPSHOT JSDoc for the
  // exclusion rationale).
  useGameStore.setState({
    ...INITIAL_SNAPSHOT,
    phase: "briefing",
    player: { ammoCurrent: 6, ammoMax: 6, livesRemaining: 3 },
  });
  Object.defineProperty(document, "visibilityState", {
    value: "visible",
    configurable: true,
  });
});

afterEach(() => {
  addListener.mockReset();
  capturedAppStateCb = null;
});

describe("lifecycle ↔ runner integration (visibilitychange path)", () => {
  it("backgrounding pauses the runner; foregrounding resumes it; sim time does not advance during the gap", () => {
    const runner = new GameRunner(mission01, [], 1234);
    const teardown = installAppLifecycle({
      onPause: () => runner.pause(),
      onResume: () => runner.resume(),
    });

    step(runner, 1);
    const tBeforeBackground = useGameStore.getState().now;
    expect(tBeforeBackground).toBeGreaterThan(0.5);
    expect(runner.isPaused()).toBe(false);

    setVisibility("hidden");
    expect(runner.isPaused()).toBe(true);

    // step() while paused calls publishSnapshot() with the current
    // this.now (unchanged), so strict equality is the right assertion
    // here — not toBeCloseTo. A regression that re-derived now from
    // wall-clock would break this.
    step(runner, 2);
    expect(useGameStore.getState().now).toBe(tBeforeBackground);

    setVisibility("visible");
    expect(runner.isPaused()).toBe(false);

    step(runner, 0.5);
    expect(useGameStore.getState().now).toBeGreaterThan(tBeforeBackground);

    teardown();
  });

  it("contact damage cannot land while backgrounded — lives stay intact through a 10 s gap", () => {
    const runner = new GameRunner(mission01, [], 1234);
    const teardown = installAppLifecycle({
      onPause: () => runner.pause(),
      onResume: () => runner.resume(),
    });

    step(runner, 0.5);
    const livesBefore = useGameStore.getState().player.livesRemaining;

    setVisibility("hidden");
    step(runner, 10);

    setVisibility("visible");
    const livesAfter = useGameStore.getState().player.livesRemaining;
    expect(livesAfter).toBe(livesBefore);

    teardown();
  });

  it("teardown stops the broker from triggering further pauses", () => {
    const runner = new GameRunner(mission01, [], 1234);
    const teardown = installAppLifecycle({
      onPause: () => runner.pause(),
      onResume: () => runner.resume(),
    });
    teardown();

    setVisibility("hidden");
    expect(runner.isPaused()).toBe(false);
  });
});

describe("lifecycle ↔ runner integration (Capacitor appStateChange path)", () => {
  it("appStateChange isActive=false pauses the runner; isActive=true resumes it", async () => {
    const runner = new GameRunner(mission01, [], 1234);
    const teardown = installAppLifecycle({
      onPause: () => runner.pause(),
      onResume: () => runner.resume(),
    });

    // capturedAppStateCb is actually captured synchronously in
    // mockImplementation (line ~55), so it's already set the moment
    // installAppLifecycle returns. The flush below is hygiene for the
    // unrelated `nativeRemove` assignment in lifecycle.ts's `.then`,
    // which we don't observe but want settled before teardown runs.
    await Promise.resolve();
    await Promise.resolve();

    step(runner, 0.5);
    expect(runner.isPaused()).toBe(false);

    fireAppStateChange(false);
    expect(runner.isPaused()).toBe(true);

    fireAppStateChange(true);
    expect(runner.isPaused()).toBe(false);

    teardown();
  });

  it("native appStateChange listener is registered exactly once per install", () => {
    const teardown = installAppLifecycle({
      onPause: () => {},
      onResume: () => {},
    });
    expect(addListener).toHaveBeenCalledWith("appStateChange", expect.any(Function));
    expect(addListener).toHaveBeenCalledTimes(1);
    teardown();
  });
});
