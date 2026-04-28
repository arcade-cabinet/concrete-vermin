import * as Dialog from "@radix-ui/react-dialog";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useGameStore } from "../runtime/store";
import { COLOR, TYPE } from "../theme/tokens";
import { useArrowGridNav } from "./hooks/useArrowGridNav";
import { usePlayerProgress } from "./PlayerProgress";

// Modal/overlay screens — only mounted on specific player choice.
// Lazy-loaded so the title screen doesn't ship their JS upfront.
const AchievementsScreen = lazy(() =>
  import("./AchievementsScreen").then((m) => ({ default: m.AchievementsScreen })),
);
const PawnShop = lazy(() => import("./PawnShop").then((m) => ({ default: m.PawnShop })));
const SettingsDialog = lazy(() =>
  import("./SettingsDialog").then((m) => ({ default: m.SettingsDialog })),
);

const TITLE = "CONCRETE VERMIN";
const SUBTITLE = "TACTICAL · REFORGED";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/**
 * Title-screen logo with a scrambled-letter "decode" animation. The
 * letters cycle through random glyphs, settling left-to-right into the
 * final TITLE over ~900 ms. Inspired by the HyperText pattern from
 * 21st.dev — re-implemented in plain CSS so we don't pull tailwind.
 *
 * Reduced-motion: skips the scramble and renders the title statically.
 */
