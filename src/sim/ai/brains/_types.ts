import type { ArchetypeId } from "../../archetypes/vermin";

export type Vec2 = Readonly<{ x: number; y: number }>;

export interface VerminSelf {
  spawnId: number;
  archetypeId: ArchetypeId;
  position: Vec2;
  velocity: Vec2;
  health: number;
  aggression: number;
  reactionDelayS: number;
  jitter: number;
}

export interface BrainWorld {
  playerPosition: Vec2;
  now: number;
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
  brainId: string;
  steps: ReadonlyArray<BrainStep>;
  plannedAt: number;
}

export type Brain = (self: VerminSelf, world: BrainWorld, rng: { next(): number }) => GoapPlan;
