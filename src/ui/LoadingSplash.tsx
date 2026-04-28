import { COLOR, TYPE } from "../theme/tokens";

/**
 * Shown over the stage until the Pixi Application finishes its first
 * frame. Plain absolute-positioned overlay so it can layer on top of
 * the canvas while the GL context warms up.
 */
export function LoadingSplash({ message = "Loading…" }: { message?: string }) {
  return (
    <div
      data-testid="loading-splash"
      role="status"
      aria-live="polite"
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        background: COLOR.bgAsphalt,
        color: COLOR.sodium,
        fontFamily: TYPE.faceDisplay,
        fontSize: 18,
        letterSpacing: 2,
        zIndex: 1,
      }}
    >
      <Spinner />
      <span>{message}</span>
    </div>
  );
}

function Spinner() {
  // Tiny pure-CSS spinner — sodium ring with a transparent quadrant
  // that rotates. No motion-reduction guard; it's the universal "we're
  // working" affordance and lasts < 1 s in practice.
  return (
    <div
      style={{
        width: 28,
        height: 28,
        border: `3px solid ${COLOR.borderMute}`,
        borderTopColor: COLOR.sodium,
        borderRadius: "50%",
        animation: "cv-spin 800ms linear infinite",
      }}
    >
      <style>{"@keyframes cv-spin { to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}
