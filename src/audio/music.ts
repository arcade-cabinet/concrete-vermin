import * as Tone from "tone";
import { getBuses } from "./setup";

// Ambient drone bed for the tutorial / Streets act. Low pad + slow
// filter sweep + occasional metallic ping (subway atmosphere). All
// procedural — no audio assets shipped in v1.

let _pad: Tone.PolySynth | null = null;
let _filter: Tone.Filter | null = null;
let _ping: Tone.MetalSynth | null = null;
let _padLoop: Tone.Loop | null = null;
let _pingLoop: Tone.Loop | null = null;

export function startStreetsAmbience(): void {
  const buses = getBuses();
  if (!buses) return;
  if (_padLoop) return; // already running

  _filter = new Tone.Filter(220, "lowpass").connect(buses.music);
  _pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sine" },
    envelope: { attack: 4, decay: 0, sustain: 1, release: 6 },
    volume: -16,
  }).connect(_filter);

  _ping = new Tone.MetalSynth({
    envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.3 },
    harmonicity: 12,
    modulationIndex: 28,
    resonance: 6000,
    octaves: 1.2,
    volume: -32,
  }).connect(buses.music);

  // Slow LFO on the filter — the streetlight buzz feel.
  const lfo = new Tone.LFO(0.05, 160, 360).start();
  lfo.connect(_filter.frequency);

  _padLoop = new Tone.Loop((time) => {
    _pad?.triggerAttackRelease(["A1", "E2", "A2"], "16n", time);
  }, "8m").start(0);

  _pingLoop = new Tone.Loop((time) => {
    if (Math.random() < 0.4) _ping?.triggerAttackRelease("D5", "32n", time);
  }, "2m").start("4m");

  Tone.getTransport().bpm.value = 60;
  if (Tone.getTransport().state !== "started") Tone.getTransport().start();
}

export function stopAmbience(): void {
  _padLoop?.stop();
  _padLoop?.dispose();
  _padLoop = null;
  _pingLoop?.stop();
  _pingLoop?.dispose();
  _pingLoop = null;
  _pad?.dispose();
  _pad = null;
  _filter?.dispose();
  _filter = null;
  _ping?.dispose();
  _ping = null;
}
