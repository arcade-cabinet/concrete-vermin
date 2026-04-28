import { useGameStore } from "../runtime/store";
import { Briefing } from "./Briefing";
import { GameStage } from "./GameStage";
import { HUD } from "./HUD";
import { MissionResult } from "./MissionResult";

export function App() {
  const phase = useGameStore((s) => s.phase);

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
