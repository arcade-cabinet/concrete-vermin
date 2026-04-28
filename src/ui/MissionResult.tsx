import { useEffect, useRef } from "react";
import { useGameStore } from "../runtime/store";
import { useIsNarrow } from "./hooks/useViewport";
import { usePlayerProgress } from "./PlayerProgress";
import { COLOR, TYPE } from "../theme/tokens";

const CASH_PER_KILL = 12;

/**
 * Tabloid front-page result screen. Win → THE DAILY VERMIN headline,
 * grade as masthead bullet, score / kills / cash as columns, callouts
 * as bylines. Loss → "WIPED OUT" extra edition.
 */
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

  const ctaRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ctaRef.current?.focus();
  }, []);

  // Quick grade calc from score band — same five-tier ladder used elsewhere.
  const grade = won ? gradeFromScore(score.total) : "F";
  const cashEarned = won ? killCount * CASH_PER_KILL : 0;
  const callouts = won ? winCallouts(grade, killCount) : lossCallouts(killCount);

  return (
    <div
      data-testid="mission-result"
      data-phase-root="mission-result"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(13, 12, 10, 0.92)",
        color: COLOR.cream,
        fontFamily: TYPE.faceDisplay,
        padding:
          "calc(32px + env(safe-area-inset-top)) calc(24px + env(safe-area-inset-right)) " +
          "calc(32px + env(safe-area-inset-bottom)) calc(24px + env(safe-area-inset-left))",
        overflowY: "auto",
      }}
    >
      <article
        style={{
          background: "#e8dcc4",
          color: "#1a1715",
          padding: "clamp(20px, 4vw, 36px) clamp(24px, 5vw, 44px)",
          maxWidth: 720,
          width: "100%",
          transform: "rotate(0.4deg)",
          boxShadow: `8px 10px 0 ${COLOR.bgConcreteDark}, 16px 18px 28px ${COLOR.bgAsphalt}cc`,
          fontFamily: '"Special Elite", "Courier Prime", monospace',
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
            borderBottom: `2px solid ${won ? "#7a2818" : "#1a1715"}`,
            paddingBottom: 6,
            marginBottom: 12,
            textTransform: "uppercase",
          }}
        >
          <span>The Daily Vermin · {won ? "EXTRA EDITION" : "DEATH NOTICES"}</span>
          <span>VOL. 1 · NO. {missionIndexFromId(missionId)}</span>
        </div>

        <h1
          // Heading text matches the e2e selector — won emits "Cleared", lost emits "Wiped Out".
          style={{
            fontFamily: '"Big Shoulders Display", Impact, sans-serif',
            fontSize: "clamp(2.6rem, 9vw, 5rem)",
            margin: 0,
            color: won ? "#1a1715" : "#7a2818",
            letterSpacing: "-0.01em",
            lineHeight: 0.92,
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          {won ? "Cleared" : "Wiped Out"}
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
            textAlign: "center",
          }}
        >
          {won
            ? `Local hero earns ${grade} grade in ${humanMissionId(missionId)}`
            : `${humanMissionId(missionId)} ends in tragedy`}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: narrow ? "1fr" : "repeat(3, 1fr)",
            gap: 16,
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid #5a4838",
            borderBottom: "1px solid #5a4838",
            paddingBottom: 12,
          }}
        >
          <Stat label="Score" value={score.total.toLocaleString()} />
          <Stat label="Vermin" value={String(killCount)} />
          <Stat label="Earned" value={`$${cashEarned}`} />
        </div>

        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "16px 0 0",
            display: "grid",
            gap: 8,
            fontSize: 13,
          }}
        >
          {callouts.map((c) => (
            <li
              key={c}
              style={{
                paddingLeft: 16,
                position: "relative",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: 0,
                  color: "#7a2818",
                  fontWeight: 800,
                }}
              >
                ▸
              </span>
              {c}
            </li>
          ))}
        </ul>

        <div style={{ marginTop: 18, fontSize: 11, color: "#5a4838", textAlign: "right", letterSpacing: "0.1em" }}>
          BY THE PAWNBROKER, STAFF
        </div>
      </article>

      <div
        style={{
          position: "fixed",
          bottom: "calc(20px + env(safe-area-inset-bottom))",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: narrow ? "column" : "row",
          gap: 12,
        }}
      >
        <button
          type="button"
          ref={ctaRef}
          onClick={() => setPhase("mission-select")}
          style={{
            background: COLOR.sodium,
            color: COLOR.bgAsphalt,
            border: "none",
            minWidth: 220,
            minHeight: 52,
            padding: "14px 28px",
            fontFamily: TYPE.faceMono,
            fontSize: 14,
            letterSpacing: "0.25em",
            cursor: "pointer",
            textTransform: "uppercase",
            fontWeight: 700,
            boxShadow: `0 0 18px ${COLOR.sodium}55`,
          }}
        >
          ▸ Next Mission
        </button>
        <button
          type="button"
          onClick={() => setPhase("main-menu")}
          style={{
            background: "transparent",
            color: COLOR.sodium,
            border: `1px solid ${COLOR.sodium}`,
            minWidth: 180,
            minHeight: 52,
            padding: "14px 24px",
            fontFamily: TYPE.faceMono,
            fontSize: 13,
            letterSpacing: "0.2em",
            cursor: "pointer",
          }}
        >
          MAIN MENU
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontFamily: '"Big Shoulders Display", Impact, sans-serif',
          fontSize: 10,
          letterSpacing: "0.3em",
          color: "#5a4838",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: '"Big Shoulders Display", Impact, sans-serif',
          fontSize: "clamp(1.5rem, 4vw, 2.4rem)",
          color: "#1a1715",
          fontWeight: 800,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function gradeFromScore(score: number): "S+" | "S" | "A" | "B" | "C" | "D" {
  if (score >= 5000) return "S+";
  if (score >= 3000) return "S";
  if (score >= 1500) return "A";
  if (score >= 800) return "B";
  if (score >= 300) return "C";
  return "D";
}

function winCallouts(grade: string, kills: number): ReadonlyArray<string> {
  const out: string[] = [];
  if (grade === "S+" || grade === "S") out.push("Witnesses describe a 'rhythmic, almost musical' clearance.");
  if (kills >= 14) out.push("Pawnbroker raises a glass: 'I knew the kid had it.'");
  if (kills >= 6) out.push("Health Department grateful for the assist.");
  if (out.length === 0) out.push("The block sleeps a little easier tonight.");
  return out;
}

function lossCallouts(kills: number): ReadonlyArray<string> {
  if (kills >= 5) return ["Took a few of them with you. Pawnbroker says: 'It happens.'"];
  return ["Block remains overrun. Pawnbroker says nothing. Fixes a coffee."];
}

function humanMissionId(id: string | null | undefined): string {
  if (!id) return "the field";
  return id
    .replace(/^[a-z]+-\d+-/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function missionIndexFromId(id: string | null | undefined): string {
  if (!id) return "—";
  const m = id.match(/-(\d+)-/);
  return m?.[1] ?? "—";
}
