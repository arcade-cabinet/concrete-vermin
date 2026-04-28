import { type ReactNode, useEffect } from "react";
import { type ModifierFlashSnapshot, useGameStore } from "../runtime/store";
import { COLOR, MOTION, TYPE } from "../theme/tokens";
import { useTickedNumber } from "./hooks/useTickedNumber";
import { useIsNarrow, usePrefersReducedMotion } from "./hooks/useViewport";
import { getMission } from "../sim/content/missions";

const FLASH_TTL_S = 1.0;
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
  50% { color: ${COLOR.brickAccessible}; }
}
@keyframes cv-pulse-critical {
  0%, 100% { color: ${COLOR.brickAccessible}; opacity: 1; }
  50% { color: ${COLOR.brickAccessible}; opacity: 0.5; }
}
.cv-pulse-empty { animation: cv-pulse-empty ${MOTION.criticalLifeMs}ms ease-in-out infinite; }
.cv-pulse-critical { animation: cv-pulse-critical ${MOTION.criticalLifeMs}ms ease-in-out infinite; }
`;

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

/**
 * Frames the play canvas as a 1979 arcade-cabinet bezel: sodium-amber
 * marquee on top with the mission title, primary HUD readouts inset
 * into the brushed-asphalt sides, and corner brackets on every panel.
 *
 * Why this exists:
 * The canvas used to float in dead viewport space with the HUD spread
 * across the top edge. Players reported the play area "wasn't framed"
 * and didn't scale to fit. This component is the chrome around the
 * canvas — it grows / shrinks with the viewport and pins the canvas
 * into a 16:9 panel inside it.
 *
 * Layout:
 *   ┌──────────── MARQUEE (mission title + act bullet) ─────────────┐
 *   │ ┌─SCORE──┐  ┌─────────────── CANVAS ─────────────┐  ┌─SHELLS─┐│
 *   │ │ ×1.0   │  │                                     │  │ LIVES  ││
 *   │ └────────┘  └─────────────────────────────────────┘  └────────┘│
 *   └────────────────────── TICKER (kills / req) ───────────────────┘
 *
 * On narrow viewports the side rails collapse and the readouts move
 * onto the marquee + ticker. The bezel still surrounds the canvas.
 */
export function ArcadeFrame({ children }: { children: ReactNode }) {
  const narrow = useIsNarrow();
  useHudStyles();
  return (
    <div
      data-testid="arcade-frame"
      style={{
        position: "fixed",
        inset: 0,
        background: `radial-gradient(ellipse at 50% 40%, ${COLOR.bgConcrete} 0%, ${COLOR.bgAsphalt} 80%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "stretch",
        padding:
          "calc(8px + env(safe-area-inset-top)) calc(8px + env(safe-area-inset-right)) " +
          "calc(8px + env(safe-area-inset-bottom)) calc(8px + env(safe-area-inset-left))",
      }}
    >
      <Marquee />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: narrow ? "column" : "row",
          gap: narrow ? 4 : 8,
          margin: "8px 0",
        }}
      >
        {!narrow ? <SideRailLeft /> : null}
        <CanvasWell>
          {children}
          <ModifierFlashes />
        </CanvasWell>
        {!narrow ? <SideRailRight /> : null}
      </div>
      <Ticker />
      <MuteButton />
      <ScoreNarration />
      <StreakChipsLive />
    </div>
  );
}

/* ============================================================== */
/* Bezel chrome                                                   */
/* ============================================================== */

function bezelStyle(): React.CSSProperties {
  return {
    position: "relative",
    background: `linear-gradient(180deg, ${COLOR.bgConcreteDark} 0%, ${COLOR.bgAsphalt} 100%)`,
    border: `1px solid ${COLOR.sodium}55`,
    boxShadow: `inset 0 0 12px ${COLOR.bgAsphalt}, 0 0 18px ${COLOR.sodium}11`,
    color: COLOR.cream,
    fontFamily: TYPE.faceMono,
  };
}

