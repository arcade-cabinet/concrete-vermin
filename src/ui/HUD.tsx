import { useGameStore } from "../runtime/store";

const SODIUM = "#d4943a";
const PARCHMENT = "#e8dcc4";

export function HUD() {
  const score = useGameStore((s) => s.score);
  const player = useGameStore((s) => s.player);
  const killCount = useGameStore((s) => s.killCount);
  const killsRequired = useGameStore((s) => s.killsRequired);

  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "space-between",
        padding: "0 16px",
        pointerEvents: "none",
        fontFamily: "'Special Elite', monospace",
        color: PARCHMENT,
        textShadow: "0 1px 0 #000",
        fontSize: 14,
      }}
    >
      <div>
        <span style={{ color: SODIUM }}>SCORE</span> {score.total.toString().padStart(6, "0")}
        {"  "}
        <span style={{ color: SODIUM }}>×{score.multiplier.toFixed(1)}</span>
      </div>
      <div data-testid="hud-kills">
        <span style={{ color: SODIUM }}>VERMIN</span> {killCount} / {killsRequired}
      </div>
      <div>
        <span style={{ color: SODIUM }}>SHELLS</span> {player.ammoCurrent}/{player.ammoMax}
        {"  "}
        <span style={{ color: SODIUM }}>LIVES</span> {player.livesRemaining}
      </div>
    </div>
  );
}
