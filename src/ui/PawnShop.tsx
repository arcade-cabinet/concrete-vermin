import { useMemo } from "react";
import { MAX_LOADOUT_SLOTS, MOD_REGISTRY } from "../sim/archetypes/mods";
import { getMission } from "../sim/content/missions";
import { usePlayerProgress } from "./PlayerProgress";

const SODIUM = "#d4943a";
const PARCHMENT = "#e8dcc4";
const BRICK = "#7a2818";
const ASPHALT = "#1a1715";

export function PawnShop({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  const missionId = usePlayerProgress((s) => s.selectedMissionId);
  const cash = usePlayerProgress((s) => s.cash);
  const activeMods = usePlayerProgress((s) => s.activeMods);
  const toggleMod = usePlayerProgress((s) => s.toggleMod);

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
        background: "#0d0c0a",
        color: PARCHMENT,
        overflowY: "auto",
        padding: "calc(24px + env(safe-area-inset-top)) 24px 24px",
        fontFamily: "'Big Shoulders Display', sans-serif",
      }}
    >
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 style={{ color: SODIUM, margin: 0, letterSpacing: 2 }}>PAWN SHOP</h2>
        <div style={{ fontFamily: "'Special Elite', monospace", fontSize: 14 }}>
          <span style={{ color: SODIUM }}>CASH</span> ${cash.toLocaleString()}
          {"  "}
          <span style={{ color: SODIUM }}>SLOTS</span> {activeMods.length}/{MAX_LOADOUT_SLOTS}
        </div>
      </header>

      {mission ? (
        <p style={{ color: "#a89887", fontFamily: "'Special Elite', monospace", fontSize: 13 }}>
          For: <span style={{ color: PARCHMENT }}>{mission.id}</span>
          {"  ·  "}
          Weapon: <span style={{ color: PARCHMENT }}>{mission.weapon}</span>
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
                  background: equipped ? SODIUM : "transparent",
                  color: equipped ? ASPHALT : slotsFull ? "#5a544c" : PARCHMENT,
                  border: `1px solid ${equipped ? SODIUM : "#3a342c"}`,
                  padding: "8px 12px",
                  fontFamily: "'Special Elite', monospace",
                  fontSize: 13,
                  cursor: slotsFull ? "not-allowed" : "pointer",
                  textAlign: "left",
                }}
              >
                <span>
                  <strong style={{ color: equipped ? ASPHALT : SODIUM, letterSpacing: 1 }}>
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

      <footer style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: "transparent",
            color: SODIUM,
            border: `1px solid ${SODIUM}`,
            padding: "10px 18px",
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
            background: BRICK,
            color: PARCHMENT,
            border: "none",
            padding: "10px 22px",
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
