import { useEffect, useRef } from "react";
import { useGameStore } from "../runtime/store";
import { useIsNarrow } from "./hooks/useViewport";
import { usePlayerProgress } from "./PlayerProgress";
import { COLOR, TYPE } from "../theme/tokens";

const CASH_PER_KILL = 12;

export function MissionResult() {
  const phase = useGameStore((s) => s.phase);
  const score = useGameStore((s) => s.score);
  const killCount = useGameStore((s) => s.killCount);
  const missionId = useGameStore((s) => s.missionId);
  const setPhase = useGameStore((s) => s.setPhase);
  const won = phase === "won";
  const narrow = useIsNarrow();

  const awarded = useRef(false);
  useEffect(() => {
    if (awarded.current) return;
    awarded.current = true;
    if (won) {
      const p = usePlayerProgress.getState();
      p.awardCash(killCount * CASH_PER_KILL);
      if (missionId) p.unlockMission(missionId);
    }
  }, [won, killCount, missionId]);

  return (
    <div
      data-testid="mission-result"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "clamp(16px, 4vw, 32px)",
        // Translucent asphalt overlay — keeps the stage dimly visible
        // behind the result so it reads as "the mission ended" rather
        // than a hard cut to a separate screen.
        background: "rgba(13, 12, 10, 0.92)",
        color: COLOR.cream,
        fontFamily: TYPE.faceDisplay,
        textAlign: "center",
        padding:
          "calc(32px + env(safe-area-inset-top)) calc(24px + env(safe-area-inset-right)) " +
          "calc(32px + env(safe-area-inset-bottom)) calc(24px + env(safe-area-inset-left))",
      }}
    >
      <h1
        style={{
          color: won ? COLOR.sodium : COLOR.brick,
          fontSize: TYPE.display.size,
          margin: 0,
          letterSpacing: 4,
          textTransform: "uppercase",
        }}
      >
        {won ? "Cleared" : "Wiped Out"}
      </h1>
      <p style={{ fontSize: "1.2rem", margin: 0 }}>
        Score <span style={{ color: COLOR.sodium }}>{score.total}</span>
        {won ? (
          <>
            {"  ·  "}
            Earned <span style={{ color: COLOR.sodium }}>${killCount * CASH_PER_KILL}</span>
          </>
        ) : null}
      </p>
      <div
        style={{
          display: "flex",
          flexDirection: narrow ? "column" : "row",
          gap: 12,
          width: narrow ? "100%" : "auto",
          maxWidth: 360,
        }}
      >
        <button
          type="button"
          onClick={() => setPhase("mission-select")}
          style={{
            background: COLOR.sodium,
            color: COLOR.bgAsphalt,
            border: "none",
            // Touch-target floor.
            minWidth: 44,
            minHeight: 44,
            padding: "12px 28px",
            fontFamily: "inherit",
            fontSize: "1.2rem",
            letterSpacing: 2,
            cursor: "pointer",
            textTransform: "uppercase",
            width: narrow ? "100%" : undefined,
          }}
        >
          Mission Select
        </button>
      </div>
    </div>
  );
}
