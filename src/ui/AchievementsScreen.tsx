import { ACHIEVEMENTS, type Achievement } from "../sim/content/achievements";
import { COLOR, TYPE } from "../theme/tokens";
import { usePlayerProgress } from "./PlayerProgress";

const TIER_ORDER: Record<Achievement["tier"], number> = {
  bronze: 0,
  silver: 1,
  gold: 2,
  secret: 3,
};

const TIER_COLOR: Record<Achievement["tier"], string> = {
  bronze: "#a07045",
  silver: "#a8a899",
  gold: COLOR.sodium,
  secret: COLOR.brickAccessible,
};

const TIER_LABEL: Record<Achievement["tier"], string> = {
  bronze: "BRONZE",
  silver: "SILVER",
  gold: "GOLD",
  secret: "SECRET",
};

/**
 * Gallery view of every achievement. Locked entries show their name +
 * description; secret-tier locked entries show "???" until unlocked.
 *
 * Sorted by tier (bronze → silver → gold → secret) then by id for
 * stable layout. Counts shown at the top.
 */
export function AchievementsScreen({ onBack }: { onBack: () => void }) {
  const unlocked = usePlayerProgress((s) => s.unlockedAchievements);
  const sorted = [...ACHIEVEMENTS].sort((a, b) => {
    const t = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
    return t !== 0 ? t : a.id.localeCompare(b.id);
  });

  return (
    <div
      data-testid="achievements-screen"
      data-phase-root="achievements"
      role="document"
      aria-label="Achievements"
      style={{
        position: "fixed",
        inset: 0,
        background: COLOR.bgAsphalt,
        color: COLOR.cream,
        fontFamily: TYPE.faceDisplay,
        overflowY: "auto",
        padding:
          "calc(40px + env(safe-area-inset-top)) calc(24px + env(safe-area-inset-right)) " +
          "calc(80px + env(safe-area-inset-bottom)) calc(24px + env(safe-area-inset-left))",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: 28 }}>
        <h2
          style={{
            color: COLOR.sodium,
            letterSpacing: "0.3em",
            margin: 0,
            fontSize: "1.6rem",
          }}
        >
          ACHIEVEMENTS
        </h2>
        <p
          style={{
            color: COLOR.creamDim,
            fontFamily: TYPE.faceMono,
            fontSize: 12,
            marginTop: 6,
            letterSpacing: "0.2em",
          }}
        >
          {unlocked.length} / {ACHIEVEMENTS.length} UNLOCKED
        </p>
      </header>

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: "0 auto",
          maxWidth: 720,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 12,
        }}
      >
        {sorted.map((a) => {
          const isUnlocked = unlocked.includes(a.id);
          const accent = TIER_COLOR[a.tier];
          // Secret-tier locked entries hide the name + description so
          // discovery still has weight; tier badge stays visible.
          const showSecret = a.tier === "secret" && !isUnlocked;
          return (
            <li
              key={a.id}
              data-testid={`achievement-${a.id}`}
              data-unlocked={isUnlocked ? "1" : "0"}
              style={{
                background: `linear-gradient(180deg, ${COLOR.bgConcreteDark} 0%, ${COLOR.bgAsphalt} 100%)`,
                border: `1px solid ${isUnlocked ? accent : COLOR.borderMute}`,
                padding: "12px 14px",
                opacity: isUnlocked ? 1 : 0.55,
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    color: accent,
                    fontFamily: TYPE.faceMono,
                    fontSize: 10,
                    letterSpacing: "0.25em",
                  }}
                >
                  {TIER_LABEL[a.tier]}
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    fontSize: 12,
                    color: isUnlocked ? accent : COLOR.creamDim,
                    fontFamily: TYPE.faceMono,
                  }}
                >
                  {isUnlocked ? "✓ UNLOCKED" : "LOCKED"}
                </span>
              </div>
              <div
                style={{
                  fontFamily: TYPE.faceDisplay,
                  fontSize: 16,
                  color: isUnlocked ? COLOR.cream : COLOR.creamDim,
                  marginBottom: 4,
                  letterSpacing: "0.04em",
                }}
              >
                {showSecret ? "???" : a.name}
              </div>
              <div
                style={{
                  fontFamily: TYPE.faceMono,
                  fontSize: 12,
                  color: COLOR.creamDim,
                  lineHeight: 1.4,
                }}
              >
                {showSecret ? "Hidden until unlocked." : a.description}
              </div>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={onBack}
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
