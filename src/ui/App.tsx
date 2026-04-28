import { useEffect } from "react";
import { setMasterVolumeDb, setMute } from "../audio/setup";
import { useGameStore } from "../runtime/store";
import { Briefing } from "./Briefing";
import { GameStage } from "./GameStage";
import { GlobalStyles } from "./GlobalStyles";
import { HUD } from "./HUD";
import { MissionResult } from "./MissionResult";
import { MissionSelect } from "./MissionSelect";
import { PauseMenu } from "./PauseMenu";
import { PawnShop } from "./PawnShop";
import { usePlayerProgress } from "./PlayerProgress";
import { autoPersistPlayerProgress, loadPlayerProgress } from "./PlayerProgressPersistence";
import { getMission } from "../sim/content/missions";

const MISSION_KILLS_REQUIRED = 8;

export function App() {
  const phase = useGameStore((s) => s.phase);
  const setPhase = useGameStore((s) => s.setPhase);
  const startMission = useGameStore((s) => s.startMission);
  const masterVolumeDb = useGameStore((s) => s.settings.masterVolumeDb);
  const muted = useGameStore((s) => s.settings.muted);

  useEffect(() => setMasterVolumeDb(masterVolumeDb), [masterVolumeDb]);
  useEffect(() => setMute(muted), [muted]);

  useEffect(() => {
    loadPlayerProgress();
    return autoPersistPlayerProgress();
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
      startMission(id, Math.max(MISSION_KILLS_REQUIRED, total));
    } catch {
      // Bad id — fallback to tutorial.
      startMission("streets-01-bodega", MISSION_KILLS_REQUIRED);
    }
  };

  const restart = () => {
    const id = useGameStore.getState().missionId;
    if (id) deploy(id);
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <GlobalStyles />
      {phase === "briefing" ? <Briefing /> : null}
      {phase === "mission-select" ? (
        <MissionSelect onPickMission={() => setPhase("pawn-shop")} />
      ) : null}
      {phase === "pawn-shop" ? (
        <PawnShop
          onContinue={() => deploy(usePlayerProgress.getState().selectedMissionId)}
          onBack={() => setPhase("mission-select")}
        />
      ) : null}
      {phase === "playing" ? (
        <>
          <GameStage />
          <HUD />
          <PauseMenu onRestart={restart} />
        </>
      ) : null}
      {phase === "won" || phase === "lost" ? (
        <>
          <GameStage />
          <HUD />
          <MissionResult />
        </>
      ) : null}
    </div>
  );
}
