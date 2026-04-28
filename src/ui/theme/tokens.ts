/**
 * Concrete Vermin design tokens.
 *
 * Source of truth for the brand palette + type ramp + spacing scale.
 * Components MUST import these instead of hard-coding hex / font names —
 * the pre-edit gate enforces this for the forbidden anti-palette, and a
 * lint rule (planned) will eventually enforce it for all hex.
 *
 * See docs/DESIGN.md for editorial reasoning behind every token.
 */

export const COLOR = Object.freeze({
  // Backgrounds & surfaces
  bgAsphalt: "#0d0c0a",
  bgConcrete: "#3a3833",
  bgConcreteDark: "#1a1715",

  // Brand accents
  sodium: "#d4943a",
  brick: "#7a2818",
  brickHighlight: "#9a3820",
  piss: "#a89344",
  eliteGreen: "#5c6b2e",

  // Type
  cream: "#e8dcc4",
  creamDim: "#a89887",
  mute: "#5a544c",
} as const);

export type ColorToken = keyof typeof COLOR;

export const TYPE = Object.freeze({
  faceDisplay: "'Big Shoulders Display', sans-serif",
  faceMono: "'Special Elite', monospace",

  display: { size: "clamp(2rem, 6vw, 4rem)", weight: 700, face: "display" as const },
  h1: { size: "clamp(1.5rem, 4vw, 2.4rem)", weight: 600, face: "display" as const },
  h2: { size: "1.2rem", weight: 500, face: "display" as const },
  body: { size: "1rem", weight: 400, face: "mono" as const },
  hud: { size: "0.875rem", weight: 400, face: "mono" as const },
  tag: { size: "0.75rem", weight: 400, face: "mono" as const },
} as const);

export const SPACING = Object.freeze({
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const);

export const RADIUS = Object.freeze({
  none: 0,
  sm: 2,
  md: 4,
} as const);

export const MOTION = Object.freeze({
  /** Per design: snap, don't drift. Quick UI feedback. */
  snap: "120ms cubic-bezier(0.2, 0, 0.2, 1)",
  pulse: "240ms ease-out",
  /** Reserved for ambient elements (streetlight flicker). */
  ambient: "1200ms ease-in-out",
} as const);

/**
 * Convenience: get the CSS font-family literal for a TYPE entry.
 */
export function fontFamilyFor(face: "display" | "mono"): string {
  return face === "display" ? TYPE.faceDisplay : TYPE.faceMono;
}
