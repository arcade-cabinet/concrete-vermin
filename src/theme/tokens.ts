/**
 * Concrete Vermin design tokens — aggregator.
 *
 * Source of truth lives in:
 *   - colors.ts      — palette + per-act streetlight shift
 *   - typography.ts  — type ramp + face references
 *   - spacing.ts     — 8 px scale + corner radius
 *   - motion.ts      — animation durations + easings
 *
 * Components may import from here for convenience or directly from the
 * per-aspect file. See docs/DESIGN.md for editorial reasoning behind
 * every token.
 */

export { actLightFor, COLOR, type ColorToken } from "./colors";
export { MOTION, type MotionToken } from "./motion";
export { RADIUS, type RadiusToken, SPACING, type SpacingToken } from "./spacing";
export { fontFamilyFor, TYPE, type TypeToken } from "./typography";
