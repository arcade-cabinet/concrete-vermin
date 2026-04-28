import { create } from "zustand";

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

export type MissionPhase = "briefing" | "playing" | "won" | "lost";

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
}

export interface GameState {
  phase: MissionPhase;
  viewport: { width: number; height: number };
  settings: Settings;
  setCrtOverlay: (on: boolean) => void;
  reticle: { x: number; y: number };
  score: { total: number; multiplier: number };
  player: { ammoCurrent: number; ammoMax: number; livesRemaining: number };
  vermin: ReadonlyArray<VerminSnapshot>;
  projectiles: ReadonlyArray<ProjectileSnapshot>;
  splashes: ReadonlyArray<SplashSnapshot>;
  muzzleFlashes: ReadonlyArray<MuzzleFlash>;
  /** Sim seconds since mission start — published every frame for time-based fades. */
  now: number;
  missionId: string;
  missionStartedAt: number;
  killsRequired: number;
  killCount: number;
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
        | "score"
        | "player"
        | "killCount"
        | "now"
      >
    >,
  ) => void;
  startMission: (id: string, killsRequired: number) => void;
  endMission: (won: boolean) => void;
}

export const useGameStore = create<GameState>((set) => ({
  phase: "briefing",
  viewport: { width: 480, height: 270 },
  settings: { crtOverlay: false },
  setCrtOverlay: (on) => set((s) => ({ settings: { ...s.settings, crtOverlay: on } })),
  reticle: { x: 240, y: 200 },
  score: { total: 0, multiplier: 1 },
  player: { ammoCurrent: 6, ammoMax: 6, livesRemaining: 3 },
  vermin: [],
  projectiles: [],
  splashes: [],
  muzzleFlashes: [],
  now: 0,
  missionId: "",
  missionStartedAt: 0,
  killsRequired: 0,
  killCount: 0,
  setPhase: (phase) => set({ phase }),
  setViewport: (width, height) => set({ viewport: { width, height } }),
  setReticle: (x, y) => set({ reticle: { x, y } }),
  setSnapshot: (snap) => set(snap),
  startMission: (id, killsRequired) =>
    set({
      missionId: id,
      killsRequired,
      killCount: 0,
      missionStartedAt: performance.now() / 1000,
      phase: "playing",
      score: { total: 0, multiplier: 1 },
      vermin: [],
      projectiles: [],
      splashes: [],
      muzzleFlashes: [],
      now: 0,
    }),
  endMission: (won) => set({ phase: won ? "won" : "lost" }),
}));
