import { type ModifierFlashSnapshot, useGameStore } from "../runtime/store";

const SODIUM = "#d4943a";
const PARCHMENT = "#e8dcc4";
const BRICK = "#7a2818";
const FLASH_TTL_S = 1.0;

const FLASH_LABELS: Record<ModifierFlashSnapshot["kind"], string> = {
  headshot: "HEADSHOT",
  "two-for-one": "2-FOR-1",
  "mid-air": "MID-AIR",
  variety: "VARIETY",
  "no-reload": "NO RELOAD",
};

const FLASH_COLORS: Record<ModifierFlashSnapshot["kind"], string> = {
  headshot: SODIUM,
  "two-for-one": "#ffd07a",
  "mid-air": "#a8d04a",
  variety: PARCHMENT,
  "no-reload": BRICK,
};

function ModifierFlashes() {
  const flashes = useGameStore((s) => s.modifierFlashes);
  const now = useGameStore((s) => s.now);
  // Newest first, fading by age.
  const visible = [...flashes].reverse().slice(0, 4);
  return (
    <div
      style={{
        position: "fixed",
        top: 36,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        pointerEvents: "none",
        fontFamily: "'Big Shoulders Display', sans-serif",
        textAlign: "center",
      }}
    >
      {visible.map((f) => {
        const age = now - f.at;
        if (age >= FLASH_TTL_S) return null;
        const t = age / FLASH_TTL_S;
        const alpha = 1 - t;
        const scale = 1 + (1 - t) * 0.15;
        const lift = -t * 18;
        return (
          <div
            key={`${f.kind}:${f.at}`}
            style={{
              opacity: alpha,
              transform: `translateY(${lift}px) scale(${scale})`,
              color: FLASH_COLORS[f.kind],
              fontSize: 14,
              letterSpacing: 2,
              textShadow: "0 1px 0 #000, 0 0 6px rgba(212, 148, 58, 0.4)",
              fontWeight: 700,
            }}
          >
            {FLASH_LABELS[f.kind]} +{Math.round(f.bonusPct * 100)}%
          </div>
        );
      })}
    </div>
  );
}

function MuteButton() {
  const muted = useGameStore((s) => s.settings.muted);
  const setMuted = useGameStore((s) => s.setMuted);
  return (
    <button
      type="button"
      onClick={() => setMuted(!muted)}
      aria-label={muted ? "Unmute audio" : "Mute audio"}
      style={{
        position: "fixed",
        bottom: "calc(12px + env(safe-area-inset-bottom))",
        right: "calc(12px + env(safe-area-inset-right))",
        background: "transparent",
        border: `1px solid ${SODIUM}`,
        color: SODIUM,
        padding: "4px 10px",
        fontFamily: "'Special Elite', monospace",
        fontSize: 12,
        cursor: "pointer",
        pointerEvents: "auto",
      }}
    >
      {muted ? "♪ MUTED" : "♪ ON"}
    </button>
  );
}

export function HUD() {
  const score = useGameStore((s) => s.score);
  const player = useGameStore((s) => s.player);
  const killCount = useGameStore((s) => s.killCount);
  const killsRequired = useGameStore((s) => s.killsRequired);

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: "calc(12px + env(safe-area-inset-top))",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "space-between",
          padding:
            "0 calc(16px + env(safe-area-inset-right)) 0 calc(16px + env(safe-area-inset-left))",
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
      <ModifierFlashes />
      <MuteButton />
    </>
  );
}
