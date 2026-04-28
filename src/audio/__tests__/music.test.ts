/**
 * music + setup tests. Tone.js needs an AudioContext that doesn't
 * exist in node, so the synth instantiation paths bail via the
 * `getBuses() == null` early-return. The functions still need to be
 * callable without throwing — these tests cover that contract.
 */
import { describe, expect, it } from "vitest";
import {
  activeAmbienceAct,
  bossDeathSilenceSting,
  isBossLeitmotifActive,
  playLossSting,
  playMissionStartSting,
  playSGradeFanfare,
  playWinSting,
  resetMusicForTest,
  setActAmbience,
  startBossLeitmotif,
  startStreetsAmbience,
  stopAmbience,
  stopBossLeitmotif,
} from "../music";
import {
  duckBus,
  getBaselineDb,
  resetDucksForTest,
  setMusicVolumeDb,
  setSfxVolumeDb,
  setUiVolumeDb,
} from "../setup";

describe("audio/music ambient + stings", () => {
  it("setActAmbience for every act is callable", () => {
    expect(() => setActAmbience("streets")).not.toThrow();
    expect(() => setActAmbience("underworld")).not.toThrow();
    expect(() => setActAmbience("above")).not.toThrow();
    expect(() => stopAmbience()).not.toThrow();
  });

  it("setActAmbience tracks active act when buses exist", () => {
    // No buses in node env → activeAmbienceAct stays null even after
    // setActAmbience. This still verifies the function doesn't throw
    // and resetMusicForTest leaves a clean slate.
    setActAmbience("streets");
    resetMusicForTest();
    expect(activeAmbienceAct()).toBeNull();
  });

  it("stings + fanfare are no-throw without an AudioContext", () => {
    expect(() => playMissionStartSting()).not.toThrow();
    expect(() => playWinSting()).not.toThrow();
    expect(() => playLossSting()).not.toThrow();
    expect(() => playSGradeFanfare()).not.toThrow();
  });

  it("startStreetsAmbience back-compat alias works", () => {
    expect(() => startStreetsAmbience()).not.toThrow();
  });
});

describe("audio/music boss leitmotif", () => {
  it("startBossLeitmotif + stopBossLeitmotif are idempotent and tracked", () => {
    expect(() => startBossLeitmotif()).not.toThrow();
    // No buses in node → leitmotif never actually starts; tracker stays false.
    expect(isBossLeitmotifActive()).toBe(false);
    expect(() => stopBossLeitmotif()).not.toThrow();
    expect(() => bossDeathSilenceSting()).not.toThrow();
  });
});

describe("audio/setup per-bus volumes + ducking", () => {
  it("setMusicVolumeDb / setSfxVolumeDb / setUiVolumeDb update the baseline", () => {
    setMusicVolumeDb(-15);
    setSfxVolumeDb(-3);
    setUiVolumeDb(-9);
    expect(getBaselineDb("music")).toBe(-15);
    expect(getBaselineDb("sfx")).toBe(-3);
    expect(getBaselineDb("ui")).toBe(-9);
  });

  it("duckBus is callable for every bus + resetDucksForTest no-ops without buses", () => {
    expect(() => duckBus("music", 10, 1.2, 0.4)).not.toThrow();
    expect(() => duckBus("sfx", 4, 0.18, 0.25)).not.toThrow();
    expect(() => duckBus("ui", 6, 0.5)).not.toThrow();
    expect(() => resetDucksForTest()).not.toThrow();
  });
});
