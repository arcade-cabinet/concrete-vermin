import * as Tone from "tone";
import { duckBus, getBuses } from "./setup";

// Procedural music + ambient. Three per-act ambient beds, mission
// stings, win/loss/S-grade fanfare, and a boss leitmotif. All
// synth-driven so v1 ships without audio assets.

type ActId = "streets" | "underworld" | "above";

interface AmbienceHandle {
  dispose(): void;
}

let _activeAmbience: { act: ActId; handle: AmbienceHandle } | null = null;
let _leitmotif: AmbienceHandle | null = null;
let _stingSynths: Tone.PolySynth | null = null;

function ensureStingSynth(): Tone.PolySynth | null {
  const buses = getBuses();
  if (!buses) return null;
  if (!_stingSynths) {
    _stingSynths = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.005, decay: 0.18, sustain: 0.0, release: 0.4 },
      volume: -10,
    }).connect(buses.music);
  }
  return _stingSynths;
}

function startStreets(): AmbienceHandle | null {
  const buses = getBuses();
  if (!buses) return null;
  const filter = new Tone.Filter(220, "lowpass").connect(buses.music);
  const pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sine" },
    envelope: { attack: 4, decay: 0, sustain: 1, release: 6 },
    volume: -16,
  }).connect(filter);
  const hornNoise = new Tone.NoiseSynth({
    noise: { type: "pink" },
    envelope: { attack: 0.4, decay: 1.2, sustain: 0, release: 1.4 },
    volume: -28,
  }).connect(new Tone.Filter(420, "bandpass").connect(buses.music));
  const ping = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.3 },
    harmonicity: 12,
    modulationIndex: 28,
    resonance: 6000,
    octaves: 1.2,
    volume: -32,
  }).connect(buses.music);
  const lfo = new Tone.LFO(0.05, 160, 360).start();
  lfo.connect(filter.frequency);
  const padLoop = new Tone.Loop((time) => {
    pad.triggerAttackRelease(["A1", "E2", "A2"], "16n", time);
  }, "8m").start(0);
  const pingLoop = new Tone.Loop((time) => {
    if (Math.random() < 0.4) ping.triggerAttackRelease("D5", "32n", time);
  }, "2m").start("4m");
  const hornLoop = new Tone.Loop((time) => {
    if (Math.random() < 0.25) hornNoise.triggerAttackRelease("2n", time);
  }, "4m").start("3m");
  Tone.getTransport().bpm.value = 60;
  if (Tone.getTransport().state !== "started") Tone.getTransport().start();
  return {
    dispose() {
      padLoop.stop().dispose();
      pingLoop.stop().dispose();
      hornLoop.stop().dispose();
      lfo.stop().dispose();
      pad.dispose();
      hornNoise.dispose();
      ping.dispose();
      filter.dispose();
    },
  };
}

function startUnderworld(): AmbienceHandle | null {
  const buses = getBuses();
  if (!buses) return null;
  const filter = new Tone.Filter(140, "lowpass").connect(buses.music);
  const pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sawtooth" },
    envelope: { attack: 6, decay: 0, sustain: 1, release: 8 },
    volume: -22,
  }).connect(filter);
  const drip = new Tone.PluckSynth({
    attackNoise: 0.2,
    dampening: 1200,
    resonance: 0.85,
    volume: -22,
  }).connect(new Tone.Filter(2200, "highpass").connect(buses.music));
  const groan = new Tone.NoiseSynth({
    noise: { type: "brown" },
    envelope: { attack: 1.0, decay: 2.5, sustain: 0, release: 2.0 },
    volume: -30,
  }).connect(new Tone.Filter(180, "lowpass").connect(buses.music));
  const padLoop = new Tone.Loop((time) => {
    pad.triggerAttackRelease(["E1", "B1", "F2"], "16n", time);
  }, "8m").start(0);
  const dripLoop = new Tone.Loop((time) => {
    if (Math.random() < 0.55) drip.triggerAttackRelease("C4", "32n", time);
  }, "1m").start(0);
  const groanLoop = new Tone.Loop((time) => {
    if (Math.random() < 0.18) groan.triggerAttackRelease("4n", time);
  }, "4m").start("4m");
  Tone.getTransport().bpm.value = 54;
  if (Tone.getTransport().state !== "started") Tone.getTransport().start();
  return {
    dispose() {
      padLoop.stop().dispose();
      dripLoop.stop().dispose();
      groanLoop.stop().dispose();
      pad.dispose();
      drip.dispose();
      groan.dispose();
      filter.dispose();
    },
  };
}

function startAbove(): AmbienceHandle | null {
  const buses = getBuses();
  if (!buses) return null;
  const filter = new Tone.Filter(900, "highpass").connect(buses.music);
  const wind = new Tone.Noise("pink").start();
  const windFilter = new Tone.Filter(800, "bandpass").connect(filter);
  wind.connect(windFilter);
  wind.volume.value = -18;
  const lfo = new Tone.LFO(0.08, 600, 1400).start();
  lfo.connect(windFilter.frequency);
  const pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sine" },
    envelope: { attack: 5, decay: 0, sustain: 1, release: 6 },
    volume: -22,
  }).connect(buses.music);
  const bird = new Tone.PluckSynth({
    attackNoise: 1,
    dampening: 4500,
    resonance: 0.6,
    volume: -26,
  }).connect(buses.music);
  const padLoop = new Tone.Loop((time) => {
    pad.triggerAttackRelease(["A3", "E4", "G#4"], "16n", time);
  }, "8m").start(0);
  const birdLoop = new Tone.Loop((time) => {
    if (Math.random() < 0.3) bird.triggerAttackRelease("E5", "32n", time);
  }, "2m").start("2m");
  Tone.getTransport().bpm.value = 64;
  if (Tone.getTransport().state !== "started") Tone.getTransport().start();
  return {
    dispose() {
      padLoop.stop().dispose();
      birdLoop.stop().dispose();
      lfo.stop().dispose();
      wind.stop().dispose();
      windFilter.dispose();
      pad.dispose();
      bird.dispose();
      filter.dispose();
    },
  };
}

