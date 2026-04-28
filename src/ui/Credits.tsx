import { useEffect, useRef } from "react";
import { useGameStore } from "../runtime/store";
import { COLOR, TYPE } from "../theme/tokens";

interface CreditEntry {
  role: string;
  who: string;
  /** Optional flavor — short pulpy aside in the Pawnbroker's voice. */
  bark?: string;
}

const CREDITS: ReadonlyArray<CreditEntry> = [
  { role: "DESIGN · CODE · SCORE", who: "Bogaty / Anthropic" },
  { role: "PAWNBROKER", who: "Sal Mangione" },
  { role: "VERMIN BIOLOGY", who: "Dr. R. K. Sterling, NYU '78" },
  { role: "GROUND-FLOOR LIGHTING", who: "Sodium Vapor Local 47" },
  { role: "BRICK CONSULTING", who: "Bedford-Stuyvesant Masons Union" },
  { role: "FIELD AUDIO", who: "BMT Subway, after midnight" },
  { role: "DEDICATED TO", who: "the kid this story was first told to in 2026" },
  { role: "WITH GRATITUDE TO", who: "anyone who has ever stomped a roach" },
];

const RUMORS: ReadonlyArray<string> = [
  "They say the river mutant remembers your face.",
  "The Pawnbroker's shop has been on this block since 1923. Nobody can prove it changed hands.",
  "The pigeon king drops his crown sometimes. Pick it up. Don't pick it up.",
  "If you hear the sodium lamps hum a fifth lower than usual, leave.",
];

/**
 * Credits screen — scrolling roll with role attribution + lore Easter
 * eggs in the Pawnbroker's voice. Esc / Back returns to MainMenu.
 */
export function Credits() {
  const setPhase = useGameStore((s) => s.setPhase);
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion);
  const backRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    backRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPhase("main-menu");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPhase]);

  return (
    <div
      data-testid="credits"
      data-phase-root="credits"
      role="document"
      aria-label="Credits"
      style={{
        position: "fixed",
        inset: 0,
        background: COLOR.bgAsphalt,
        color: COLOR.cream,
        fontFamily: TYPE.faceDisplay,
        overflowY: "auto",
        padding:
          "calc(48px + env(safe-area-inset-top)) calc(24px + env(safe-area-inset-right)) " +
          "calc(80px + env(safe-area-inset-bottom)) calc(24px + env(safe-area-inset-left))",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: 32 }}>
        <h2 style={{ color: COLOR.sodium, letterSpacing: 4, margin: 0, fontSize: "1.6rem" }}>
          CREDITS
        </h2>
        <p style={{ color: COLOR.creamDim, fontFamily: TYPE.faceMono, fontSize: 12, marginTop: 6 }}>
          A pulpy 1979 NYC rail-shooter
        </p>
      </header>

      <div
        style={{
          maxWidth: 540,
          margin: "0 auto",
          fontFamily: TYPE.faceMono,
          animation: reducedMotion ? undefined : "cv-credits-scroll 60s linear infinite",
        }}
      >
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 18 }}>
          {CREDITS.map((c) => (
            <li key={c.role} style={{ textAlign: "center" }}>
              <div
                style={{
                  color: COLOR.sodium,
                  fontSize: 11,
                  letterSpacing: "0.25em",
                  marginBottom: 4,
                }}
              >
                {c.role}
              </div>
              <div style={{ color: COLOR.cream, fontSize: 14 }}>{c.who}</div>
              {c.bark ? (
                <div style={{ color: COLOR.creamDim, fontSize: 11, marginTop: 2 }}>{c.bark}</div>
              ) : null}
            </li>
          ))}
        </ul>

        <div
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: `1px dashed ${COLOR.borderMute}`,
          }}
        >
          <h3
            style={{
              color: COLOR.brickAccessible,
              letterSpacing: "0.3em",
              fontSize: 12,
              margin: 0,
              textAlign: "center",
            }}
          >
            RUMOR MILL
          </h3>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              marginTop: 16,
              display: "grid",
              gap: 14,
              fontSize: 12,
              color: COLOR.creamDim,
              fontStyle: "italic",
              textAlign: "center",
            }}
          >
            {RUMORS.map((r) => (
              <li key={r}>“{r}”</li>
            ))}
          </ul>
        </div>
      </div>

      <style>{`
        @keyframes cv-credits-scroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-30%); }
        }
      `}</style>

      <button
        type="button"
        ref={backRef}
        onClick={() => setPhase("main-menu")}
        style={{
          position: "fixed",
          bottom: "calc(20px + env(safe-area-inset-bottom))",
          left: "50%",
          transform: "translateX(-50%)",
          background: "transparent",
          color: COLOR.sodium,
          border: `1px solid ${COLOR.sodium}`,
          minWidth: 160,
          minHeight: 44,
          padding: "10px 20px",
          fontFamily: TYPE.faceMono,
          fontSize: 13,
          letterSpacing: "0.2em",
          cursor: "pointer",
        }}
      >
        ← BACK
      </button>
    </div>
  );
}
