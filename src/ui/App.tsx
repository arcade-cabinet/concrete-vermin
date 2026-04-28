import { lazy, Suspense, useEffect } from "react";
import {
  setMasterVolumeDb,
  setMusicVolumeDb,
  setSfxVolumeDb,
  setUiVolumeDb,
  setMute,
} from "../audio/setup";
import { setHapticsEnabled } from "../platform/haptics";
import { useGameStore } from "../runtime/store";
import { ArcadeFrame } from "./ArcadeFrame";
import { Briefing } from "./Briefing";
import { GameStage } from "./GameStage";
import { GlobalStyles } from "./GlobalStyles";
import { MainMenu } from "./MainMenu";
import { MissionResult } from "./MissionResult";
import { MissionSelect } from "./MissionSelect";
import { OpeningInterstitial } from "./OpeningInterstitial";
import { ToastHost } from "./Toast";

// Lazy-loaded — these screens / overlays are reached after Press Start
// or only on specific player choices, so deferring their JS shaves the
// critical-path bundle. React.lazy needs a default export, so each
// dynamic-import returns a tiny wrapper around the named export.
const Credits = lazy(() => import("./Credits").then((m) => ({ default: m.Credits })));
const PauseMenu = lazy(() => import("./PauseMenu").then((m) => ({ default: m.PauseMenu })));
const FirstLaunchOverlay = lazy(() =>
  import("./FirstLaunchOverlay").then((m) => ({ default: m.FirstLaunchOverlay })),
);
const PawnShop = lazy(() => import("./PawnShop").then((m) => ({ default: m.PawnShop })));
import { SrLiveRegion } from "./SrLiveRegion";
import { srMissionComplete, srMissionFailed, srMissionStart } from "../runtime/sr-only";
import { usePlayerProgress } from "./PlayerProgress";
import { autoPersistPlayerProgress, loadPlayerProgress } from "./PlayerProgressPersistence";
import { installAchievementsTracker } from "../runtime/achievementsTracker";
import { getMission } from "../sim/content/missions";

const MISSION_KILLS_REQUIRED = 1;

export function App() {
  const phase = useGameStore((s) => s.phase);
  const setPhase = useGameStore((s) => s.setPhase);
  const startMission = useGameStore((s) => s.startMission);
  const masterVolumeDb = useGameStore((s) => s.settings.masterVolumeDb);
  const musicVolumeDb = useGameStore((s) => s.settings.musicVolumeDb);
  const sfxVolumeDb = useGameStore((s) => s.settings.sfxVolumeDb);
  const uiVolumeDb = useGameStore((s) => s.settings.uiVolumeDb);
  const muted = useGameStore((s) => s.settings.muted);
  const haptics = useGameStore((s) => s.settings.haptics);

  useEffect(() => setMasterVolumeDb(masterVolumeDb), [masterVolumeDb]);
  useEffect(() => setMusicVolumeDb(musicVolumeDb), [musicVolumeDb]);
  useEffect(() => setSfxVolumeDb(sfxVolumeDb), [sfxVolumeDb]);
  useEffect(() => setUiVolumeDb(uiVolumeDb), [uiVolumeDb]);
  useEffect(() => setMute(muted), [muted]);
  useEffect(() => setHapticsEnabled(haptics), [haptics]);

  useEffect(() => {
    loadPlayerProgress();
    const teardownPersist = autoPersistPlayerProgress();
    const teardownAchievements = installAchievementsTracker();
    return () => {
      teardownPersist();
      teardownAchievements();
    };
  }, []);

  // When the runner finishes a mission and credits cashAwarded into the
  // game store, sync that into PlayerProgress (which the pawn shop reads
  // and persistence saves), then unlock the mission. Resets the
  // per-session cashAwarded so the next mission starts at zero.
  useEffect(() => {
    const unsub = useGameStore.subscribe((s, prev) => {
      if (s.cashAwarded > prev.cashAwarded) {
        const delta = s.cashAwarded - prev.cashAwarded;
        usePlayerProgress.getState().awardCash(delta);
      }
      if (s.phase === "won" && prev.phase !== "won" && s.missionId) {
        usePlayerProgress.getState().unlockMission(s.missionId);
        const score = s.score.total;
        useGameStore
          .getState()
          .announceForScreenReader(srMissionComplete("Cleared", score).text, "assertive");
      }
      if (s.phase === "lost" && prev.phase !== "lost") {
        useGameStore.getState().announceForScreenReader(srMissionFailed().text, "assertive");
      }
    });
    return unsub;
  }, []);

  // Seed the reduced-motion setting from the OS preference at boot, then
  // keep it in sync with the matchMedia. The user can still override
  // either way through the settings dialog (CV-UX, coming).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    useGameStore.getState().setReducedMotion(mql.matches);
    const onChange = (e: MediaQueryListEvent) =>
      useGameStore.getState().setReducedMotion(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const deploy = (id: string) => {
    try {
      const m = getMission(id);
      // Total kills required = sum of spawn counts in non-boss encounters,
      // plus 1 for any boss-scripted encounter (the boss itself).
      const total = m.encounters.reduce((acc, e) => {
        const enc = e.spawns.reduce((a, s) => a + (s.pattern === "boss-scripted" ? 1 : s.count), 0);
        return acc + enc;
      }, 0);
      startMission(id, Math.max(MISSION_KILLS_REQUIRED, total), m.act);
      const title = id
        .replace(/^[a-z]+-\d+-/, "")
        .replace(/-/g, " ");
      useGameStore.getState().announceForScreenReader(srMissionStart(title, m.weapon).text, "polite");
    } catch {
      // Bad id — fallback to tutorial.
      startMission("streets-01-bodega", MISSION_KILLS_REQUIRED, "streets");
    }
  };

  const restart = () => {
    const id = useGameStore.getState().missionId;
    if (id) deploy(id);
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <GlobalStyles />
      <SrLiveRegion />
      <ToastHost />
      <OpeningInterstitial />
      {phase === "main-menu" ? <MainMenu /> : null}
      {phase === "credits" ? (
        <Suspense fallback={null}>
          <Credits />
        </Suspense>
      ) : null}
      {phase === "briefing" ? <Briefing /> : null}
      {phase === "mission-select" ? (
        <MissionSelect
          onPickMission={() => deploy(usePlayerProgress.getState().selectedMissionId)}
        />
      ) : null}
      {phase === "pawn-shop" ? (
        <Suspense fallback={null}>
          <PawnShop
            onContinue={() => setPhase("mission-select")}
            onBack={() => setPhase("mission-select")}
          />
        </Suspense>
      ) : null}
      {phase === "playing" ? (
        <>
          <ArcadeFrame>
            <GameStage />
          </ArcadeFrame>
          <Suspense fallback={null}>
            <PauseMenu onRestart={restart} />
          </Suspense>
          <Suspense fallback={null}>
            <FirstLaunchOverlay />
          </Suspense>
        </>
      ) : null}
      {phase === "won" || phase === "lost" ? (
        <>
          <ArcadeFrame>
            <GameStage />
          </ArcadeFrame>
          <MissionResult />
        </>
      ) : null}
    </div>
  );
}
