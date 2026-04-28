import * as Tone from "tone";

// Tone.js bus structure. Lazy-initialized on first user gesture (Web
// Audio policy requires that). All sfx + music routes through these
// buses so the settings dialog can mute/duck independently.

export interface AudioBuses {
  master: Tone.Volume;
  music: Tone.Volume;
  sfx: Tone.Volume;
  ui: Tone.Volume;
}

let _buses: AudioBuses | null = null;
let _initStarted = false;

export function getBuses(): AudioBuses | null {
  return _buses;
}

export async function ensureAudio(): Promise<AudioBuses | null> {
  if (_buses) return _buses;
  if (_initStarted) return null;
  _initStarted = true;
  try {
    await Tone.start();
    const master = new Tone.Volume(-6).toDestination();
    const music = new Tone.Volume(-12).connect(master);
    const sfx = new Tone.Volume(-4).connect(master);
    const ui = new Tone.Volume(-8).connect(master);
    _buses = { master, music, sfx, ui };
    return _buses;
  } catch {
    _initStarted = false;
    return null;
  }
}

export function setMasterVolumeDb(db: number): void {
  if (_buses) _buses.master.volume.value = db;
}

export function setMute(muted: boolean): void {
  if (_buses) _buses.master.mute = muted;
}
