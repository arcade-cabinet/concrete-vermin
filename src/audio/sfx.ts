import * as Tone from "tone";
import { getBuses } from "./setup";

// Synth-driven SFX. Built from primitives so we don't ship audio
// assets for v1 — every cue is described in code. Replace with
// sample playback later if we license a library.

let _shotgun: Tone.NoiseSynth | null = null;
let _smg: Tone.NoiseSynth | null = null;
let _revolver: Tone.MembraneSynth | null = null;
let _sawedOff: Tone.NoiseSynth | null = null;
let _flame: Tone.NoiseSynth | null = null;
let _tesla: Tone.MembraneSynth | null = null;
let _reload: Tone.MetalSynth | null = null;
let _verminHit: Tone.NoiseSynth | null = null;
let _verminDeath: Tone.MembraneSynth | null = null;
let _verminSpawn: Tone.PluckSynth | null = null;
let _empty: Tone.MetalSynth | null = null;
let _bossDeath: Tone.MembraneSynth | null = null;

function ensureInstruments(): void {
  const buses = getBuses();
  if (!buses) return;
  if (!_shotgun) {
    _shotgun = new Tone.NoiseSynth({
      noise: { type: "brown" },
      envelope: { attack: 0.002, decay: 0.18, sustain: 0, release: 0.08 },
      volume: -8,
    }).connect(buses.sfx);
  }
  if (!_smg) {
    _smg = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.02 },
      volume: -12,
    }).connect(buses.sfx);
  }
  if (!_revolver) {
    _revolver = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.05 },
      volume: -4,
    }).connect(buses.sfx);
  }
  if (!_verminHit) {
    _verminHit = new Tone.NoiseSynth({
      noise: { type: "pink" },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 },
      volume: -16,
    }).connect(buses.sfx);
  }
  if (!_verminDeath) {
    _verminDeath = new Tone.MembraneSynth({
      pitchDecay: 0.1,
      octaves: 4,
      envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 },
      volume: -10,
    }).connect(buses.sfx);
  }
  if (!_verminSpawn) {
    _verminSpawn = new Tone.PluckSynth({
      attackNoise: 0.5,
      dampening: 2200,
      resonance: 0.7,
      volume: -18,
    }).connect(buses.sfx);
  }
  if (!_empty) {
    _empty = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.01 },
      harmonicity: 8,
      modulationIndex: 16,
      resonance: 4000,
      octaves: 0.5,
      volume: -22,
    }).connect(buses.sfx);
  }
  if (!_sawedOff) {
    _sawedOff = new Tone.NoiseSynth({
      noise: { type: "brown" },
      envelope: { attack: 0.003, decay: 0.28, sustain: 0, release: 0.12 },
      volume: -6,
    }).connect(buses.sfx);
  }
  if (!_flame) {
    _flame = new Tone.NoiseSynth({
      noise: { type: "pink" },
      envelope: { attack: 0.005, decay: 0.12, sustain: 0.4, release: 0.08 },
      volume: -14,
    }).connect(buses.sfx);
  }
  if (!_tesla) {
    _tesla = new Tone.MembraneSynth({
      pitchDecay: 0.02,
      octaves: 8,
      envelope: { attack: 0.0005, decay: 0.08, sustain: 0, release: 0.04 },
      volume: -8,
    }).connect(buses.sfx);
  }
  if (!_reload) {
    _reload = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.03 },
      harmonicity: 5,
      modulationIndex: 6,
      resonance: 1500,
      octaves: 1,
      volume: -18,
    }).connect(buses.sfx);
  }
  if (!_bossDeath) {
    _bossDeath = new Tone.MembraneSynth({
      pitchDecay: 0.3,
      octaves: 6,
      envelope: { attack: 0.005, decay: 0.6, sustain: 0, release: 0.4 },
      volume: -4,
    }).connect(buses.sfx);
  }
}

export function playShotgun(): void {
  ensureInstruments();
  _shotgun?.triggerAttackRelease("16n");
}

export function playSmg(): void {
  ensureInstruments();
  _smg?.triggerAttackRelease("32n");
}

export function playRevolver(): void {
  ensureInstruments();
  _revolver?.triggerAttackRelease("C2", "16n");
}

export function playSawedOff(): void {
  ensureInstruments();
  _sawedOff?.triggerAttackRelease("8n");
}

export function playFlame(): void {
  ensureInstruments();
  _flame?.triggerAttackRelease("16n");
}

