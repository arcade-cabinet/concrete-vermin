import { create } from "zustand";
import type { ReticleShape } from "../sim/archetypes/weapons/_types";

/**
 * UI store. Holds the snapshot the renderer reads each frame plus the
 * mission-flow state (briefing → playing → ended). The game runner
 * (src/runtime/runner.ts) writes here every tick; React components
 * subscribe via useGameStore selectors.
 *
 * Keeping the renderer-facing snapshot in zustand (instead of querying
 * Koota directly from JSX) keeps Pixi-react components from re-running
 * the heavy ECS query on every frame.
 */

export type MissionPhase =
  | "main-menu"
  | "briefing"
  | "mission-select"
  | "pawn-shop"
  | "playing"
  | "won"
  | "lost"
  | "credits";

export interface VerminSnapshot {
  id: number;
  archetypeId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
}

export interface ProjectileSnapshot {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface SplashSnapshot {
  id: number;
  x: number;
  y: number;
  ageS: number;
  ttlS: number;
  archetypeId: string;
}

export interface ModifierFlashSnapshot {
  kind: "headshot" | "two-for-one" | "mid-air" | "variety" | "no-reload";
  bonusPct: number;
  at: number;
}

/**
 * Mid-mission dynamic event bark — boss line, environmental hazard
 * label, or surprise-wave alert. The HUD renders a stack of recent
 * barks; entries auto-evict after their TTL elapses (driven by `at` +
 * `now` in the renderer).
 */
export interface EventBarkSnapshot {
  /** Stable id from the mission event, so the renderer can key + dedupe. */
  id: string;
  /** Display kind drives icon + color tone in the HUD. */
  kind: "boss" | "hazard" | "wave";
  /** Primary line. Short — fits one HUD row at 12 px mono. */
  text: string;
  /** Optional sub-line (used by environmental-hazard's `detail`). */
  detail?: string;
  /** Sim seconds when the bark fired. */
  at: number;
}

export interface DamageEvent {
  /** Sim seconds when the hit landed — used for ttl + rise interpolation. */
  at: number;
  /** Sim coords for the floating number's anchor. */
  x: number;
  y: number;
  /** Damage dealt (formatted as "+N" by the renderer). */
  amount: number;
  /** Crit and headshot get bigger + brighter glyphs. */
  crit: boolean;
  headshot: boolean;
}

export interface MuzzleFlash {
  /** Player muzzle position (sim coords). */
  x: number;
  y: number;
  /** Reticle direction at time of shot — the flash points this way. */
  targetX: number;
  targetY: number;
  /** Sim time the flash spawned. Renderer uses (now - firedAt) to fade. */
  firedAt: number;
  /** How long the flash stays visible (s). */
  ttlS: number;
}

export interface Settings {
  /** Optional retro CRT overlay (off by default per design — pulpy not glitchy). */
  crtOverlay: boolean;
  /** Master volume in dB. -60 = mute, 0 = unity. Default -6. */
  masterVolumeDb: number;
  /** Per-bus volume sliders in dB. Defaults match the bus baselines in audio/setup. */
  musicVolumeDb: number;
  sfxVolumeDb: number;
  uiVolumeDb: number;
  muted: boolean;
  /**
   * Honor the OS-level "reduce motion" preference. When true, score
   * tick-up animations snap, modifier flashes don't scale or lift, and
   * critical-life/ammo-empty pulses go quiet. Initialized from the
   * `prefers-reduced-motion` media query at app boot.
   */
  reducedMotion: boolean;
  /** AAA contrast: bumps body text to pure cream, dims accent backdrops. */
  highContrast: boolean;
  /** Vibration on hit / kill / boss-damage via @capacitor/haptics. */
  haptics: boolean;
  /**
   * Snap reticle to the nearest vermin within a small radius. Defaults
   * to true when the device is touch-only, false otherwise; the user
   * can override either way through the settings dialog.
   */
  aimAssist: boolean;
  /** Gamepad: invert the Y axis for stick aiming. */
  invertY: boolean;
}

export interface GameState {
  phase: MissionPhase;
  viewport: { width: number; height: number };
  settings: Settings;
  setCrtOverlay: (on: boolean) => void;
  setMasterVolumeDb: (db: number) => void;
  setMusicVolumeDb: (db: number) => void;
  setSfxVolumeDb: (db: number) => void;
  setUiVolumeDb: (db: number) => void;
  setMuted: (m: boolean) => void;
  setReducedMotion: (on: boolean) => void;
  setHighContrast: (on: boolean) => void;
  setHaptics: (on: boolean) => void;
  setAimAssist: (on: boolean) => void;
  setInvertY: (on: boolean) => void;
  reticle: { x: number; y: number };
  /** Hit-box / visual radius of the reticle in sim units. Mission-scoped. */
  reticleRadius: number;
  /** Reticle visual + behavior shape from the active weapon + reticle mod. */
  reticleShape: ReticleShape;
  score: { total: number; multiplier: number };
  player: { ammoCurrent: number; ammoMax: number; livesRemaining: number };
  vermin: ReadonlyArray<VerminSnapshot>;
  projectiles: ReadonlyArray<ProjectileSnapshot>;
  splashes: ReadonlyArray<SplashSnapshot>;
  muzzleFlashes: ReadonlyArray<MuzzleFlash>;
  modifierFlashes: ReadonlyArray<ModifierFlashSnapshot>;
  /**
   * Mid-mission dynamic event barks (boss-bark, environmental-hazard,
   * surprise-wave). Append-only ring; the runner evicts entries older
   * than 5 sim seconds before publishing.
   */
  eventBarks: ReadonlyArray<EventBarkSnapshot>;
  /** Sim seconds since mission start — published every frame for time-based fades. */
  now: number;
  /**
   * Reload window. null = not reloading; 0..1 = fraction complete.
   * The HUD renders a fill bar; the game-stage uses it to disable fire.
   */
  reloadProgress: number | null;
  /** Total reload duration in ms for the active mission's weapon. */
  reloadDurationMs: number;
  /** Cash awarded across the current session (sums per-mission awards). */
  cashAwarded: number;
  missionId: string;
  /** Active mission's act — drives per-act render tint + lighting. */
  missionAct: "streets" | "underworld" | "above";
  missionStartedAt: number;
  killsRequired: number;
  killCount: number;
  /** Append-only ring of recent damage numbers for the floating HUD. */
  damageEvents: ReadonlyArray<DamageEvent>;
  /** id increments on every call so AT re-narrates repeated text. */
  srAnnouncement: { text: string; urgency: "polite" | "assertive"; id: number };
  announceForScreenReader: (text: string, urgency?: "polite" | "assertive") => void;
  // Setters
  setPhase: (p: MissionPhase) => void;
  setViewport: (w: number, h: number) => void;
  setReticle: (x: number, y: number) => void;
  setSnapshot: (
    snap: Partial<
      Pick<
        GameState,
        | "vermin"
        | "projectiles"
        | "splashes"
        | "muzzleFlashes"
        | "modifierFlashes"
        | "eventBarks"
        | "score"
        | "player"
        | "killCount"
        | "now"
        | "reloadProgress"
        | "reloadDurationMs"
        | "damageEvents"
        | "reticleRadius"
        | "reticleShape"
      >
    >,
  ) => void;
  startMission: (id: string, killsRequired: number, act?: "streets" | "underworld" | "above") => void;
  endMission: (won: boolean) => void;
  awardCash: (amount: number) => void;
  resetCash: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  phase: "main-menu",
  viewport: { width: 480, height: 270 },
  settings: {
    crtOverlay: false,
    masterVolumeDb: -6,
    musicVolumeDb: -12,
    sfxVolumeDb: -4,
    uiVolumeDb: -8,
    muted: false,
    reducedMotion: false,
    highContrast: false,
    haptics: true,
    // Detect touch-only / coarse-pointer devices and default aim assist
    // on for them (helps the median touchscreen player); leaves desktop
    // mouse input precise by default.
    aimAssist:
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches,
    invertY: false,
  },
  setCrtOverlay: (on) => set((s) => ({ settings: { ...s.settings, crtOverlay: on } })),
  setMasterVolumeDb: (db) => set((s) => ({ settings: { ...s.settings, masterVolumeDb: db } })),
  setMusicVolumeDb: (db) => set((s) => ({ settings: { ...s.settings, musicVolumeDb: db } })),
  setSfxVolumeDb: (db) => set((s) => ({ settings: { ...s.settings, sfxVolumeDb: db } })),
  setUiVolumeDb: (db) => set((s) => ({ settings: { ...s.settings, uiVolumeDb: db } })),
  setMuted: (muted) => set((s) => ({ settings: { ...s.settings, muted } })),
  setReducedMotion: (on) => set((s) => ({ settings: { ...s.settings, reducedMotion: on } })),
  setHighContrast: (on) => set((s) => ({ settings: { ...s.settings, highContrast: on } })),
  setHaptics: (on) => set((s) => ({ settings: { ...s.settings, haptics: on } })),
  setAimAssist: (on) => set((s) => ({ settings: { ...s.settings, aimAssist: on } })),
  setInvertY: (on) => set((s) => ({ settings: { ...s.settings, invertY: on } })),
  reticle: { x: 240, y: 200 },
  reticleRadius: 8,
  reticleShape: "cross",
  score: { total: 0, multiplier: 1 },
  player: { ammoCurrent: 6, ammoMax: 6, livesRemaining: 3 },
  vermin: [],
  projectiles: [],
  splashes: [],
  muzzleFlashes: [],
  modifierFlashes: [],
  eventBarks: [],
  now: 0,
  reloadProgress: null,
  reloadDurationMs: 1400,
  cashAwarded: 0,
  missionId: "",
  missionAct: "streets",
  missionStartedAt: 0,
  killsRequired: 0,
  killCount: 0,
  damageEvents: [],
  srAnnouncement: { text: "", urgency: "polite", id: 0 },
  announceForScreenReader: (text, urgency = "polite") =>
    set((s) => ({ srAnnouncement: { text, urgency, id: s.srAnnouncement.id + 1 } })),
  setPhase: (phase) => set({ phase }),
  setViewport: (width, height) => set({ viewport: { width, height } }),
  setReticle: (x, y) => set({ reticle: { x, y } }),
  setSnapshot: (snap) => set(snap),
  startMission: (id, killsRequired, act = "streets") =>
    set({
      missionId: id,
      missionAct: act,
      killsRequired,
      killCount: 0,
      missionStartedAt: performance.now() / 1000,
      phase: "playing",
      score: { total: 0, multiplier: 1 },
      vermin: [],
      projectiles: [],
      splashes: [],
      muzzleFlashes: [],
      modifierFlashes: [],
      eventBarks: [],
      damageEvents: [],
      now: 0,
    }),
  endMission: (won) => set({ phase: won ? "won" : "lost" }),
  awardCash: (amount) => set((s) => ({ cashAwarded: s.cashAwarded + Math.max(0, amount) })),
  resetCash: () => set({ cashAwarded: 0 }),
}));
