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

// Sustained per-weapon charge whine. Held while the player holds-to-charge;
// stops on release / cancel via stopChargeWhine. Distinct timbre per weapon so
// the player ear-learns which gun is charging from the audio alone.
let _chargeOsc: Tone.Oscillator | null = null;
let _chargeFilt: Tone.Filter | null = null;
let _chargeAmp: Tone.Gain | null = null;
let _chargeWeapon: string | null = null;

function chargeProfileFor(weaponId: string): {
  freq: number;
  type: "sawtooth" | "square" | "triangle" | "sine";
  filter: number;
  vol: number;
} {
  switch (weaponId) {
    case "shotgun":
      return { freq: 90, type: "sawtooth", filter: 600, vol: -22 };
    case "sawed-off":
      return { freq: 70, type: "sawtooth", filter: 500, vol: -20 };
    case "revolver":
      return { freq: 140, type: "square", filter: 900, vol: -24 };
    case "smg":
      return { freq: 200, type: "square", filter: 1400, vol: -26 };
    case "flamethrower":
      return { freq: 60, type: "triangle", filter: 800, vol: -22 };
    case "tesla":
      return { freq: 240, type: "sawtooth", filter: 1800, vol: -22 };
    default:
      return { freq: 120, type: "sawtooth", filter: 900, vol: -24 };
  }
}

export function playChargeWhine(weaponId: string): void {
  const buses = getBuses();
  if (!buses) return;
  stopChargeWhine();
  const profile = chargeProfileFor(weaponId);
  _chargeFilt = new Tone.Filter(profile.filter, "lowpass");
  _chargeAmp = new Tone.Gain(0).connect(buses.sfx);
  _chargeFilt.connect(_chargeAmp);
  _chargeOsc = new Tone.Oscillator({
    type: profile.type,
    frequency: profile.freq,
    volume: profile.vol,
  }).connect(_chargeFilt);
  _chargeOsc.start();
  // Ramp gain in over 30 ms so the start isn't a click; ramp pitch up over
  // the expected charge window (handled by tickChargeWhine).
  _chargeAmp.gain.linearRampTo(1, 0.03);
  _chargeWeapon = weaponId;
}

/**
 * Update the whine to reflect current charge progress (0..1). Pitch ramps
 * up by an octave and filter opens as charge saturates — sonic feedback
 * the player can lean on without looking at the reticle ring.
 */
export function tickChargeWhine(chargeProgress: number): void {
  if (!_chargeOsc || !_chargeFilt || !_chargeWeapon) return;
  const profile = chargeProfileFor(_chargeWeapon);
  const targetFreq = profile.freq * (1 + chargeProgress); // up to +1 octave
  const targetFilter = profile.filter * (1 + chargeProgress * 2); // open the lid
  _chargeOsc.frequency.rampTo(targetFreq, 0.04);
  _chargeFilt.frequency.rampTo(targetFilter, 0.04);
}

export function stopChargeWhine(): void {
  if (_chargeAmp) {
    _chargeAmp.gain.cancelScheduledValues(Tone.now());
    _chargeAmp.gain.linearRampTo(0, 0.02);
  }
  // Defer disposal until after the ramp-down so we don't audibly cut.
  const osc = _chargeOsc;
  const filt = _chargeFilt;
  const amp = _chargeAmp;
  _chargeOsc = null;
  _chargeFilt = null;
  _chargeAmp = null;
  _chargeWeapon = null;
  setTimeout(() => {
    try {
      osc?.stop();
      osc?.dispose();
      filt?.dispose();
      amp?.dispose();
    } catch {
      // Tone may already be torn down in tests — ignore.
    }
  }, 40);
}

/**
 * Release punch — plays the regular weapon fire SFX but pitched down (heavier)
 * by an amount proportional to chargeProgress, so saturated releases sound
 * meatier than half-charges. Stacks on top of playWeaponFire's regular call
 * for the per-weapon character; this one is the extra "thud."
 */
export function playChargeRelease(weaponId: string, chargeProgress: number): void {
  ensureInstruments();
  // chargeProgress: 0..1 → detune semitones in [0, -7] (down a fifth at full).
  const detuneSemis = -7 * Math.max(0, Math.min(1, chargeProgress));
  const detuneCents = detuneSemis * 100;
  switch (weaponId) {
    case "shotgun":
    case "sawed-off":
      if (_sawedOff) {
        _sawedOff.set({ envelope: { attack: 0.003, decay: 0.4, sustain: 0, release: 0.18 } });
        _sawedOff.triggerAttackRelease("4n");
      }
      break;
    case "revolver":
      if (_revolver) {
        _revolver.detune.value = detuneCents;
        _revolver.triggerAttackRelease("A1", "8n");
        _revolver.detune.value = 0;
      }
      break;
    case "smg":
      if (_smg) {
        _smg.set({ envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.04 } });
        _smg.triggerAttackRelease("8n");
      }
      break;
    case "flamethrower":
      // Napalm whoomph — deep membrane thud, not the regular pink-noise roar.
      if (_verminDeath) {
        _verminDeath.triggerAttackRelease("D1", "4n");
      }
      break;
    case "tesla":
      if (_tesla) {
        _tesla.detune.value = detuneCents;
        _tesla.triggerAttackRelease("E3", "16n");
        _tesla.detune.value = 0;
      }
      break;
    default:
      break;
  }
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
