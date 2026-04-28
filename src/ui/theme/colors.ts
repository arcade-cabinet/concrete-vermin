/**
 * Brand palette. See docs/DESIGN.md for editorial reasoning.
 *
 * Components MUST import these instead of hard-coding hex. The
 * pre-edit-gate enforces this for the forbidden anti-palette; a lint
 * rule (planned) will eventually enforce it for all hex.
 */

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
  piss: "#a89344",
  eliteGreen: "#5c6b2e",

  // Type
  cream: "#e8dcc4",
  creamDim: "#a89887",
  mute: "#5a544c",
} as const);

export type ColorToken = keyof typeof COLOR;

import type { ActId } from "../../sim/factories/mission";

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
