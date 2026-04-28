import { useGameStore } from "../runtime/store";
import { listMissionsByAct, MISSIONS } from "../sim/content/missions";
import { ACT_IDS, type ActId } from "../sim/factories/mission";
import { isMissionUnlocked, usePlayerProgress } from "./PlayerProgress";
import { COLOR, TYPE } from "../theme/tokens";

const ACT_LABELS: Record<ActId, string> = {
  streets: "ACT I — STREETS",
  underworld: "ACT II — UNDERWORLD",
  above: "ACT III — ABOVE",
};

function MissionTile({
  missionId,
  title,
  unlocked,
  completed,
  selected,
  onSelect,
}: {
  missionId: string;
  title: string;
  unlocked: boolean;
  completed: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={unlocked ? onSelect : undefined}
      disabled={!unlocked}
      data-testid={`mission-tile-${missionId}`}
      style={{
        background: selected ? COLOR.sodium : "transparent",
        color: selected ? COLOR.bgConcreteDark : unlocked ? COLOR.cream : COLOR.mute,
        border: `1px solid ${unlocked ? COLOR.sodium : COLOR.borderMute}`,
        padding: "10px 14px",
        textAlign: "left",
        fontFamily: TYPE.faceMono,
        fontSize: 13,
        cursor: unlocked ? "pointer" : "not-allowed",
        minWidth: 220,
      }}
    >
      <div style={{ letterSpacing: 1 }}>
        {completed ? "✓ " : unlocked ? "" : "🔒 "}
        {title}
      </div>
    </button>
  );
}

export function MissionSelect({ onPickMission }: { onPickMission: (id: string) => void }) {
  const completed = usePlayerProgress((s) => s.completedMissionIds);
  const selected = usePlayerProgress((s) => s.selectedMissionId);
  const select = usePlayerProgress((s) => s.selectMission);
  const cash = usePlayerProgress((s) => s.cash);
  const setPhase = useGameStore((s) => s.setPhase);

  return (
    <div
      data-testid="mission-select"
      style={{
        position: "fixed",
        inset: 0,
        background: COLOR.bgAsphalt,
        color: COLOR.cream,
        overflowY: "auto",
        padding: "calc(24px + env(safe-area-inset-top)) 24px 24px",
        fontFamily: TYPE.faceDisplay,
      }}
    >
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 style={{ color: COLOR.sodium, margin: 0, letterSpacing: 2 }}>SELECT MISSION</h2>
        <div style={{ fontFamily: TYPE.faceMono, fontSize: 14 }}>
          <span style={{ color: COLOR.sodium }}>CASH</span> ${cash.toLocaleString()}
        </div>
      </header>

      {ACT_IDS.map((act) => (
        <section key={act} style={{ marginTop: 24 }}>
          <h3 style={{ color: COLOR.brick, letterSpacing: 1, fontSize: 16, margin: "8px 0" }}>
            {ACT_LABELS[act]}
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {listMissionsByAct(act).map((m) => (
              <MissionTile
                key={m.id}
                missionId={m.id}
                title={m.id
                  .replace(/^[a-z]+-\d+-/, "")
                  .replace(/-/g, " ")
                  .toUpperCase()}
                unlocked={isMissionUnlocked(m.id, completed)}
                completed={completed.includes(m.id)}
                selected={selected === m.id}
                onSelect={() => select(m.id)}
              />
            ))}
          </div>
        </section>
      ))}

      <footer style={{ marginTop: 32, display: "flex", gap: 12 }}>
        <button
          type="button"
          onClick={() => setPhase("briefing")}
          style={{
            background: "transparent",
            color: COLOR.sodium,
            border: `1px solid ${COLOR.sodium}`,
            padding: "10px 18px",
            fontFamily: "inherit",
            letterSpacing: 1,
            cursor: "pointer",
          }}
        >
          ← BACK
        </button>
        <button
          type="button"
          onClick={() => onPickMission(selected)}
          disabled={!isMissionUnlocked(selected, completed)}
          style={{
            background: COLOR.sodium,
            color: COLOR.bgConcreteDark,
            border: "none",
            padding: "10px 22px",
            fontFamily: "inherit",
            letterSpacing: 1,
            cursor: "pointer",
            opacity: isMissionUnlocked(selected, completed) ? 1 : 0.5,
          }}
        >
          DEPLOY · {MISSIONS.find((m) => m.id === selected)?.weapon.toUpperCase()}
        </button>
      </footer>
    </div>
  );
}
