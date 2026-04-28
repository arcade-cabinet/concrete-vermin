import { useEffect } from "react";
import { setMasterVolumeDb, setMute } from "../audio/setup";
import { useGameStore } from "../runtime/store";
import { Briefing } from "./Briefing";
import { GameStage } from "./GameStage";
import { HUD } from "./HUD";
import { MissionResult } from "./MissionResult";

export function App() {
  const phase = useGameStore((s) => s.phase);
  const masterVolumeDb = useGameStore((s) => s.settings.masterVolumeDb);
  const muted = useGameStore((s) => s.settings.muted);

  useEffect(() => setMasterVolumeDb(masterVolumeDb), [masterVolumeDb]);
  useEffect(() => setMute(muted), [muted]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      {phase === "briefing" ? <Briefing /> : null}
      {phase === "playing" ? (
        <>
          <GameStage />
          <HUD />
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
