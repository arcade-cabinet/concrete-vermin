/**
 * Sim-wide constants. Pure data, no behavior.
 */
export const SIM_TICK_HZ = 60;
export const SIM_DT = 1 / SIM_TICK_HZ;

/** Player input deadband to absorb jitter on touch surfaces. */
export const INPUT_DEADBAND_PX = 4;

/** Multiplier chain caps and decay (design Section 4.4). */
export const COMBO_MAX = 32;
export const COMBO_GRACE_S = 1.4;
export const COMBO_DECAY_PER_MISS = 1;

/** Style modifier ceilings. */
export const STYLE_LONGSHOT_PX = 480;
export const STYLE_HEADSHOT_HEIGHT_FRACTION = 0.25;
export const STYLE_NO_RELOAD_BONUS_S = 12;

/** Mission grade thresholds (S+ down to F). Score-relative. */
export const GRADE_THRESHOLDS = Object.freeze({
  "S+": 1.5,
  S: 1.25,
  A: 1.0,
  B: 0.85,
  C: 0.7,
  D: 0.55,
  F: 0,
} as const);

/** Magnetism / aim-assist taper. */
export const MAGNETISM_RADIUS_PX = 28;
export const MAGNETISM_FALLOFF = 0.6;

/** Cutscene gating: minimum visible time before a story beat is skippable. */
export const CUTSCENE_MIN_VISIBLE_MS = 600;
