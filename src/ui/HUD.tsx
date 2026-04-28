import { useEffect } from "react";
import { type ModifierFlashSnapshot, useGameStore } from "../runtime/store";
import { COLOR, MOTION, TYPE } from "../theme/tokens";
import { useTickedNumber } from "./hooks/useTickedNumber";
import { useIsNarrow, usePrefersReducedMotion } from "./hooks/useViewport";

const FLASH_TTL_S = 1.0;
const TOUCH_TARGET_PX = 44;
const HUD_STYLE_ID = "cv-hud-pulse-styles";

const FLASH_LABELS: Record<ModifierFlashSnapshot["kind"], string> = {
  headshot: "HEADSHOT",
  "two-for-one": "2-FOR-1",
  "mid-air": "MID-AIR",
  variety: "VARIETY",
  "no-reload": "NO RELOAD",
};

const FLASH_COLORS: Record<ModifierFlashSnapshot["kind"], string> = {
  headshot: COLOR.sodium,
  "two-for-one": COLOR.flashSodiumLight,
  "mid-air": COLOR.flashGreen,
  variety: COLOR.cream,
  "no-reload": COLOR.brick,
};

const HUD_KEYFRAMES = `
@keyframes cv-pulse-empty {
  0%, 100% { color: ${COLOR.sodium}; }
  50% { color: ${COLOR.brick}; }
}
@keyframes cv-pulse-critical {
  0%, 100% { color: ${COLOR.brick}; opacity: 1; }
  50% { color: ${COLOR.brick}; opacity: 0.5; }
}
.cv-pulse-empty { animation: cv-pulse-empty ${MOTION.criticalLifeMs}ms ease-in-out infinite; }
.cv-pulse-critical { animation: cv-pulse-critical ${MOTION.criticalLifeMs}ms ease-in-out infinite; }
`;

/**
 * Inject the HUD's keyframe stylesheet once per page. Components opt
 * in via classNames; reduced-motion just doesn't apply the class so the
 * keyframes stay parked. Idempotent: keyed off a stable element id so
 * StrictMode double-render doesn't add a duplicate sheet.
 */
function useHudStyles(): void {
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById(HUD_STYLE_ID)) return;
    const el = document.createElement("style");
    el.id = HUD_STYLE_ID;
    el.textContent = HUD_KEYFRAMES;
    document.head.appendChild(el);
  }, []);
}

function ModifierFlashes() {
  const flashes = useGameStore((s) => s.modifierFlashes);
  const now = useGameStore((s) => s.now);
  const reduced = useReducedMotion();
  const visible = [...flashes].reverse().slice(0, 4);
  return (
    <div
      style={{
        position: "fixed",
        top: "calc(36px + env(safe-area-inset-top))",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        pointerEvents: "none",
        fontFamily: TYPE.faceDisplay,
        textAlign: "center",
      }}
    >
      {visible.map((f) => {
        const age = now - f.at;
        if (age >= FLASH_TTL_S) return null;
        const t = age / FLASH_TTL_S;
        const alpha = 1 - t;
        // Reduced-motion: hold scale 1, no lift. The flash still
        // appears and fades — that's information, not animation.
        const scale = reduced ? 1 : 1 + (1 - t) * 0.15;
        const lift = reduced ? 0 : -t * 18;
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
        border: `1px solid ${COLOR.sodium}`,
        color: COLOR.sodium,
        minWidth: TOUCH_TARGET_PX,
        minHeight: TOUCH_TARGET_PX,
        padding: "0 12px",
        fontFamily: TYPE.faceMono,
        fontSize: 12,
        cursor: "pointer",
        pointerEvents: "auto",
      }}
    >
      {muted ? "♪ MUTED" : "♪ ON"}
    </button>
  );
}

/**
 * Resolve "should I animate?" from the store setting first, then the
 * OS-level media query as a fallback. Store wins so a player can opt in
 * to motion even when the OS reports reduce; or opt out independently.
 */
function useReducedMotion(): boolean {
  const fromOs = usePrefersReducedMotion();
  const fromSettings = useGameStore((s) => s.settings.reducedMotion);
  return fromSettings || fromOs;
}

export function HUD() {
  const score = useGameStore((s) => s.score);
  const player = useGameStore((s) => s.player);
  const killCount = useGameStore((s) => s.killCount);
  const killsRequired = useGameStore((s) => s.killsRequired);
  const narrow = useIsNarrow();
  const reduced = useReducedMotion();

  useHudStyles();
  const displayedTotal = useTickedNumber(score.total, { instant: reduced });
  const ammoEmpty = player.ammoCurrent === 0;
  const livesCritical = player.livesRemaining <= 1;

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: "calc(12px + env(safe-area-inset-top))",
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: narrow ? "column" : "row",
          justifyContent: narrow ? "flex-start" : "space-between",
          alignItems: narrow ? "center" : "stretch",
          gap: narrow ? 2 : 0,
          padding:
            "0 calc(16px + env(safe-area-inset-right)) 0 calc(16px + env(safe-area-inset-left))",
          pointerEvents: "none",
          fontFamily: TYPE.faceMono,
          color: COLOR.cream,
          textShadow: "0 1px 0 #000",
          fontSize: narrow ? 12 : 14,
        }}
      >
        <div>
          <span style={{ color: COLOR.sodium }}>SCORE</span>{" "}
          {displayedTotal.toString().padStart(6, "0")}
          {"  "}
          <span style={{ color: COLOR.sodium }}>×{score.multiplier.toFixed(1)}</span>
        </div>
        <div data-testid="hud-kills">
          <span style={{ color: COLOR.sodium }}>VERMIN</span> {killCount} / {killsRequired}
        </div>
        <div>
          <span
            // Sodium → brick pulse when the tube is empty. Suppressed
            // under reduced-motion so the player sees a static brick
            // "SHELLS 0/6" (still differentiable, just not noisy).
            className={ammoEmpty && !reduced ? "cv-pulse-empty" : undefined}
            style={{ color: ammoEmpty ? COLOR.brick : COLOR.sodium }}
          >
            SHELLS
          </span>{" "}
          {player.ammoCurrent}/{player.ammoMax}
          {"  "}
          <span
            className={livesCritical && !reduced ? "cv-pulse-critical" : undefined}
            style={{ color: livesCritical ? COLOR.brick : COLOR.sodium }}
          >
            LIVES
          </span>{" "}
          <span style={{ color: livesCritical ? COLOR.brick : COLOR.cream }}>
            {player.livesRemaining}
          </span>
        </div>
      </div>
      <ModifierFlashes />
      <MuteButton />
    </>
  );
}