function CornerBracket({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const len = 10;
  const w = 1;
  const top = pos === "tl" || pos === "tr" ? -1 : undefined;
  const bottom = pos === "bl" || pos === "br" ? -1 : undefined;
  const left = pos === "tl" || pos === "bl" ? -1 : undefined;
  const right = pos === "tr" || pos === "br" ? -1 : undefined;
  const rot = pos === "tl" ? 0 : pos === "tr" ? 90 : pos === "br" ? 180 : 270;
  return (
    <span
      aria-hidden="true"
      style={{
        position: "absolute",
        top,
        bottom,
        left,
        right,
        width: len,
        height: len,
        borderTop: `${w}px solid ${COLOR.sodium}`,
        borderLeft: `${w}px solid ${COLOR.sodium}`,
        transform: `rotate(${rot}deg)`,
        pointerEvents: "none",
      }}
    />
  );
}

function Brackets() {
  return (
    <>
      <CornerBracket pos="tl" />
      <CornerBracket pos="tr" />
      <CornerBracket pos="bl" />
      <CornerBracket pos="br" />
    </>
  );
}

/* ============================================================== */
/* Marquee — top strip with mission title + act bullet            */
/* ============================================================== */

const ACT_BULLET: Record<"streets" | "underworld" | "above", { label: string; color: string }> = {
  streets: { label: "S", color: COLOR.sodium },
  underworld: { label: "U", color: COLOR.eliteGreen },
  above: { label: "A", color: COLOR.flashSodiumLight },
};

function Marquee() {
  const missionId = useGameStore((s) => s.missionId);
  const act = useGameStore((s) => s.missionAct);
  const bullet = ACT_BULLET[act];
  const title = missionTitle(missionId);
  return (
    <div
      data-testid="arcade-marquee"
      style={{
        ...bezelStyle(),
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Brackets />
      <span
        aria-hidden="true"
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          border: `1.5px solid ${bullet.color}`,
          color: bullet.color,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: TYPE.faceDisplay,
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: 0,
          flex: "none",
        }}
      >
        {bullet.label}
      </span>
      <span
        style={{
          color: COLOR.sodium,
          fontFamily: TYPE.faceDisplay,
          letterSpacing: "0.3em",
          fontSize: 14,
          textTransform: "uppercase",
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </span>
      <ScoreReadout />
    </div>
  );
}

function ScoreReadout() {
  const score = useGameStore((s) => s.score);
  const reduced = useReducedMotion();
  const displayed = useTickedNumber(score.total, { instant: reduced });
  return (
    <span
      data-testid="arcade-score"
      style={{
        color: COLOR.cream,
        fontFamily: TYPE.faceMono,
        fontSize: 13,
        letterSpacing: "0.15em",
        flex: "none",
      }}
    >
      <span style={{ color: COLOR.sodium }}>SCORE</span>{" "}
      {displayed.toString().padStart(6, "0")}
      {"  "}
      <span style={{ color: COLOR.sodium }}>×{score.multiplier.toFixed(1)}</span>
    </span>
  );
}

/* ============================================================== */
/* Side rails — readouts inset into the bezel sides               */
/* ============================================================== */

function SideRailLeft() {
  return (
    <div
      data-testid="arcade-rail-left"
      style={{
        ...bezelStyle(),
        width: 90,
        flex: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "16px 8px",
        gap: 18,
      }}
    >
      <Brackets />
      <ShellsReadout />
      <ReloadReadout />
    </div>
  );
}

function SideRailRight() {
  return (
    <div
      data-testid="arcade-rail-right"
      style={{
        ...bezelStyle(),
        width: 90,
        flex: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "16px 8px",
        gap: 18,
      }}
    >
      <Brackets />
      <LivesReadout />
      <KillsReadout />
    </div>
  );
}

function ShellsReadout() {
  const player = useGameStore((s) => s.player);
  const reload = useGameStore((s) => s.reloadProgress);
  const empty = player.ammoCurrent === 0;
  const reduced = useReducedMotion();
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          color: empty ? COLOR.brickAccessible : COLOR.sodium,
          fontFamily: TYPE.faceMono,
          fontSize: 10,
          letterSpacing: "0.25em",
        }}
      >
        SHELLS
      </div>
      <div
        style={{
          color: COLOR.cream,
          fontFamily: TYPE.faceDisplay,
          fontSize: 24,
          letterSpacing: "0.08em",
          lineHeight: 1,
          marginTop: 4,
        }}
      >
        {player.ammoCurrent}/{player.ammoMax}
      </div>
      {reload !== null && !reduced ? (
        <div
          role="progressbar"
          aria-label="Reloading"
          aria-valuenow={Math.round(reload * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{
            marginTop: 6,
            width: "100%",
            height: 3,
            background: COLOR.bgConcreteDark,
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          <span
            style={{
              display: "block",
              height: "100%",
              width: `${reload * 100}%`,
              background: COLOR.sodium,
              transition: "width 60ms linear",
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function ReloadReadout() {
  const reload = useGameStore((s) => s.reloadProgress);
  if (reload === null) return null;
  return (
    <div
      style={{
        color: COLOR.sodium,
        fontFamily: TYPE.faceMono,
        fontSize: 10,
        letterSpacing: "0.2em",
      }}
    >
      RELOAD
    </div>
  );
}

function LivesReadout() {
  const player = useGameStore((s) => s.player);
  const critical = player.livesRemaining <= 1;
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          color: critical ? COLOR.brickAccessible : COLOR.sodium,
          fontFamily: TYPE.faceMono,
          fontSize: 10,
          letterSpacing: "0.25em",
        }}
      >
        LIVES
      </div>
      <div
        style={{
          color: critical ? COLOR.brickAccessible : COLOR.cream,
          fontFamily: TYPE.faceDisplay,
          fontSize: 26,
          letterSpacing: "0.08em",
          lineHeight: 1,
          marginTop: 4,
        }}
      >
        {player.livesRemaining}
      </div>
    </div>
  );
}

function KillsReadout() {
  const killCount = useGameStore((s) => s.killCount);
  const killsRequired = useGameStore((s) => s.killsRequired);
  return (
    <div data-testid="arcade-kills" style={{ textAlign: "center" }}>
      <div
        style={{
          color: COLOR.sodium,
          fontFamily: TYPE.faceMono,
          fontSize: 10,
          letterSpacing: "0.25em",
        }}
      >
        VERMIN
      </div>
      <div
        style={{
          color: COLOR.cream,
          fontFamily: TYPE.faceDisplay,
          fontSize: 22,
          letterSpacing: "0.08em",
          lineHeight: 1,
          marginTop: 4,
        }}
      >
        {killCount}/{killsRequired}
      </div>
    </div>
  );
}

/* ============================================================== */
/* Canvas well — the play surface lives here                      */
/* ============================================================== */

function CanvasWell({ children }: { children: ReactNode }) {
  return (
    <div
      data-testid="arcade-canvas-well"
      style={{
        ...bezelStyle(),
        position: "relative",
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: COLOR.bgAsphalt,
      }}
    >
      <Brackets />
      {children}
    </div>
  );
}

/* ============================================================== */
/* Ticker — bottom strip with progress + mission HUD chips        */
/* ============================================================== */

function Ticker() {
  const narrow = useIsNarrow();
  const killCount = useGameStore((s) => s.killCount);
  const killsRequired = useGameStore((s) => s.killsRequired);
  const player = useGameStore((s) => s.player);
  const empty = player.ammoCurrent === 0;
  const lifeCrit = player.livesRemaining <= 1;
  const pct = killsRequired > 0 ? Math.min(1, killCount / killsRequired) : 0;
  return (
    <div
      data-testid="arcade-ticker"
      style={{
        ...bezelStyle(),
        padding: "8px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontSize: 11,
        letterSpacing: "0.2em",
      }}
    >
      <Brackets />
      <span style={{ color: COLOR.sodium, flex: "none" }}>PROGRESS</span>
      <span
        style={{
          flex: 1,
          height: 5,
          background: COLOR.bgConcreteDark,
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        <span
          style={{
            display: "block",
            height: "100%",
            width: `${pct * 100}%`,
            background: COLOR.sodium,
            transition: "width 200ms linear",
            boxShadow: `0 0 8px ${COLOR.sodium}99`,
          }}
        />
      </span>
      <span style={{ color: COLOR.cream, flex: "none" }}>
        {killCount}/{killsRequired}
      </span>
      {narrow ? (
        <>
          <span style={{ color: empty ? COLOR.brickAccessible : COLOR.cream, flex: "none" }}>
            {player.ammoCurrent}/{player.ammoMax}
          </span>
          <span style={{ color: lifeCrit ? COLOR.brickAccessible : COLOR.cream, flex: "none" }}>
            ❤ {player.livesRemaining}
          </span>
        </>
      ) : null}
    </div>
  );
}

/* ============================================================== */
/* Helpers                                                        */
/* ============================================================== */

function missionTitle(id: string): string {
  if (!id) return "DEPLOYMENT";
  try {
    const m = getMission(id);
    return m.cutscene.interstitial.title.toUpperCase();
  } catch {
    return id
      .replace(/^[a-z]+-\d+-/, "")
      .replace(/-/g, " ")
      .toUpperCase();
  }
}

function useReducedMotion(): boolean {
  const fromOs = usePrefersReducedMotion();
  const fromSettings = useGameStore((s) => s.settings.reducedMotion);
  return fromSettings || fromOs;
}

/* ============================================================== */
/* HUD overlays — modifier flashes, mute, sr-only narrations      */
/* ============================================================== */

function ModifierFlashes() {
  const flashes = useGameStore((s) => s.modifierFlashes);
  const now = useGameStore((s) => s.now);
  const reduced = useReducedMotion();
  const visible = [...flashes].reverse().slice(0, 4);
  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        pointerEvents: "none",
        fontFamily: TYPE.faceDisplay,
        textAlign: "center",
        zIndex: 10,
      }}
    >
      {visible.map((f) => {
        const age = now - f.at;
        if (age >= FLASH_TTL_S) return null;
        const t = age / FLASH_TTL_S;
        const alpha = 1 - t;
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
        bottom: "calc(60px + env(safe-area-inset-bottom))",
        right: "calc(12px + env(safe-area-inset-right))",
        background: "transparent",
        border: `1px solid ${COLOR.sodium}`,
        color: COLOR.sodium,
        minWidth: 44,
        minHeight: 44,
        padding: "0 12px",
        fontFamily: TYPE.faceMono,
        fontSize: 12,
        cursor: "pointer",
        pointerEvents: "auto",
        zIndex: 12,
      }}
    >
      {muted ? "♪ MUTED" : "♪ ON"}
    </button>
  );
}

function ScoreNarration() {
  const score = useGameStore((s) => s.score);
  const player = useGameStore((s) => s.player);
  const killCount = useGameStore((s) => s.killCount);
  const killsRequired = useGameStore((s) => s.killsRequired);
  const reduced = useReducedMotion();
  const displayedTotal = useTickedNumber(score.total, { instant: reduced });
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={visuallyHidden}
    >
      Score {displayedTotal}, vermin {killCount} of {killsRequired}, shells {player.ammoCurrent}{" "}
      of {player.ammoMax}, lives {player.livesRemaining}.
    </div>
  );
}

function StreakChipsLive() {
  const flashes = useGameStore((s) => s.modifierFlashes);
  const latest = flashes[flashes.length - 1];
  const text = latest
    ? `${FLASH_LABELS[latest.kind]} bonus, plus ${Math.round(latest.bonusPct)} percent.`
    : "";
  return (
    <div data-testid="hud-streak-live" aria-live="polite" aria-atomic="true" style={visuallyHidden}>
      {text}
    </div>
  );
}

const visuallyHidden: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};
