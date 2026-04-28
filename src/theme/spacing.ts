/**
 * 8 px-base spacing scale + corner radius. See docs/DESIGN.md.
 */

export const SPACING = Object.freeze({
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const);

export type SpacingToken = keyof typeof SPACING;

export const RADIUS = Object.freeze({
  none: 0,
  sm: 2,
  md: 4,
} as const);

export type RadiusToken = keyof typeof RADIUS;
