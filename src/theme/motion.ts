/**
 * Motion tokens. See docs/DESIGN.md "HUD style guide" — snap, don't drift.
 *
 * The spec for HUD timings: nothing slower than 1.2 s, never overlap the
 * bottom 60% of the stage, no animation that delays player input.
 */

export const MOTION = Object.freeze({
  /** Snap UI feedback (button press, hover). */
  snap: "120ms cubic-bezier(0.2, 0, 0.2, 1)",
  /** Quick HUD feedback (modifier-flash chip rise). */
  pulse: "240ms ease-out",
  /** Score tick-up roll. */
  ticker: "200ms ease-out",
  /** Multiplier flash chip lifetime — opacity + scale + translate-Y. */
  flashChipMs: 1000,
  /** Critical-life pulse loop period. */
  criticalLifeMs: 1200,
  /** Streak badge slide-in / hold / fade-out (sum). */
  streakBadgeMs: 240 + 1600 + 240,
  /** Reserved for ambient elements (streetlight flicker). */
  ambient: "1200ms ease-in-out",
} as const);

export type MotionToken = keyof typeof MOTION;
