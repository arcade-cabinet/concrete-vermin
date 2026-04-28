import { useEffect, useState } from "react";
import { COLOR, TYPE } from "../theme/tokens";
import { usePlayerProgress } from "./PlayerProgress";

interface Step {
  title: string;
  body: string;
}

const STEPS: ReadonlyArray<Step> = [
  {
    title: "AIM",
    body: "Drag anywhere on the stage to move the reticle. Mouse, finger, or arrow keys all work.",
  },
  {
    title: "FIRE",
    body: "Tap or click to fire a shell. Spacebar / Enter on a keyboard.",
  },
  {
    title: "RELOAD",
    body: "Long-press anywhere — or press R — to reload. Don't run dry mid-rat.",
  },
];

/**
 * Three-step explanatory overlay shown only on the player's very first
 * launch. Persisted via PlayerProgress.firstLaunchSeen, so subsequent
 * loads skip it entirely.
 *
 * Auto-dismisses on the first input event during play (pointer down OR
 * key press) — the player has demonstrated they don't need it. The
 * panel itself also has an explicit "Got it" button for read-through.
 */
export function FirstLaunchOverlay() {
  const seen = usePlayerProgress((s) => s.firstLaunchSeen);
  const mark = usePlayerProgress((s) => s.markFirstLaunchSeen);
  const [step, setStep] = useState(0);

  // Auto-dismiss on the first real input. Only set up the listener
  // when the overlay is still showing; tear down on unmount.
  useEffect(() => {
    if (seen) return;
    const dismiss = () => mark();
    window.addEventListener("pointerdown", dismiss, { once: true });
    window.addEventListener("keydown", dismiss, { once: true });
    return () => {
      window.removeEventListener("pointerdown", dismiss);
      window.removeEventListener("keydown", dismiss);
    };
  }, [seen, mark]);

  if (seen) return null;

  const current = STEPS[step];
  if (!current) return null;
  const isLast = step === STEPS.length - 1;

  return (
    <div
      data-testid="first-launch-overlay"
      style={{
        position: "fixed",
        top: "calc(56px + env(safe-area-inset-top))",
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(86vw, 360px)",
        background: "rgba(13, 12, 10, 0.92)",
        color: COLOR.cream,
        border: `1px solid ${COLOR.sodium}`,
        padding: "16px 20px",
        fontFamily: TYPE.faceMono,
        fontSize: 13,
        // Above HUD but below pause/settings dialogs.
        zIndex: 30,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <strong style={{ color: COLOR.sodium, fontFamily: TYPE.faceDisplay, letterSpacing: 2 }}>
          {step + 1} / {STEPS.length} · {current.title}
        </strong>
        <button
          type="button"
          onClick={mark}
          aria-label="Skip tutorial"
          style={{
            background: "transparent",
            color: COLOR.creamDim,
            border: "none",
            fontFamily: TYPE.faceMono,
            fontSize: 11,
            cursor: "pointer",
            padding: 4,
          }}
        >
          SKIP ✕
        </button>
      </div>
      <p style={{ margin: "8px 0 12px 0" }}>{current.body}</p>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            style={{
              background: "transparent",
              color: COLOR.sodium,
              border: `1px solid ${COLOR.sodium}`,
              minWidth: 44,
              minHeight: 44,
              padding: "6px 12px",
              fontFamily: TYPE.faceMono,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            ← BACK
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => (isLast ? mark() : setStep((s) => s + 1))}
          style={{
            background: COLOR.sodium,
            color: COLOR.bgAsphalt,
            border: "none",
            minWidth: 44,
            minHeight: 44,
            padding: "6px 16px",
            fontFamily: TYPE.faceMono,
            fontSize: 12,
            cursor: "pointer",
            letterSpacing: 1,
          }}
        >
          {isLast ? "GOT IT" : "NEXT →"}
        </button>
      </div>
    </div>
  );
}
