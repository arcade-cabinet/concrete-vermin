import { useGameStore } from "../runtime/store";

/**
 * Visually-hidden aria-live region for narrating non-visible game
 * events to screen readers. Two regions (polite + assertive) so the
 * runner / app code can pick urgency per announcement.
 *
 * Updated by `useGameStore().announceForScreenReader(text, urgency)`.
 * The store stores a monotonic id alongside the text so AT software
 * re-reads even when the same text is announced twice.
 */
export function SrLiveRegion() {
  const ann = useGameStore((s) => s.srAnnouncement);
  const isAssertive = ann.urgency === "assertive";
  return (
    <>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-testid="sr-polite"
        style={SR_ONLY}
      >
        {!isAssertive ? `${ann.text} ` : ""}
      </div>
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        data-testid="sr-assertive"
        style={SR_ONLY}
      >
        {isAssertive ? `${ann.text} ` : ""}
      </div>
    </>
  );
}

const SR_ONLY: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};
