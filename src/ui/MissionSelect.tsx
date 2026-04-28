import { useGameStore } from "../runtime/store";
import { listMissionsByAct, MISSIONS } from "../sim/content/missions";
import { ACT_IDS, type ActId } from "../sim/factories/mission";
import { useArrowGridNav } from "./hooks/useArrowGridNav";
import { useIsNarrow } from "./hooks/useViewport";
import { isMissionUnlocked, usePlayerProgress } from "./PlayerProgress";
import { COLOR, TYPE } from "../theme/tokens";

const ACT_LABELS: Record<ActId, string> = {
  streets: "ACT I — STREETS",
  underworld: "ACT II — UNDERWORLD",
  above: "ACT III — ABOVE",
};

// 1979 NYC subway-line color metaphor — each act gets a line color
// reminiscent of the IRT/BMT bullets. Sodium-warm, not cyberpunk neon.
const ACT_LINE_COLOR: Record<ActId, string> = {
  streets: COLOR.sodium,
  underworld: COLOR.eliteGreen,
  above: COLOR.flashSodiumLight,
};

const ACT_BULLET_LABEL: Record<ActId, string> = {
  streets: "S",
  underworld: "U",
  above: "A",
};

interface StopProps {
  missionId: string;
  index: number;
  total: number;
  title: string;
  unlocked: boolean;
  completed: boolean;
  selected: boolean;
  isBoss: boolean;
  lineColor: string;
  onSelect: () => void;
}

