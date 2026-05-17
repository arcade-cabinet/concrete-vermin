import { useMemo, useState } from "react";
import { MAX_LOADOUT_SLOTS, MOD_REGISTRY } from "../sim/archetypes/mods";
import { getMission } from "../sim/content/missions";
import { useArrowGridNav } from "./hooks/useArrowGridNav";
import { useIsNarrow } from "./hooks/useViewport";
import { usePlayerProgress } from "./PlayerProgress";
import { randomBark } from "./copy/pawnbroker";
import { COLOR, TYPE } from "../theme/tokens";

/**
 * Pawn shop redesign — wood counter aesthetic. Pawnbroker portrait
 * (procedural SVG) on the left with a rotating bark, mod cards as
 * price-tagged items on the right.
 */
export function PawnShop({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  const missionId = usePlayerProgress((s) => s.selectedMissionId);
  const cash = usePlayerProgress((s) => s.cash);
  const activeMods = usePlayerProgress((s) => s.activeMods);
  const toggleMod = usePlayerProgress((s) => s.toggleMod);
  const narrow = useIsNarrow();
  const gridRef = useArrowGridNav<HTMLDivElement>();
  // Bark stable per shop visit so it doesn't churn on re-render.
  const [bark] = useState(() => randomBark());

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
      data-phase-root="pawn-shop"
      ref={gridRef}
      style={{
        position: "fixed",
        inset: 0,
        background: COLOR.bgAsphalt,
        color: COLOR.cream,
        overflowY: "auto",
        padding:
          "calc(20px + env(safe-area-inset-top)) calc(20px + env(safe-area-inset-right)) " +
          "calc(20px + env(safe-area-inset-bottom)) calc(20px + env(safe-area-inset-left))",
        fontFamily: TYPE.faceDisplay,
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <h2
            style={{ color: COLOR.sodium, margin: 0, letterSpacing: "0.2em", fontSize: "1.5rem" }}
          >
            MANGIONE'S NEWS &amp; TOBACCO
          </h2>
          <p
            style={{
              color: COLOR.creamDim,
              fontFamily: TYPE.faceMono,
              fontSize: 11,
              margin: "4px 0 0",
              letterSpacing: "0.15em",
            }}
          >
            EST. 1923 · DISCRETION ASSURED
          </p>
        </div>
        <div style={{ fontFamily: TYPE.faceMono, fontSize: 14 }}>
          <span style={{ color: COLOR.sodium }}>CASH</span>{" "}
          <span style={{ color: COLOR.cream }}>${cash.toLocaleString()}</span>
          {"   "}
          <span style={{ color: COLOR.sodium }}>SLOTS</span>{" "}
          <span style={{ color: COLOR.cream }}>
            {activeMods.length}/{MAX_LOADOUT_SLOTS}
          </span>
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: narrow ? "1fr" : "240px 1fr",
          gap: 24,
          marginTop: 20,
        }}
      >
        <aside
          style={{
            background:
              "repeating-linear-gradient(115deg, #2a1810 0, #2a1810 6px, #221208 6px, #221208 12px)",
            border: `1px solid ${COLOR.borderMute}`,
            padding: 16,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <PawnbrokerPortrait />
          <div
            style={{
              fontFamily: TYPE.faceMono,
              color: COLOR.sodium,
              letterSpacing: "0.2em",
              fontSize: 11,
            }}
          >
            SAL MANGIONE
          </div>
          <blockquote
            style={{
              fontFamily: '"Special Elite", "Courier Prime", monospace',
              color: COLOR.cream,
              background: "#1a1715",
              padding: "10px 12px",
              fontSize: 13,
              fontStyle: "italic",
              margin: 0,
              borderLeft: `3px solid ${COLOR.sodium}`,
              lineHeight: 1.5,
              textAlign: "left",
            }}
          >
            “{bark}”
          </blockquote>
          {mission ? (
            <div
              style={{
                fontFamily: TYPE.faceMono,
                fontSize: 11,
                color: COLOR.creamDim,
                background: COLOR.bgAsphalt,
                border: `1px dashed ${COLOR.borderMute}`,
                padding: 10,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              <div style={{ color: COLOR.sodium, letterSpacing: "0.18em", marginBottom: 4 }}>
                JOB SLIP
              </div>
              <div>
                For: <span style={{ color: COLOR.cream }}>{mission.id}</span>
              </div>
              <div>
                Weapon: <span style={{ color: COLOR.cream }}>{mission.weapon}</span>
              </div>
              <div>
                Lives: <span style={{ color: COLOR.cream }}>{mission.livesAllowance}</span>
              </div>
            </div>
          ) : null}
        </aside>

        <ul
          aria-label="Available weapon mods"
          style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}
        >
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
                  data-arrow-nav-item="mod"
                  aria-pressed={equipped}
                  aria-label={`${mod.name}, ${mod.slot} slot, ${mod.cost} cash${equipped ? ", equipped" : ""}${slotsFull ? ", no slot available" : ""}`}
                  style={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    alignItems: "center",
                    gap: 12,
                    background: equipped
                      ? `linear-gradient(180deg, ${COLOR.sodium} 0%, ${COLOR.sodiumCool} 100%)`
                      : COLOR.bgConcreteDark,
                    color: equipped ? COLOR.bgConcreteDark : slotsFull ? COLOR.mute : COLOR.cream,
                    border: `1px solid ${equipped ? COLOR.sodium : COLOR.borderMute}`,
                    minHeight: 56,
                    padding: "12px 16px",
                    fontFamily: TYPE.faceMono,
                    fontSize: 13,
                    cursor: slotsFull ? "not-allowed" : "pointer",
                    textAlign: "left",
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      width: 36,
                      height: 36,
                      background: equipped ? COLOR.bgConcreteDark : COLOR.sodium,
                      color: equipped ? COLOR.sodium : COLOR.bgConcreteDark,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: TYPE.faceDisplay,
                      fontSize: 11,
                      letterSpacing: "0.15em",
                      fontWeight: 800,
                      transform: "rotate(-4deg)",
                      flexShrink: 0,
                    }}
                  >
                    {mod.slot.toUpperCase().slice(0, 4)}
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                    <strong
                      style={{
                        color: equipped ? COLOR.bgConcreteDark : COLOR.cream,
                        fontWeight: 700,
                      }}
                    >
                      {mod.name}
                    </strong>
                    <span
                      style={{
                        fontSize: 11,
                        color: equipped ? COLOR.bgConcreteDark : COLOR.creamDim,
                        letterSpacing: "0.05em",
                      }}
                    >
                      {modBlurb(mod)}
                    </span>
                  </span>
                  <span
                    style={{
                      background: equipped ? COLOR.bgConcreteDark : COLOR.brick,
                      color: equipped ? COLOR.sodium : COLOR.cream,
                      fontFamily: TYPE.faceDisplay,
                      fontSize: 14,
                      letterSpacing: "0.05em",
                      padding: "6px 12px",
                      fontWeight: 800,
                      transform: "rotate(2deg)",
                    }}
                  >
                    ${mod.cost}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <footer
        style={{
          marginTop: 24,
          display: "flex",
          flexDirection: narrow ? "column" : "row",
          gap: 12,
          paddingTop: 16,
          borderTop: `1px dashed ${COLOR.borderMute}`,
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
            fontFamily: TYPE.faceMono,
            letterSpacing: "0.2em",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          ← STOPS
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
            fontFamily: TYPE.faceMono,
            letterSpacing: "0.25em",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: `0 0 14px ${COLOR.brick}66`,
          }}
        >
          DEPLOY →
        </button>
      </footer>
    </div>
  );
}

function modBlurb(mod: {
  slot: string;
  damageMod?: number | undefined;
  spreadMul?: number | undefined;
  magSizeAdd?: number | undefined;
  reloadMul?: number | undefined;
  rangeMul?: number | undefined;
  headshotBonusAdd?: number | undefined;
  critChanceAdd?: number | undefined;
  chargeTimeMul?: number | undefined;
  chargeShellsDelta?: number | undefined;
  chargeEffectMul?: number | undefined;
  chargeArcCount?: number | undefined;
}) {
  const parts: string[] = [];
  if (mod.damageMod && mod.damageMod !== 1)
    parts.push(`+${Math.round((mod.damageMod - 1) * 100)}% DMG`);
  if (mod.spreadMul && mod.spreadMul < 1) parts.push("tighter spread");
  if (mod.spreadMul && mod.spreadMul > 1) parts.push("wider spread");
  if (mod.magSizeAdd && mod.magSizeAdd > 0) parts.push(`+${mod.magSizeAdd} mag`);
  if (mod.reloadMul && mod.reloadMul < 1)
    parts.push(`-${Math.round((1 - mod.reloadMul) * 100)}% reload`);
  if (mod.reloadMul && mod.reloadMul > 1)
    parts.push(`+${Math.round((mod.reloadMul - 1) * 100)}% reload`);
  if (mod.rangeMul && mod.rangeMul !== 1)
    parts.push(`${mod.rangeMul > 1 ? "+" : "−"}${Math.round(Math.abs(mod.rangeMul - 1) * 100)}% range`);
  if (mod.headshotBonusAdd && mod.headshotBonusAdd > 0)
    parts.push(`+${Math.round(mod.headshotBonusAdd * 100)}% headshot`);
  if (mod.critChanceAdd && mod.critChanceAdd > 0)
    parts.push(`+${Math.round(mod.critChanceAdd * 100)}% crit`);
  if (mod.chargeTimeMul && mod.chargeTimeMul < 1)
    parts.push(`-${Math.round((1 - mod.chargeTimeMul) * 100)}% charge time`);
  if (mod.chargeTimeMul && mod.chargeTimeMul > 1)
    parts.push(`+${Math.round((mod.chargeTimeMul - 1) * 100)}% charge time`);
  if (mod.chargeShellsDelta && mod.chargeShellsDelta !== 0)
    parts.push(`${mod.chargeShellsDelta > 0 ? "+" : ""}${mod.chargeShellsDelta} charge cost`);
  if (mod.chargeEffectMul && mod.chargeEffectMul !== 1)
    parts.push(`+${Math.round((mod.chargeEffectMul - 1) * 100)}% charge effect`);
  if (mod.chargeArcCount) parts.push(`${mod.chargeArcCount} arcs`);
  return parts.length > 0 ? parts.join(" · ") : `${mod.slot}-class`;
}

/**
 * Procedural Pawnbroker portrait — sodium-lit silhouette of a man in
 * an apron behind a counter. Reads as a pulpy editorial cartoon.
 */
function PawnbrokerPortrait() {
  return (
    <svg
      viewBox="0 0 120 140"
      width="100"
      height="120"
      role="img"
      aria-label="Sal Mangione, the Pawnbroker"
      style={{ filter: `drop-shadow(0 0 10px ${COLOR.sodium}33)` }}
    >
      <defs>
        <radialGradient id="pawnbroker-sodium" cx="50%" cy="20%" r="80%">
          <stop offset="0%" stopColor={COLOR.sodium} stopOpacity="0.35" />
          <stop offset="100%" stopColor={COLOR.sodium} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="120" height="140" fill={COLOR.bgAsphalt} />
      <rect x="0" y="0" width="120" height="140" fill="url(#pawnbroker-sodium)" />
      <ellipse cx="60" cy="44" rx="22" ry="26" fill={COLOR.cream} />
      <path d="M40 34 Q60 18 80 34 L80 42 Q60 30 40 42 Z" fill={COLOR.bgConcreteDark} />
      <path d="M48 56 Q60 60 72 56 L72 60 Q60 64 48 60 Z" fill={COLOR.bgConcreteDark} />
      <line x1="48" y1="48" x2="55" y2="48" stroke={COLOR.bgConcreteDark} strokeWidth="2" />
      <line x1="65" y1="48" x2="72" y2="48" stroke={COLOR.bgConcreteDark} strokeWidth="2" />
      <path d="M30 74 L90 74 L98 130 L22 130 Z" fill={COLOR.brick} />
      <rect x="56" y="74" width="8" height="56" fill={COLOR.brickHighlight} />
      <line x1="0" y1="130" x2="120" y2="130" stroke={COLOR.sodium} strokeWidth="2" opacity="0.6" />
    </svg>
  );
}