export function playTesla(): void {
  ensureInstruments();
  _tesla?.triggerAttackRelease("G4", "32n");
}

/**
 * Generic reload click. Use playWeaponReload(weaponId) to dispatch the
 * per-weapon variant (shotgun pump, revolver cylinder, etc).
 */
export function playReload(): void {
  ensureInstruments();
  _reload?.triggerAttackRelease("A5", "16n");
}

/**
 * Per-weapon reload cue. Each weapon gets a distinct sonic signature
 * by synth choice + pitch + duration.
 */
export function playWeaponReload(weaponId: string): void {
  ensureInstruments();
  switch (weaponId) {
    case "shotgun":
      // Pump shotgun: two-stage clack-clunk (kick + metal).
      _verminHit?.triggerAttackRelease("16n");
      _reload?.triggerAttackRelease("E5", "16n");
      break;
    case "revolver":
      // Cylinder swing: pluck note + soft metal click.
      _verminSpawn?.triggerAttackRelease("C5", "32n");
      _reload?.triggerAttackRelease("G5", "32n");
      break;
    case "smg":
      // Mag swap: thunk + slap.
      _verminHit?.triggerAttackRelease("32n");
      _reload?.triggerAttackRelease("D5", "32n");
      break;
    case "sawed-off":
      // Break-action: chunky open + close.
      _verminDeath?.triggerAttackRelease("C2", "16n");
      _reload?.triggerAttackRelease("E5", "16n");
      break;
    case "flamethrower":
      // Fuel purge hiss.
      _flame?.triggerAttackRelease("8n");
      break;
    case "tesla":
      // Capacitor recharge whine.
      _reload?.triggerAttackRelease("B5", "8n");
      break;
    default:
      _reload?.triggerAttackRelease("A5", "16n");
      break;
  }
}

export function playEmpty(): void {
  ensureInstruments();
  _empty?.triggerAttackRelease("C6", "32n");
}

export function playVerminSpawn(): void {
  ensureInstruments();
  _verminSpawn?.triggerAttackRelease("E5", "8n");
}

/**
 * Per-archetype hit cue. Pitched lower for bigger vermin so the
 * sonic feedback matches visual mass.
 */
export function playVerminHit(archetypeId?: string): void {
  ensureInstruments();
  if (!_verminHit) return;
  // Default light-tap; bosses get a heavier hit pitched down via
  // velocity. Tone's NoiseSynth doesn't take a pitch — we use the
  // membrane synth as a chest-thump on bosses.
  if (archetypeId?.startsWith("boss-")) {
    _verminDeath?.triggerAttackRelease("A2", "16n");
    return;
  }
  _verminHit.triggerAttackRelease("32n");
}

/**
 * Per-archetype death cue. Bosses get the heavy bell-tone synth.
 */
export function playVerminDeath(archetypeId?: string): void {
  ensureInstruments();
  if (archetypeId?.startsWith("boss-")) {
    _bossDeath?.triggerAttackRelease("E1", "2n");
    return;
  }
  // Tiny adjustments per archetype for character.
  let note: Tone.Unit.Frequency = "F2";
  if (archetypeId === "rat") note = "G2";
  else if (archetypeId === "roach") note = "B2";
  else if (archetypeId === "pigeon" || archetypeId === "seagull" || archetypeId === "goose")
    note = "D3";
  else if (archetypeId === "sewer-fish") note = "C2";
  _verminDeath?.triggerAttackRelease(note, "8n");
}

/**
 * Charge-whine stub: plays a low-pitched version of the weapon-fire sample
 * to indicate a charge is building. Best-effort — silently skips if audio
 * context is not yet unlocked.
 */
export function playChargeWhine(): void {
  ensureInstruments();
  // Use the tesla synth (capacitor charge feel) at low octave as a generic
  // charge-building whine. It's distinct from any weapon fire and short enough
  // not to clash with the release SFX.
  _tesla?.triggerAttackRelease("C2", "32n");
}

/**
 * Dispatcher: pick the per-weapon SFX given a weapon archetype id.
 * Falls back to shotgun for unknown ids.
 */
export function playWeaponFire(weaponId: string): void {
  switch (weaponId) {
    case "shotgun":
      playShotgun();
      break;
    case "smg":
      playSmg();
      break;
    case "revolver":
      playRevolver();
      break;
    case "sawed-off":
      playSawedOff();
      break;
    case "flamethrower":
      playFlame();
      break;
    case "tesla":
      playTesla();
      break;
    default:
      playShotgun();
      break;
  }
}
