/**
 * Per-act render palette. The Stage renderer reads these to paint the
 * streetlight pool, brick highlight, and a wash tint over the scene.
 *
 * Streets — sodium amber (the default brand light).
 * Underworld — sickly subway-fluorescent green.
 * Above — pale dawn (high-altitude blue/lavender).
 *
 * Numeric hex (Pixi-native 0xRRGGBB), not strings, since the renderer
 * passes them straight to PixiGraphics.
 */

export type ActId = "streets" | "underworld" | "above";

export interface ActPalette {
  /** Color of the streetlight bulb + ground pool. */
  light: number;
  /** Optional saturated background wash tint (Pixi color). */
  wash: number;
  /** Wash alpha (0..1). */
  washAlpha: number;
  /** Brick base hue override — null = use the default sodium-warmed brick. */
  brickTint: number | null;
}

const PALETTES: Readonly<Record<ActId, Readonly<ActPalette>>> = Object.freeze({
  streets: Object.freeze({
    light: 0xf2a13a,
    wash: 0xc4781a,
    washAlpha: 0.0,
    brickTint: null,
  }),
  underworld: Object.freeze({
    // Subway fluorescent — sickly cool green tipping into yellow.
    light: 0xa8d04a,
    wash: 0x1a3a2a,
    washAlpha: 0.18,
    brickTint: 0x3a2a1a,
  }),
  above: Object.freeze({
    // Pre-dawn rooftop — lavender-blue cold.
    light: 0xc8c0e4,
    wash: 0x2a2c4a,
    washAlpha: 0.16,
    brickTint: 0x5a2a1a,
  }),
});

export function actLightFor(act: ActId | string | undefined | null): Readonly<ActPalette> {
  if (act === "underworld" || act === "above" || act === "streets") return PALETTES[act];
  return PALETTES.streets;
}
