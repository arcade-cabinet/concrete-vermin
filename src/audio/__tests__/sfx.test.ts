/**
 * SFX dispatcher tests. Tone.js needs an AudioContext that doesn't
 * exist in the node test env, so the synth-instantiation paths bail
 * out via the `getBuses()` early-return. The functions still need to
 * be callable without throwing — that's what these tests cover.
 */
import { describe, expect, it } from "vitest";
import {
  playChargeRelease,
  playChargeWhine,
  playEmpty,
  playFlame,
  playReload,
  playRevolver,
  playSawedOff,
  playShotgun,
  playSmg,
  playTesla,
  playVerminDeath,
  playVerminHit,
  playVerminSpawn,
  playWeaponFire,
  playWeaponReload,
  stopChargeWhine,
  tickChargeWhine,
} from "../sfx";

describe("audio/sfx", () => {
  it("every weapon fire fn is callable without an AudioContext", () => {
    expect(() => playShotgun()).not.toThrow();
    expect(() => playSmg()).not.toThrow();
    expect(() => playRevolver()).not.toThrow();
    expect(() => playSawedOff()).not.toThrow();
    expect(() => playFlame()).not.toThrow();
    expect(() => playTesla()).not.toThrow();
  });

  it("every vermin cue fn is callable without an AudioContext", () => {
    expect(() => playVerminSpawn()).not.toThrow();
    expect(() => playVerminHit()).not.toThrow();
    expect(() => playVerminHit("rat")).not.toThrow();
    expect(() => playVerminHit("boss-river-mutant")).not.toThrow();
    expect(() => playVerminDeath()).not.toThrow();
    expect(() => playVerminDeath("rat")).not.toThrow();
    expect(() => playVerminDeath("roach")).not.toThrow();
    expect(() => playVerminDeath("pigeon")).not.toThrow();
    expect(() => playVerminDeath("sewer-fish")).not.toThrow();
    expect(() => playVerminDeath("boss-pigeon-king")).not.toThrow();
  });

  it("playReload + playEmpty no-op safely", () => {
    expect(() => playReload()).not.toThrow();
    expect(() => playEmpty()).not.toThrow();
  });

  it("playWeaponFire dispatches by id, falls back on unknown", () => {
    expect(() => playWeaponFire("shotgun")).not.toThrow();
    expect(() => playWeaponFire("smg")).not.toThrow();
    expect(() => playWeaponFire("revolver")).not.toThrow();
    expect(() => playWeaponFire("sawed-off")).not.toThrow();
    expect(() => playWeaponFire("flamethrower")).not.toThrow();
    expect(() => playWeaponFire("tesla")).not.toThrow();
    expect(() => playWeaponFire("unknown-weapon-id")).not.toThrow();
  });

  it("playWeaponReload dispatches per-weapon variants", () => {
    expect(() => playWeaponReload("shotgun")).not.toThrow();
    expect(() => playWeaponReload("smg")).not.toThrow();
    expect(() => playWeaponReload("revolver")).not.toThrow();
    expect(() => playWeaponReload("sawed-off")).not.toThrow();
    expect(() => playWeaponReload("flamethrower")).not.toThrow();
    expect(() => playWeaponReload("tesla")).not.toThrow();
    expect(() => playWeaponReload("unknown-weapon-id")).not.toThrow();
  });

  it("charge whine lifecycle: start → tick → stop is callable for every weapon without throwing", () => {
    const weapons = ["shotgun", "smg", "revolver", "sawed-off", "flamethrower", "tesla", "unknown"];
    for (const w of weapons) {
      expect(() => playChargeWhine(w)).not.toThrow();
      expect(() => tickChargeWhine(0)).not.toThrow();
      expect(() => tickChargeWhine(0.5)).not.toThrow();
      expect(() => tickChargeWhine(1)).not.toThrow();
      expect(() => stopChargeWhine()).not.toThrow();
    }
  });

  it("tickChargeWhine and stopChargeWhine are safe when no whine is active", () => {
    expect(() => tickChargeWhine(0.5)).not.toThrow();
    expect(() => stopChargeWhine()).not.toThrow();
    expect(() => stopChargeWhine()).not.toThrow();
  });

  it("playChargeRelease dispatches per-weapon and clamps chargeProgress", () => {
    const weapons = ["shotgun", "smg", "revolver", "sawed-off", "flamethrower", "tesla", "unknown"];
    for (const w of weapons) {
      expect(() => playChargeRelease(w, 0)).not.toThrow();
      expect(() => playChargeRelease(w, 0.5)).not.toThrow();
      expect(() => playChargeRelease(w, 1)).not.toThrow();
      // out-of-range values still safe
      expect(() => playChargeRelease(w, -1)).not.toThrow();
      expect(() => playChargeRelease(w, 2)).not.toThrow();
    }
  });
});
