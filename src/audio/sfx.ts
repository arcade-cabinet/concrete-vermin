import * as Tone from "tone";
import { getBuses } from "./setup";

// Synth-driven SFX. Built from primitives so we don't ship audio
// assets for v1 — every cue is described in code. Replace with
// sample playback later if we license a library.

let _shotgun: Tone.NoiseSynth | null = null;
let _smg: Tone.NoiseSynth | null = null;
let _revolver: Tone.MembraneSynth | null = null;
let _verminHit: Tone.NoiseSynth | null = null;
let _verminDeath: Tone.MembraneSynth | null = null;
let _verminSpawn: Tone.PluckSynth | null = null;
let _empty: Tone.MetalSynth | null = null;

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

export function playEmpty(): void {
  ensureInstruments();
  _empty?.triggerAttackRelease("C6", "32n");
}

export function playVerminSpawn(): void {
  ensureInstruments();
  _verminSpawn?.triggerAttackRelease("E5", "8n");
}

export function playVerminHit(): void {
  ensureInstruments();
  _verminHit?.triggerAttackRelease("32n");
}

export function playVerminDeath(): void {
  ensureInstruments();
  _verminDeath?.triggerAttackRelease("F2", "8n");
}
