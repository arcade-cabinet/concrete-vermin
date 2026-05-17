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

// dispatcher param exists so tests can pass a spy without booting Tone.
export function installAudioEngine(
  dispatcher: (e: AudioEvent) => void = dispatchAudioEvent,
): () => void {
  let lastSeq = 0;
  const unsubscribe = useGameStore.subscribe((state, prev) => {
    if (state.audioEvents === prev.audioEvents) return;
    if (state.settings.muted) {
      // Drain pointer so unmuting doesn't replay the backlog. seq is
      // monotonic so the last entry is the new high-water mark.
      const last = state.audioEvents[state.audioEvents.length - 1];
      if (last && last.seq > lastSeq) lastSeq = last.seq;
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
