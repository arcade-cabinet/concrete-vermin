import { useMemo } from "react";
import { MAX_LOADOUT_SLOTS, MOD_REGISTRY } from "../sim/archetypes/mods";
import { getMission } from "../sim/content/missions";
import { useIsNarrow } from "./hooks/useViewport";
import { usePlayerProgress } from "./PlayerProgress";
import { COLOR, TYPE } from "../theme/tokens";

export function PawnShop({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  const missionId = usePlayerProgress((s) => s.selectedMissionId);
  const cash = usePlayerProgress((s) => s.cash);
  const activeMods = usePlayerProgress((s) => s.activeMods);
  const toggleMod = usePlayerProgress((s) => s.toggleMod);
  const narrow = useIsNarrow();

  const mission = useMemo(() => {
    try {
      return getMission(missionId);
    } catch {
      return null;
    }
  }, [missionId]);

  const compatibleMods = useMemo(() => {
    if (!mission) return [];
    const all = Array.from(MOD_REGISTRY.values());
    return all.filter(
      (m) => m.compatibleWith.length === 0 || m.compatibleWith.includes(mission.weapon),
    );
  }, [mission]);

  return (
    <div
      data-testid="pawn-shop"
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
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 style={{ color: COLOR.sodium, margin: 0, letterSpacing: 2 }}>PAWN SHOP</h2>
        <div style={{ fontFamily: TYPE.faceMono, fontSize: 14 }}>
          <span style={{ color: COLOR.sodium }}>CASH</span> ${cash.toLocaleString()}
          {"  "}
          <span style={{ color: COLOR.sodium }}>SLOTS</span> {activeMods.length}/{MAX_LOADOUT_SLOTS}
        </div>
      </header>

      {mission ? (
        <p style={{ color: COLOR.creamDim, fontFamily: TYPE.faceMono, fontSize: 13 }}>
          For: <span style={{ color: COLOR.cream }}>{mission.id}</span>
          {"  ·  "}
          Weapon: <span style={{ color: COLOR.cream }}>{mission.weapon}</span>
        </p>
      ) : null}

      <ul style={{ listStyle: "none", padding: 0, marginTop: 16, display: "grid", gap: 8 }}>
        {compatibleMods.map((mod) => {
          const equipped = activeMods.includes(mod.id);
          const slotsFull = !equipped && activeMods.length >= MAX_LOADOUT_SLOTS;
          return (
            <li key={mod.id}>
              <button
                type="button"
                onClick={() => {
                  if (slotsFull) return;
                  toggleMod(mod.id);
                }}
                disabled={slotsFull}
                data-testid={`mod-${mod.id}`}
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: equipped ? COLOR.sodium : "transparent",
                  color: equipped ? COLOR.bgConcreteDark : slotsFull ? COLOR.mute : COLOR.cream,
                  border: `1px solid ${equipped ? COLOR.sodium : COLOR.borderMute}`,
                  // Touch-target floor.
                  minHeight: 44,
                  padding: "10px 12px",
                  fontFamily: TYPE.faceMono,
                  fontSize: 13,
                  cursor: slotsFull ? "not-allowed" : "pointer",
                  textAlign: "left",
                }}
              >
                <span>
                  <strong
                    style={{
                      color: equipped ? COLOR.bgConcreteDark : COLOR.sodium,
                      letterSpacing: 1,
                    }}
                  >
                    [{mod.slot}]
                  </strong>{" "}
                  {mod.name}
                </span>
                <span>${mod.cost}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <footer
        style={{
          marginTop: 24,
          display: "flex",
          flexDirection: narrow ? "column" : "row",
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            background: "transparent",
            color: COLOR.sodium,
            border: `1px solid ${COLOR.sodium}`,
            minWidth: 44,
            minHeight: 44,
            padding: "12px 18px",
            fontFamily: "inherit",
            letterSpacing: 1,
            cursor: "pointer",
          }}
        >
          ← MISSION SELECT
        </button>
        <button
          type="button"
          onClick={onContinue}
          style={{
            background: COLOR.brick,
            color: COLOR.cream,
            border: "none",
            minWidth: 44,
            minHeight: 44,
            padding: "12px 22px",
            fontFamily: "inherit",
            letterSpacing: 1,
            cursor: "pointer",
          }}
        >
          DEPLOY →
        </button>
      </footer>
    </div>
  );
}