function ScrambledLogo({ reduced }: { reduced: boolean }) {
  const [text, setText] = useState(reduced ? TITLE : TITLE.replace(/[A-Z]/g, "·"));
  useEffect(() => {
    if (reduced) {
      setText(TITLE);
      return;
    }
    let frame = 0;
    const total = 28;
    const id = window.setInterval(() => {
      frame++;
      const settled = Math.floor((frame / total) * TITLE.length);
      const next = TITLE.split("")
        .map((c, i) => {
          if (c === " ") return " ";
          if (i < settled) return c;
          return ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
        })
        .join("");
      setText(next);
      if (frame >= total) {
        setText(TITLE);
        window.clearInterval(id);
      }
    }, 32);
    return () => window.clearInterval(id);
  }, [reduced]);
  return (
    <h1
      style={{
        fontFamily: TYPE.faceDisplay,
        color: COLOR.sodium,
        fontSize: "clamp(2.4rem, 9vw, 5.5rem)",
        letterSpacing: "0.15em",
        margin: 0,
        textShadow: `0 0 18px ${COLOR.sodium}40, 0 2px 0 ${COLOR.bgConcreteDark}`,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </h1>
  );
}

/** A single arcade-cabinet style menu button with sodium underglow + corner brackets. */
function MenuButton({
  label,
  onClick,
  primary,
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const accent = primary ? COLOR.sodium : COLOR.cream;
  const bg = primary ? COLOR.sodium : "transparent";
  const fg = primary ? COLOR.bgConcreteDark : accent;
  return (
    <button
      type="button"
      data-arrow-nav-item="menu"
      onClick={onClick}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      style={{
        position: "relative",
        background: bg,
        color: fg,
        border: `1px solid ${accent}`,
        minWidth: 220,
        minHeight: 52,
        padding: "12px 28px",
        fontFamily: TYPE.faceMono,
        fontSize: 14,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        cursor: "pointer",
        boxShadow: hover ? `0 0 18px ${accent}66, inset 0 0 8px ${accent}33` : "none",
        transition: "box-shadow 120ms ease, transform 120ms ease",
        transform: hover ? "translateY(-1px)" : "translateY(0)",
      }}
    >
      {/* Corner brackets — single L-glyph in each corner, hover-amplified */}
      <CornerBrackets color={accent} />
      <span style={{ position: "relative", zIndex: 1 }}>
        {hover && primary ? `▸ ${label}` : label}
      </span>
    </button>
  );
}

function CornerBrackets({ color }: { color: string }) {
  const len = 8;
  const w = 1;
  const corners: Array<{
    top?: number;
    left?: number;
    right?: number;
    bottom?: number;
    rot: number;
  }> = [
    { top: -2, left: -2, rot: 0 },
    { top: -2, right: -2, rot: 90 },
    { bottom: -2, right: -2, rot: 180 },
    { bottom: -2, left: -2, rot: 270 },
  ];
  return (
    <>
      {corners.map((c) => (
        <span
          key={`${c.top ?? "_"}:${c.left ?? "_"}:${c.right ?? "_"}:${c.bottom ?? "_"}`}
          aria-hidden="true"
          style={{
            position: "absolute",
            top: c.top,
            left: c.left,
            right: c.right,
            bottom: c.bottom,
            width: len,
            height: len,
            borderTop: `${w}px solid ${color}`,
            borderLeft: `${w}px solid ${color}`,
            transform: `rotate(${c.rot}deg)`,
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}

export function MainMenu() {
  const setPhase = useGameStore((s) => s.setPhase);
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion);
  const completed = usePlayerProgress((s) => s.completedMissionIds);
  const hasProgress = completed.length > 0;
  const startRef = useRef<HTMLButtonElement>(null);
  const gridRef = useArrowGridNav<HTMLDivElement>();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);

  // Autofocus Press Start on mount so a keyboard / arcade-stick player
  // can press Enter immediately without tab-hunting.
  useEffect(() => {
    startRef.current?.focus();
  }, []);

  return (
    <main
      data-testid="main-menu"
      data-phase-root="main-menu"
      aria-label="Concrete Vermin main menu"
      style={{
        position: "fixed",
        inset: 0,
        background: `radial-gradient(ellipse at 50% 35%, ${COLOR.bgConcrete} 0%, ${COLOR.bgAsphalt} 70%)`,
        color: COLOR.cream,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding:
          "calc(24px + env(safe-area-inset-top)) calc(24px + env(safe-area-inset-right)) " +
          "calc(24px + env(safe-area-inset-bottom)) calc(24px + env(safe-area-inset-left))",
        fontFamily: TYPE.faceDisplay,
        textAlign: "center",
      }}
    >
      <ScrambledLogo reduced={reducedMotion} />
      <p
        style={{
          fontFamily: TYPE.faceMono,
          color: COLOR.sodium,
          letterSpacing: "0.4em",
          margin: 0,
          fontSize: 13,
        }}
      >
        {SUBTITLE}
      </p>
      <p
        style={{
          fontFamily: TYPE.faceMono,
          color: COLOR.creamDim,
          margin: "8px 0 24px",
          fontSize: 13,
          maxWidth: 540,
        }}
      >
        Bedford-Stuyvesant, summer 1979. The vermin are not behaving normally. The Pawnbroker is
        hiring.
      </p>
      <div ref={gridRef} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          type="button"
          ref={startRef}
          data-arrow-nav-item="menu"
          data-testid="main-menu-start"
          onClick={() => setPhase(hasProgress ? "mission-select" : "briefing")}
          style={{
            position: "relative",
            background: COLOR.sodium,
            color: COLOR.bgConcreteDark,
            border: `1px solid ${COLOR.sodium}`,
            minWidth: 240,
            minHeight: 56,
            padding: "14px 32px",
            fontFamily: TYPE.faceMono,
            fontSize: 16,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            cursor: "pointer",
            fontWeight: 700,
            boxShadow: `0 0 22px ${COLOR.sodium}55, inset 0 0 10px ${COLOR.sodium}33`,
            animation: reducedMotion ? undefined : "cv-press-start 1.2s ease-in-out infinite",
          }}
        >
          <CornerBrackets color={COLOR.bgConcreteDark} />
          {hasProgress ? "Continue" : "Press Start"}
        </button>
        {hasProgress ? <MenuButton label="New Run" onClick={() => setPhase("briefing")} /> : null}
        <MenuButton label="Market" onClick={() => setMarketOpen(true)} />
        <MenuButton label="Achievements" onClick={() => setAchievementsOpen(true)} />
        <MenuButton label="Settings" onClick={() => setSettingsOpen(true)} />
        <MenuButton label="Credits" onClick={() => setPhase("credits")} />
      </div>
      {settingsOpen ? (
        <Suspense fallback={null}>
          <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
        </Suspense>
      ) : null}
      {marketOpen ? <MarketDialog open={marketOpen} onOpenChange={setMarketOpen} /> : null}
      {achievementsOpen ? (
        <Suspense fallback={null}>
          <AchievementsScreen onBack={() => setAchievementsOpen(false)} />
        </Suspense>
      ) : null}
      <style>{`
        @keyframes cv-press-start {
          0%, 100% { box-shadow: 0 0 22px ${COLOR.sodium}55, inset 0 0 10px ${COLOR.sodium}33; }
          50% { box-shadow: 0 0 30px ${COLOR.sodium}99, inset 0 0 18px ${COLOR.sodium}55; }
        }
      `}</style>
      <footer
        style={{
          position: "absolute",
          bottom: "calc(12px + env(safe-area-inset-bottom))",
          left: 0,
          right: 0,
          fontFamily: TYPE.faceMono,
          color: COLOR.creamDim,
          fontSize: 11,
          letterSpacing: "0.15em",
          opacity: 0.7,
        }}
      >
        © 1979 / 2026 · ARCADE CABINET
      </footer>
    </main>
  );
}

/**
 * Market modal — wraps PawnShop in a Radix Dialog so the player can
 * browse mods + buy from the title screen without committing to a
 * mission. The shop's "Continue / Back" CTAs both close the modal.
 */
function MarketDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{ position: "fixed", inset: 0, background: "rgba(13, 12, 10, 0.78)", zIndex: 50 }}
        />
        <Dialog.Content
          aria-label="Market"
          aria-describedby={undefined}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 51,
            background: "transparent",
            overflowY: "auto",
          }}
        >
          <Dialog.Title
            style={{
              position: "absolute",
              width: 1,
              height: 1,
              padding: 0,
              margin: -1,
              overflow: "hidden",
              clip: "rect(0, 0, 0, 0)",
              whiteSpace: "nowrap",
              border: 0,
            }}
          >
            Market
          </Dialog.Title>
          <Suspense fallback={null}>
            <PawnShop onContinue={() => onOpenChange(false)} onBack={() => onOpenChange(false)} />
          </Suspense>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