function MissionStop({
  missionId,
  index,
  total,
  title,
  unlocked,
  completed,
  selected,
  isBoss,
  lineColor,
  onSelect,
}: StopProps) {
  const dotColor = completed ? lineColor : unlocked ? COLOR.cream : COLOR.mute;
  const lineMute = COLOR.borderMute;
  return (
    <button
      type="button"
      onClick={unlocked ? onSelect : undefined}
      disabled={!unlocked}
      data-testid={`mission-tile-${missionId}`}
      data-arrow-nav-item="mission"
      aria-pressed={selected}
      aria-label={`${title}${completed ? ", completed" : unlocked ? "" : ", locked"}${isBoss ? ", boss" : ""}`}
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "32px 1fr",
        alignItems: "center",
        gap: 12,
        background: selected ? `${lineColor}22` : "transparent",
        color: unlocked ? COLOR.cream : COLOR.mute,
        border: `1px solid ${selected ? lineColor : "transparent"}`,
        padding: "10px 14px 10px 8px",
        textAlign: "left",
        fontFamily: TYPE.faceMono,
        fontSize: 13,
        cursor: unlocked ? "pointer" : "not-allowed",
        minHeight: 44,
        minWidth: 240,
      }}
    >
      {/* Subway-line stem: vertical bar from previous to next stop. */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 22,
          top: index === 0 ? "50%" : 0,
          bottom: index === total - 1 ? "50%" : 0,
          width: 2,
          background: lineColor,
          opacity: unlocked ? 1 : 0.3,
        }}
      />
      {/* Stop bullet — filled when completed, ringed when current/unlocked, hollow + locked icon otherwise. */}
      <span
        aria-hidden="true"
        style={{
          position: "relative",
          width: isBoss ? 22 : 16,
          height: isBoss ? 22 : 16,
          borderRadius: "50%",
          background: completed ? lineColor : selected ? `${lineColor}88` : COLOR.bgAsphalt,
          border: `2px solid ${unlocked ? lineColor : lineMute}`,
          justifySelf: "center",
          boxShadow: selected ? `0 0 12px ${lineColor}99` : "none",
          // Pulse on the current selected stop.
          animation: selected ? "cv-stop-pulse 1.4s ease-in-out infinite" : undefined,
        }}
      />
      <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: dotColor, letterSpacing: "0.05em", fontWeight: 600 }}>
            {!unlocked ? "🔒 " : completed ? "✓ " : ""}
            {title}
          </span>
          {isBoss ? (
            <span
              style={{
                background: COLOR.brick,
                color: COLOR.cream,
                fontSize: 9,
                letterSpacing: "0.2em",
                padding: "1px 6px",
                fontFamily: TYPE.faceDisplay,
              }}
            >
              BOSS
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

export function MissionSelect({ onPickMission }: { onPickMission: (id: string) => void }) {
  const completed = usePlayerProgress((s) => s.completedMissionIds);
  const selected = usePlayerProgress((s) => s.selectedMissionId);
  const select = usePlayerProgress((s) => s.selectMission);
  const cash = usePlayerProgress((s) => s.cash);
  const setPhase = useGameStore((s) => s.setPhase);
  const narrow = useIsNarrow();
  const gridRef = useArrowGridNav<HTMLDivElement>();

  return (
    <div
      data-testid="mission-select"
      data-phase-root="mission-select"
      ref={gridRef}
      style={{
        position: "fixed",
        inset: 0,
        background: COLOR.bgAsphalt,
        color: COLOR.cream,
        overflowY: "auto",
        padding:
          "calc(24px + env(safe-area-inset-top)) calc(24px + env(safe-area-inset-right)) " +
          "calc(24px + env(safe-area-inset-bottom)) calc(24px + env(safe-area-inset-left))",
        fontFamily: TYPE.faceDisplay,
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ color: COLOR.sodium, margin: 0, letterSpacing: "0.2em", fontSize: "1.6rem" }}>
            SELECT LINE · STOP
          </h2>
          <p style={{ color: COLOR.creamDim, fontFamily: TYPE.faceMono, fontSize: 11, margin: "4px 0 0", letterSpacing: "0.15em" }}>
            METRO TRANSIT AUTHORITY · 1979
          </p>
        </div>
        <div style={{ fontFamily: TYPE.faceMono, fontSize: 14 }}>
          <span style={{ color: COLOR.sodium }}>CASH</span>{" "}
          <span style={{ color: COLOR.cream }}>${cash.toLocaleString()}</span>
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: narrow ? "1fr" : "repeat(3, 1fr)",
          gap: 24,
          marginTop: 24,
        }}
      >
        {ACT_IDS.map((act) => {
          const lineColor = ACT_LINE_COLOR[act];
          const stops = listMissionsByAct(act);
          return (
            <section key={act}>
              <h3
                style={{
                  color: lineColor,
                  letterSpacing: "0.2em",
                  fontSize: 13,
                  margin: "0 0 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: TYPE.faceMono,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: lineColor,
                    color: COLOR.bgAsphalt,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontFamily: TYPE.faceDisplay,
                    fontSize: 13,
                    boxShadow: `0 0 10px ${lineColor}55`,
                  }}
                >
                  {ACT_BULLET_LABEL[act]}
                </span>
                {ACT_LABELS[act]}
              </h3>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {stops.map((m, i) => {
                  const isBoss = m.encounters.some((e) =>
                    e.spawns.some((s) => s.pattern === "boss-scripted"),
                  );
                  return (
                    <MissionStop
                      key={m.id}
                      missionId={m.id}
                      index={i}
                      total={stops.length}
                      title={m.id
                        .replace(/^[a-z]+-\d+-/, "")
                        .replace(/-/g, " ")
                        .toUpperCase()}
                      unlocked={isMissionUnlocked(m.id, completed)}
                      completed={completed.includes(m.id)}
                      selected={selected === m.id}
                      isBoss={isBoss}
                      lineColor={lineColor}
                      onSelect={() => select(m.id)}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <style>{`
        @keyframes cv-stop-pulse {
          0%, 100% { box-shadow: 0 0 8px currentColor; }
          50% { box-shadow: 0 0 18px currentColor; }
        }
      `}</style>

      <footer
        style={{
          marginTop: 32,
          display: "flex",
          flexDirection: narrow ? "column" : "row",
          gap: 12,
          paddingTop: 16,
          borderTop: `1px dashed ${COLOR.borderMute}`,
        }}
      >
        <button
          type="button"
          onClick={() => setPhase("main-menu")}
          style={{
            background: "transparent",
            color: COLOR.sodium,
            border: `1px solid ${COLOR.sodium}`,
            minWidth: 44,
            minHeight: 44,
            padding: "12px 18px",
            fontFamily: TYPE.faceMono,
            letterSpacing: "0.2em",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          ← MAIN MENU
        </button>
        <button
          type="button"
          onClick={() => onPickMission(selected)}
          disabled={!isMissionUnlocked(selected, completed)}
          style={{
            background: COLOR.sodium,
            color: COLOR.bgConcreteDark,
            border: "none",
            minWidth: 44,
            minHeight: 44,
            padding: "12px 22px",
            fontFamily: TYPE.faceMono,
            letterSpacing: "0.25em",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            opacity: isMissionUnlocked(selected, completed) ? 1 : 0.5,
            boxShadow: isMissionUnlocked(selected, completed) ? `0 0 14px ${COLOR.sodium}66` : "none",
          }}
        >
          DEPLOY · {MISSIONS.find((m) => m.id === selected)?.weapon.toUpperCase()}
        </button>
      </footer>
    </div>
  );
}
