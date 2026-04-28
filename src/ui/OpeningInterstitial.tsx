import { useCallback, useEffect, useRef, useState } from "react";
import { COLOR, TYPE } from "../theme/tokens";

const SHOWN_KEY = "cv:opening-shown";

const PARAGRAPHS: ReadonlyArray<string> = [
  "Bedford-Stuyvesant, summer 1979.",
  "The vermin aren't behaving normally. Pigeons stalk in formation. Roaches hunt in the dark. Something in the river is not a fish.",
  "Sal Mangione runs a pawnshop on Fulton Street. He has a back room full of family weapons, and he is hiring shooters.",
  "He hands you the family shotgun and a box of shells.",
  "“Drop them all,” he says. “The block depends on it.”",
];

/**
 * Skippable opening cutscene. Renders the moment the app boots, but
 * only on first launch — once shown, persists a flag in localStorage
 * so returning players land directly on the MainMenu.
 *
 * Players can dismiss with Esc, click, tap, or the SKIP button. The
 * overlay sits above every phase root (z-index 200) so it shows
 * regardless of which screen would have rendered behind it.
 */
export function OpeningInterstitial() {
  // Initialize from localStorage synchronously so returning players don't
  // see a one-frame flash of the MainMenu before the overlay snaps in.
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(SHOWN_KEY) !== "1";
    } catch {
      return true;
    }
  });
  const skipRef = useRef<HTMLButtonElement>(null);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(SHOWN_KEY, "1");
    } catch {
      // Best-effort; the player will see it again next boot if storage is denied.
    }
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    skipRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        dismiss();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismiss]);

  if (!open) return null;

  return (
    <div
      data-testid="opening-interstitial"
      role="dialog"
      aria-modal="true"
      aria-label="Opening cutscene"
      onClick={dismiss}
      // The window-level keydown listener above handles dismissal for
      // real keyboard users; this onKeyDown exists only to satisfy the
      // a11y/onClick-paired-with-keyhandler lint rule on the focusable
      // backdrop and is functionally redundant.
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") dismiss();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: COLOR.bgAsphalt,
        color: COLOR.cream,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding:
          "calc(48px + env(safe-area-inset-top)) calc(24px + env(safe-area-inset-right)) " +
          "calc(48px + env(safe-area-inset-bottom)) calc(24px + env(safe-area-inset-left))",
        zIndex: 200,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          color: COLOR.sodium,
          fontFamily: TYPE.faceMono,
          fontSize: 11,
          letterSpacing: "0.4em",
        }}
      >
        ARCADE CABINET PRESENTS
      </div>
      <h1
        style={{
          fontFamily: TYPE.faceDisplay,
          color: COLOR.sodium,
          fontSize: "clamp(2rem, 6vw, 3.6rem)",
          letterSpacing: "0.18em",
          margin: 0,
          textShadow: `0 0 18px ${COLOR.sodium}55`,
        }}
      >
        CONCRETE VERMIN
      </h1>
      <div
        style={{
          maxWidth: 560,
          fontFamily: TYPE.faceMono,
          fontSize: "clamp(13px, 1.8vw, 15px)",
          color: COLOR.cream,
          lineHeight: 1.6,
          textAlign: "center",
        }}
      >
        {PARAGRAPHS.map((p) => (
          <p
            key={p}
            style={{
              margin: "0 0 14px",
              animation: "cv-opening-fade 800ms ease-out both",
            }}
          >
            {p}
          </p>
        ))}
      </div>
      <button
        type="button"
        ref={skipRef}
        onClick={(e) => {
          e.stopPropagation();
          dismiss();
        }}
        style={{
          background: COLOR.sodium,
          color: COLOR.bgAsphalt,
          border: "none",
          minWidth: 180,
          minHeight: 48,
          padding: "10px 24px",
          fontFamily: TYPE.faceMono,
          fontSize: 13,
          letterSpacing: "0.25em",
          cursor: "pointer",
          textTransform: "uppercase",
          fontWeight: 700,
          boxShadow: `0 0 18px ${COLOR.sodium}55`,
        }}
      >
        ▸ Continue
      </button>
      <div
        style={{
          color: COLOR.creamDim,
          fontFamily: TYPE.faceMono,
          fontSize: 11,
          letterSpacing: "0.2em",
        }}
      >
        TAP / CLICK / ESC TO SKIP
      </div>
      <style>{`
        @keyframes cv-opening-fade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
