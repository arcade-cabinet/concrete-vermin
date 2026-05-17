// Audio engine: subscribes to useGameStore.audioEvents and dispatches to
// the Tone.js sfx/music modules. Runner emits data only; engine owns the
// side-effects. Enables replay (drive snapshots without invoking the runner),
// mute (engine ignores all events when settings.muted), and isolated tests
// (subscribe a mock engine instead of patching the audio module).

import { useGameStore, type AudioEvent } from "../runtime/store";
import {
  playChargeRelease,
  playChargeWhine,
  playEmpty,
  playWeaponFire,
  playWeaponReload,
  playVerminDeath,
  playVerminHit,
  playVerminSpawn,
  stopChargeWhine,
  tickChargeWhine,
} from "./sfx";
import {
  bossDeathSilenceSting,
  playLossSting,
  playMissionStartSting,
  playSGradeFanfare,
  playWinSting,
  setActAmbience,
  startBossLeitmotif,
  stopBossLeitmotif,
} from "./music";
import { duckBus } from "./setup";

export function dispatchAudioEvent(event: AudioEvent): void {
  switch (event.kind) {
    case "mission-start":
      playMissionStartSting();
      break;
    case "mission-won-sgrade":
      playSGradeFanfare();
      break;
    case "mission-won":
      playWinSting();
      break;
    case "mission-lost":
      playLossSting();
      break;
    case "act-ambience":
      setActAmbience(event.act);
      break;
    case "weapon-fire":
      playWeaponFire(event.weaponId);
      break;
    case "weapon-reload":
      playWeaponReload(event.weaponId);
      break;
    case "weapon-empty":
      playEmpty();
      break;
    case "music-duck":
      duckBus(event.bus, event.db, event.attackS, event.holdS);
      break;
    case "charge-start":
      playChargeWhine(event.weaponId);
      break;
    case "charge-progress":
      tickChargeWhine(event.progress);
      break;
    case "charge-stop":
      stopChargeWhine();
      break;
    case "charge-release":
      playChargeRelease(event.weaponId, event.progress);
      break;
    case "vermin-spawn":
      playVerminSpawn();
      break;
    case "vermin-hit":
      playVerminHit(event.archetypeId);
      break;
    case "vermin-death":
      playVerminDeath(event.archetypeId);
      break;
    case "boss-leitmotif-start":
      startBossLeitmotif();
      break;
    case "boss-leitmotif-stop":
      stopBossLeitmotif();
      break;
    case "boss-death-sting":
      bossDeathSilenceSting();
      break;
  }
}

/**
 * Install the audio engine. Returns an uninstall function that detaches
 * the subscription. Engine tracks the highest seq drained so re-renders
 * never re-fire an event the runner emitted on a prior tick.
 *
 * Optional `dispatcher` injection makes the engine testable without a
 * Tone AudioContext — tests pass a spy and assert call shape.
 */
export function installAudioEngine(
  dispatcher: (e: AudioEvent) => void = dispatchAudioEvent,
): () => void {
  let lastSeq = 0;
  const unsubscribe = useGameStore.subscribe((state, prev) => {
    if (state.audioEvents === prev.audioEvents) return;
    if (state.settings.muted) {
      // Drain seq pointer even while muted so unmuting doesn't replay
      // the entire backlog.
      for (const ev of state.audioEvents) {
        if (ev.seq > lastSeq) lastSeq = ev.seq;
      }
      return;
    }
    for (const { seq, event } of state.audioEvents) {
      if (seq <= lastSeq) continue;
      lastSeq = seq;
      dispatcher(event);
    }
  });
  return unsubscribe;
}
