import { startStreetsAmbience } from "../audio/music";
import { ensureAudio } from "../audio/setup";
import { useGameStore } from "../runtime/store";
import { COLOR, TYPE } from "../theme/tokens";

/**
 * Briefing splash. The player's first 15 seconds — explain the goal in
 * one sentence, then auto-advance. Player-journey gate (CLAUDE.md §8).
 */
export function Briefing() {
  const setPhase = useGameStore((s) => s.setPhase);

  return (
    <div
      data-testid="briefing"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        background: COLOR.bgAsphalt,
        color: COLOR.cream,
        fontFamily: TYPE.faceDisplay,
        textAlign: "center",
        padding: 32,
      }}
    >
      <h1
        style={{
          color: COLOR.sodium,
          fontSize: TYPE.display.size,
          margin: 0,
          letterSpacing: 2,
        }}
      >
        CONCRETE VERMIN
      </h1>
      <p style={{ fontSize: "clamp(1rem, 2vw, 1.4rem)", maxWidth: 520, margin: 0 }}>
        Bodega backroom. Eight rats. Drag to aim, tap to fire.
      </p>
      <button
        type="button"
        onClick={async () => {
          await ensureAudio();
          startStreetsAmbience();
          setPhase("mission-select");
        }}
        style={{
          background: COLOR.sodium,
          color: COLOR.bgAsphalt,
          border: "none",
          padding: "12px 28px",
          fontFamily: "inherit",
          fontSize: "1.2rem",
          letterSpacing: 2,
          cursor: "pointer",
          textTransform: "uppercase",
        }}
      >
        Begin
      </button>
    </div>
  );
}
