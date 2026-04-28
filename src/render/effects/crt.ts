// CRT overlay constants. This file is the ONLY production source allowed
// to reference the legacy neon-cyan / neon-magenta palette — the
// pre-edit-gate exempts `src/render/effects/crt.ts` by exact path. Used
// for the optional retro overlay; off by default, toggled in settings.

export const CRT_SCANLINE_DARK = 0x000000;
export const CRT_SCANLINE_ALPHA = 0.18;
export const CRT_SCANLINE_HEIGHT = 2;
export const CRT_VIGNETTE_ALPHA = 0.55;
// The ONLY allowed neon — used as a faint chroma fringe at edges.
export const CRT_FRINGE_CYAN = 0x00f0ff;
export const CRT_FRINGE_ALPHA = 0.06;
export const CRT_PHOSPHOR_GLOW = 0xff2a2a;
export const CRT_PHOSPHOR_ALPHA = 0.04;
