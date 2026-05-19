import { useEffect, useRef } from "react";
import { startStreetsAmbience } from "../audio/music";
import { ensureAudio } from "../audio/setup";
import { useGameStore } from "../runtime/store";
import { COLOR, TYPE } from "../theme/tokens";
import { usePlayerProgress } from "./PlayerProgress";

const THREATS: ReadonlyArray<string> = ["RATS", "CLOSE QUARTERS", "FAMILY SHOTGUN"];

interface HowToBeat {
  glyph: string;
  label: string;
  body: string;
}

const HOW_TO_BEAT: ReadonlyArray<HowToBeat> = [
  { glyph: "◎", label: "AIM + FIRE", body: "Tap the stage. Reticle snaps and fires." },
  { glyph: "↻", label: "RELOAD", body: "Press R / bumper, or just keep firing." },
  { glyph: "◐", label: "HOLD = CHARGE", body: "Press and hold. Release for a stronger shot." },
  { glyph: "♥", label: "STAY ALIVE", body: "Five lives. Vermin past the line take one." },
];

/**
 * Player-journey gate: 15-second hook. Newspaper-clipping aesthetic —
 * dateline, headline, body, threat assessment chips, Begin CTA.
 */
export function Briefing() {
  const setPhase = useGameStore((s) => s.setPhase);
  const firstLaunchSeen = usePlayerProgress((s) => s.firstLaunchSeen);
  const markFirstLaunchSeen = usePlayerProgress((s) => s.markFirstLaunchSeen);
  const beginRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    beginRef.current?.focus();
  }, []);

  return (
    <div
      data-testid="briefing"
      data-phase-root="briefing"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: COLOR.bgAsphalt,
        color: COLOR.cream,
        fontFamily: TYPE.faceDisplay,
        padding:
          "calc(32px + env(safe-area-inset-top)) calc(24px + env(safe-area-inset-right)) " +
          "calc(32px + env(safe-area-inset-bottom)) calc(24px + env(safe-area-inset-left))",
      }}
    >
      <article
        style={{
          // Newsprint-like clipping: parchment fill, slight rotation,
          // hard drop-shadow. Max-width keeps the column tight (column
          // measure ≈ 520 px reads naturally).
          background: "#e8dcc4",
          color: "#1a1715",
          padding: "clamp(20px, 4vw, 36px) clamp(24px, 5vw, 44px)",
          maxWidth: 580,
          width: "100%",
          transform: "rotate(-0.6deg)",
          boxShadow: `8px 10px 0 ${COLOR.bgConcreteDark}, 16px 18px 28px ${COLOR.bgAsphalt}cc`,
          fontFamily: '"Special Elite", "Courier Prime", monospace',
          position: "relative",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            letterSpacing: "0.18em",
            color: "#5a4838",
            borderBottom: "1px solid #5a4838",
            paddingBottom: 6,
            marginBottom: 14,
          }}
        >
          <span>BED-STUY · BROOKLYN</span>
          <span>SUMMER 1979 · 10¢</span>
        </div>

        <h1
          style={{
            fontFamily: '"Big Shoulders Display", Impact, sans-serif',
            fontSize: "clamp(2rem, 6vw, 3.4rem)",
            margin: 0,
            color: "#1a1715",
            letterSpacing: "-0.01em",
            lineHeight: 0.92,
            textTransform: "uppercase",
          }}
        >
          BODEGA OVERRUN
        </h1>
        <h2
          style={{
            fontFamily: '"Big Shoulders Display", Impact, sans-serif',
            fontSize: "clamp(1rem, 2.4vw, 1.4rem)",
            margin: "6px 0 18px",
            color: "#7a2818",
            letterSpacing: "0.02em",
            fontStyle: "italic",
            fontWeight: 500,
          }}
        >
          Pawnbroker hands his nephew the family shotgun
        </h2>

        <p
          style={{
            fontSize: "clamp(0.95rem, 1.8vw, 1.05rem)",
            lineHeight: 1.55,
            margin: "0 0 16px",
          }}
        >
          The backroom of <strong>Mangione's News &amp; Tobacco</strong> has been moving since dawn.
          Eight, by the count of the kid sweeping up. The old man hands you the shotgun your father
          carried. <em>Tap anywhere to fire.</em>
        </p>

        <section
          aria-label="Threat assessment"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px dashed #7a2818",
          }}
        >
          <span
            style={{
              fontFamily: '"Big Shoulders Display", Impact, sans-serif',
              color: "#7a2818",
              fontSize: 11,
              letterSpacing: "0.2em",
              alignSelf: "center",
            }}
          >
            THREAT ASSESSMENT
          </span>
          {THREATS.map((t) => (
            <span
              key={t}
              style={{
                background: "#7a2818",
                color: "#e8dcc4",
                fontFamily: '"Big Shoulders Display", Impact, sans-serif',
                padding: "2px 10px",
                fontSize: 11,
                letterSpacing: "0.18em",
                borderRadius: 1,
              }}
            >
              {t}
            </span>
          ))}
        </section>
      </article>

      {firstLaunchSeen ? null : (
        <section
          data-testid="how-to-beat"
          aria-label="How to play"
          style={{
            marginTop: 22,
            width: "100%",
            maxWidth: 580,
            background: "rgba(13, 12, 10, 0.78)",
            border: `1px solid ${COLOR.sodium}`,
            color: COLOR.cream,
            padding: "10px 14px",
            fontFamily: TYPE.faceMono,
            fontSize: 12,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: 12,
          }}
        >
          {HOW_TO_BEAT.map((row) => (
            <div key={row.label}>
              <div
                style={{
                  fontFamily: TYPE.faceDisplay,
                  color: COLOR.sodium,
                  letterSpacing: 2,
                  fontSize: 11,
                  marginBottom: 4,
                }}
              >
                <span aria-hidden="true">{row.glyph}</span> {row.label}
              </div>
              <div style={{ lineHeight: 1.4, color: COLOR.creamDim }}>{row.body}</div>
            </div>
          ))}
        </section>
      )}

      <button
        type="button"
        ref={beginRef}
        onClick={async () => {
          if (!firstLaunchSeen) markFirstLaunchSeen();
          await ensureAudio();
          startStreetsAmbience();
          setPhase("mission-select");
        }}
        style={{
          marginTop: 28,
          background: COLOR.sodium,
          color: COLOR.bgAsphalt,
          border: "none",
          minWidth: 220,
          minHeight: 52,
          padding: "14px 32px",
          fontFamily: TYPE.faceMono,
          fontSize: 14,
          letterSpacing: "0.25em",
          cursor: "pointer",
          textTransform: "uppercase",
          fontWeight: 700,
          boxShadow: `0 0 18px ${COLOR.sodium}55`,
        }}
      >
        ▸ Begin
      </button>
    </div>
  );
}
