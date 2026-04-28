/**
 * Type ramp. See docs/DESIGN.md for editorial reasoning. Two faces only:
 * Big Shoulders Display (headlines) and Special Elite (everything else).
 */

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

export type TypeToken = Exclude<keyof typeof TYPE, "faceDisplay" | "faceMono">;

export function fontFamilyFor(face: "display" | "mono"): string {
  return face === "display" ? TYPE.faceDisplay : TYPE.faceMono;
}
