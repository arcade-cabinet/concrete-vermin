/**
 * Ducking matrix tests. Tone.js can't initialize an AudioContext in
 * node, so duckBus is a no-op without `ensureAudio()`. We assert the
 * call surface (every bus name, edge dropDb / holdS values) and the
 * baseline-tracker behavior that drives the runtime ramps.
 */
import { describe, expect, it } from "vitest";
import {
  duckBus,
  getBaselineDb,
  resetDucksForTest,
  setMusicVolumeDb,
  setSfxVolumeDb,
  setUiVolumeDb,
} from "../setup";

describe("audio/setup ducking matrix", () => {
  it("baseline tracker round-trips per bus", () => {
    setMusicVolumeDb(-10);
    expect(getBaselineDb("music")).toBe(-10);
    setSfxVolumeDb(-2);
    expect(getBaselineDb("sfx")).toBe(-2);
    setUiVolumeDb(-7);
    expect(getBaselineDb("ui")).toBe(-7);
  });

  it("duckBus accepts the leitmotif-vs-ambient drop (-10 dB hold 4 s)", () => {
    expect(() => duckBus("music", 10, 4, 0.5)).not.toThrow();
  });

  it("duckBus accepts the player-fire-vs-music drop (-4 dB hold 0.18 s)", () => {
    expect(() => duckBus("music", 4, 0.18, 0.25)).not.toThrow();
  });

  it("duckBus accepts the boss-death silence-as-sting (-20 dB hold 1.2 s)", () => {
    expect(() => duckBus("music", 20, 1.2, 0.3)).not.toThrow();
  });

  it("resetDucksForTest is idempotent + safe without buses", () => {
    expect(() => resetDucksForTest()).not.toThrow();
    expect(() => resetDucksForTest()).not.toThrow();
  });
});
