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

const _baseline = { music: -12, sfx: -4, ui: -8 };

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
    const music = new Tone.Volume(_baseline.music).connect(master);
    const sfx = new Tone.Volume(_baseline.sfx).connect(master);
    const ui = new Tone.Volume(_baseline.ui).connect(master);
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

export function setMusicVolumeDb(db: number): void {
  _baseline.music = db;
  if (_buses) _buses.music.volume.value = db;
}

export function setSfxVolumeDb(db: number): void {
  _baseline.sfx = db;
  if (_buses) _buses.sfx.volume.value = db;
}

export function setUiVolumeDb(db: number): void {
  _baseline.ui = db;
  if (_buses) _buses.ui.volume.value = db;
}

export function getBaselineDb(bus: "music" | "sfx" | "ui"): number {
  return _baseline[bus];
}

const _activeDucks = new Map<"music" | "sfx" | "ui", number>();

/**
 * Duck a bus by `dropDb` for `holdS` seconds, then ramp back to its
 * baseline over `releaseS` seconds. Last call wins (longest hold) so
 * concurrent ducks extend rather than stack.
 */
export function duckBus(
  bus: "music" | "sfx" | "ui",
  dropDb: number,
  holdS: number,
  releaseS = 0.4,
): void {
  if (!_buses) return;
  const node = _buses[bus];
  const baseline = _baseline[bus];
  const target = baseline - Math.abs(dropDb);
  const now = Tone.now();
  node.volume.cancelScheduledValues(now);
  node.volume.linearRampToValueAtTime(target, now + 0.03);
  const releaseAt = now + 0.03 + holdS;
  node.volume.linearRampToValueAtTime(target, releaseAt);
  node.volume.linearRampToValueAtTime(baseline, releaseAt + releaseS);
  const prevExpiry = _activeDucks.get(bus) ?? 0;
  _activeDucks.set(bus, Math.max(prevExpiry, releaseAt + releaseS));
}

/** Test-only reset; clears scheduled volume ramps. */
export function resetDucksForTest(): void {
  _activeDucks.clear();
  if (!_buses) return;
  _buses.music.volume.cancelScheduledValues(Tone.now());
  _buses.sfx.volume.cancelScheduledValues(Tone.now());
  _buses.ui.volume.cancelScheduledValues(Tone.now());
  _buses.music.volume.value = _baseline.music;
  _buses.sfx.volume.value = _baseline.sfx;
  _buses.ui.volume.value = _baseline.ui;
}
