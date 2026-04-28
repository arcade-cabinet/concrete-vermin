/**
 * Brand palette. See docs/DESIGN.md for editorial reasoning.
 *
 * Components MUST import these instead of hard-coding hex. The
 * pre-edit-gate enforces this for the forbidden anti-palette; a lint
 * rule (planned) will eventually enforce it for all hex.
 */

import type { ActId } from "../sim/factories/mission";

export const COLOR = Object.freeze({
  // Backgrounds & surfaces
  bgAsphalt: "#0d0c0a",
  bgConcrete: "#3a3833",
  bgConcreteDark: "#1a1715",

  // Brand accents
  sodium: "#d4943a",
  sodiumCool: "#b87a2a",
  brick: "#7a2818",
  brickHighlight: "#9a3820",
  /**
   * AA-passing brick variant for use as TEXT on bgAsphalt — the raw
   * brick fails 4.5:1 (saturates dark). Use this for low-ammo, low-
   * life, and other critical alerts. Decorative brick fills (chips,
   * borders, brand surfaces) keep the original brick token.
   */
  brickAccessible: "#e35a3a",
  piss: "#a89344",
  eliteGreen: "#5c6b2e",
  /**
   * AA-passing eliteGreen variant for TEXT on bgAsphalt (7.6:1 computed).
   * The raw eliteGreen fails 4.5:1 as foreground on dark backgrounds.
   * Use this for act headers, labels, and other readable text.
   * Decorative fills (dots, halos) keep the original eliteGreen.
   */
  eliteGreenAccessible: "#90ac50",

  // Type
  cream: "#e8dcc4",
  creamDim: "#a89887",
  mute: "#5a544c",

  // UI scaffolding
  borderMute: "#3a342c", // disabled/inactive 1 px stroke

  // Modifier-flash chips — non-brand pop colors used by the HUD
  // to differentiate kill modifiers (HEADSHOT / 2-FOR-1 / MID-AIR /
  // VARIETY / NO-RELOAD). Sodium-derived, never neon.
  flashSodiumLight: "#ffd07a", // 2-FOR-1
  flashGreen: "#a8d04a", // MID-AIR
} as const);

export type ColorToken = keyof typeof COLOR;

/**
 * Convert a `#rrggbb` brand token into the `0xRRGGBB` numeric Pixi
 * expects. Use this in render/* so both UI and renderer share one color
 * source of truth instead of drifting per-file.
 */
export function pixi(hex: string): number {
  return Number.parseInt(hex.replace(/^#/, ""), 16);
}

/**
 * Per-act streetlight color shift. See DESIGN.md "Per-act color shift"
 * for editorial reasoning. Returns the gradient stops the renderer
 * should use for the streetlight pool.
 */
export function actLightFor(act: ActId): { core: string; rim: string; underglow: string | null } {
  switch (act) {
    case "streets":
      return { core: COLOR.sodium, rim: COLOR.sodium, underglow: null };
    case "underworld":
      return { core: COLOR.sodiumCool, rim: COLOR.sodiumCool, underglow: COLOR.eliteGreen };
    case "above":
      return { core: COLOR.sodium, rim: COLOR.cream, underglow: null };
  }
}