const _starters: Record<ActId, () => AmbienceHandle | null> = {
  streets: startStreets,
  underworld: startUnderworld,
  above: startAbove,
};

/**
 * Switch the ambient bed to the given act. Idempotent: re-calling for
 * the active act is a no-op. Disposes the previous bed first to avoid
 * overlapping pads.
 */
export function setActAmbience(act: ActId): void {
  if (_activeAmbience?.act === act) return;
  _activeAmbience?.handle.dispose();
  _activeAmbience = null;
  const handle = _starters[act]();
  if (handle) _activeAmbience = { act, handle };
}

export function stopAmbience(): void {
  _activeAmbience?.handle.dispose();
  _activeAmbience = null;
}

export function startStreetsAmbience(): void {
  setActAmbience("streets");
}

// ── Stings ────────────────────────────────────────────────────────

export function playMissionStartSting(): void {
  const synth = ensureStingSynth();
  if (!synth) return;
  const t = Tone.now();
  synth.triggerAttackRelease("E4", "16n", t);
  synth.triggerAttackRelease("B4", "16n", t + 0.12);
  synth.triggerAttackRelease("E5", "8n", t + 0.24);
}

export function playWinSting(): void {
  const synth = ensureStingSynth();
  if (!synth) return;
  const t = Tone.now();
  synth.triggerAttackRelease(["C5", "E5", "G5"], "8n", t);
  synth.triggerAttackRelease(["E5", "G5", "C6"], "4n", t + 0.2);
}

export function playLossSting(): void {
  const synth = ensureStingSynth();
  if (!synth) return;
  const t = Tone.now();
  synth.triggerAttackRelease("E3", "8n", t);
  synth.triggerAttackRelease("D3", "8n", t + 0.18);
  synth.triggerAttackRelease("C3", "2n", t + 0.36);
}

export function playSGradeFanfare(): void {
  const synth = ensureStingSynth();
  if (!synth) return;
  const t = Tone.now();
  for (let i = 0; i < 4; i++) {
    synth.triggerAttackRelease(["C5", "E5", "G5", "C6"], "16n", t + i * 0.1);
  }
  synth.triggerAttackRelease(["G5", "C6", "E6"], "2n", t + 0.5);
}

// ── Boss leitmotif ─────────────────────────────────────────────────

/**
 * Start the boss-fight leitmotif: a 4-beat 90 BPM ostinato that ducks
 * the ambient bed by 10 dB. Idempotent. Call stopBossLeitmotif() on
 * boss death.
 */
export function startBossLeitmotif(): void {
  const buses = getBuses();
  if (!buses) return;
  if (_leitmotif) return;
  const bass = new Tone.MonoSynth({
    oscillator: { type: "sawtooth" },
    envelope: { attack: 0.005, decay: 0.3, sustain: 0.2, release: 0.2 },
    filterEnvelope: {
      attack: 0.001,
      decay: 0.2,
      sustain: 0.1,
      release: 0.4,
      baseFrequency: 200,
      octaves: 2,
    },
    volume: -10,
  }).connect(buses.music);
  const stab = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "square" },
    envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.1 },
    volume: -16,
  }).connect(buses.music);
  const prevBpm = Tone.getTransport().bpm.value;
  Tone.getTransport().bpm.value = 90;
  if (Tone.getTransport().state !== "started") Tone.getTransport().start();
  const pattern = new Tone.Loop((time) => {
    bass.triggerAttackRelease("E1", "8n", time);
    stab.triggerAttackRelease(["G3", "Bb3"], "16n", time + 0.5);
    bass.triggerAttackRelease("E1", "8n", time + 1.0);
    stab.triggerAttackRelease(["F3", "B3"], "16n", time + 1.5);
  }, "2m").start(0);
  const duckLoop = new Tone.Loop(() => {
    duckBus("music", 10, 4, 0.5);
  }, "2m").start(0);
  _leitmotif = {
    dispose() {
      pattern.stop().dispose();
      duckLoop.stop().dispose();
      bass.dispose();
      stab.dispose();
      Tone.getTransport().bpm.value = prevBpm;
    },
  };
}

export function stopBossLeitmotif(): void {
  _leitmotif?.dispose();
  _leitmotif = null;
}

/**
 * "Silence-as-sting": drop the music bus by 20 dB for 1.2 s on boss
 * death so the player gets a beat of negative space before the win
 * fanfare.
 */
export function bossDeathSilenceSting(): void {
  duckBus("music", 20, 1.2, 0.3);
}

export function isBossLeitmotifActive(): boolean {
  return _leitmotif !== null;
}

export function activeAmbienceAct(): ActId | null {
  return _activeAmbience?.act ?? null;
}

export function resetMusicForTest(): void {
  stopAmbience();
  stopBossLeitmotif();
  _stingSynths?.dispose();
  _stingSynths = null;
}
