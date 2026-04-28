/**
 * Integration: the lifecycle broker (Capacitor App + visibilitychange)
 * actually freezes a live GameRunner when the OS backgrounds the app
 * and resumes it on return. Complements lifecycle.dom.test.ts (which
 * only asserts the broker fires its own callbacks) by closing the loop
 * through the real runner.pause / runner.resume contract — i.e., proves
 * "off-screen contact damage cannot eat lives" end-to-end.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const addListener = vi.fn();
vi.mock("@capacitor/app", () => ({
  App: {
    addListener: (...args: unknown[]) => addListener(...args),
  },
}));

import { GameRunner } from "../../runtime/runner";
import { useGameStore } from "../../runtime/store";
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

beforeEach(() => {
  addListener.mockResolvedValue({ remove: () => {} });
  useGameStore.getState().setPhase("briefing");
  useGameStore.getState().resetCash();
  // Default to visible so the broker doesn't immediately fire onPause
  // on first install.
  Object.defineProperty(document, "visibilityState", {
    value: "visible",
    configurable: true,
  });
});

afterEach(() => {
  addListener.mockReset();
});

describe("lifecycle ↔ runner integration", () => {
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

    // OS backgrounds the app.
    setVisibility("hidden");
    expect(runner.isPaused()).toBe(true);

    // Even if the rAF ticker keeps calling step() while backgrounded
    // (which browsers throttle but don't always fully suspend), sim
    // time must not advance.
    step(runner, 2);
    expect(useGameStore.getState().now).toBe(tBeforeBackground);

    // Player returns.
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
    // 10 s of "elapsed wallclock" while the player is in another app.
    // The mission has rats running toward the player line; if the
    // pause edge weren't honored, several lives would be drained.
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
