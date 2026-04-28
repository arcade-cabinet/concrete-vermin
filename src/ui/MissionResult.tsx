import { useGameStore } from "../runtime/store";

const SODIUM = "#d4943a";
const PARCHMENT = "#e8dcc4";
const BRICK = "#7a2818";

export function MissionResult() {
  const phase = useGameStore((s) => s.phase);
  const score = useGameStore((s) => s.score);
  const setPhase = useGameStore((s) => s.setPhase);
  const won = phase === "won";

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
        gap: 24,
        background: "rgba(13, 12, 10, 0.92)",
        color: PARCHMENT,
        fontFamily: "'Big Shoulders Display', sans-serif",
        textAlign: "center",
        padding: 32,
      }}
    >
      <h1
        style={{
          color: won ? SODIUM : BRICK,
          fontSize: "clamp(2rem, 6vw, 4rem)",
          margin: 0,
          letterSpacing: 4,
          textTransform: "uppercase",
        }}
      >
        {won ? "Cleared" : "Wiped Out"}
      </h1>
      <p style={{ fontSize: "1.2rem", margin: 0 }}>
        Score <span style={{ color: SODIUM }}>{score.total}</span>
      </p>
      <button
        type="button"
        onClick={() => setPhase("briefing")}
        style={{
          background: SODIUM,
          color: "#0d0c0a",
          border: "none",
          padding: "12px 28px",
          fontFamily: "inherit",
          fontSize: "1.2rem",
          letterSpacing: 2,
          cursor: "pointer",
          textTransform: "uppercase",
        }}
      >
        Again
      </button>
    </div>
  );
}
