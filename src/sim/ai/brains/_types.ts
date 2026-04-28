import type { ArchetypeId } from "../../archetypes/vermin";

/**
 * Brain inputs/outputs. Brains are PURE functions of (self, world, rng)
 * → GoapPlan. The runtime applies the plan tick-by-tick. Brains never
 * touch ECS or mutate world; the encounter system is the only place
 * effects land.
 *
 * `GoapPlan` is a *script* — a finite list of steps the runtime
 * interprets. We don't reuse the GOAP A* planner here because vermin
 * brains are reactive, not goal-search; the planner is reserved for
 * boss scripts (CV-032).
 */

export type Vec2 = Readonly<{ x: number; y: number }>;

export interface VerminSelf {
  spawnId: number;
  archetypeId: ArchetypeId;
  position: Vec2;
  velocity: Vec2;
  health: number;
  /** Aggression curve [0..1] derived from traits. */
  aggression: number;
  /** Reaction delay in seconds. */
  reactionDelayS: number;
  /** Movement noise [0..1]. */
  jitter: number;
}

export interface BrainWorld {
  /** Player position in world units. */
  playerPosition: Vec2;
  /** Sim seconds since mission start. */
  now: number;
  /** Bounds of the active encounter zone (used for clamps + flank decisions). */
  zone: Readonly<{ minX: number; maxX: number; minY: number; maxY: number }>;
}

export type BrainStep =
  | { kind: "move-to"; target: Vec2; speed: number }
  | { kind: "wait"; durationS: number }
  | { kind: "lunge-at"; target: Vec2; speed: number; durationS: number }
  | { kind: "dive-at"; target: Vec2; speed: number }
  | { kind: "climb-to"; target: Vec2; speed: number }
  | { kind: "pop-out"; from: Vec2; to: Vec2; durationS: number }
  | { kind: "flee-to"; target: Vec2; speed: number }
  | { kind: "scripted-sequence"; steps: ReadonlyArray<BrainStep> };

export interface GoapPlan {
  /** Identifier of the brain that produced this plan (for tracing). */
  brainId: string;
  steps: ReadonlyArray<BrainStep>;
  /** When this plan was generated (sim seconds). */
  plannedAt: number;
}

export type Brain = (self: VerminSelf, world: BrainWorld, rng: { next(): number }) => GoapPlan;
