import { trait } from "koota";
import type { GoapPlan } from "../sim/ai/brains";
import type { AIBrain as AIBrainEnum, ArchetypeId, Locomotion } from "../sim/archetypes/vermin";
import type { ProjectileType, TrailType } from "../sim/archetypes/weapons";
import type { EncounterPhase } from "../sim/engine/encounter-fsm";

/**
 * Koota trait declarations. Each trait is a flat-ish data record the
 * ECS lifts from sim factory output. Traits NEVER hold behavior — only
 * data. Behavior lives in src/ecs/systems/*.
 *
 * Traits are also the renderer/audio/UI's read interface: those layers
 * never reach into the sim, they query traits.
 *
 * Naming: every trait is a noun describing what an entity HAS, not
 * what it DOES. `Position`, not `Moving`.
 */

export const Position = trait({ x: 0, y: 0 });
export const Velocity = trait({ x: 0, y: 0 });

export const Health = trait({ current: 1, max: 1 });

export const Hitbox = trait({
  width: 8,
  height: 8,
  headOffsetX: 0,
  headOffsetY: 0,
});

export const SpriteRef = trait({ atlas: "" as string, frame: 0, scale: 1 });

export const AIBrain = trait({ id: "ground-swarm" as AIBrainEnum });

export interface AIPlanData {
  /** Most-recent plan emitted by the brain. Held by reference; never mutated. */
  plan: GoapPlan | null;
  /** Index of the current step within plan.steps. */
  stepIndex: number;
  /** When the current step started (sim seconds). */
  stepStartedAt: number;
}
export const AIPlan = trait((): AIPlanData => ({ plan: null, stepIndex: 0, stepStartedAt: 0 }));

export interface ProjectileData {
  ownerEntity: number;
  damage: number;
  headshotBonus: number;
  critChance: number;
  critMultiplier: number;
  armorPierce: number;
  damageMods: ReadonlyArray<number>;
  critChanceMods: ReadonlyArray<number>;
  rangeRemaining: number;
  projectileType: ProjectileType;
  trailType: TrailType;
}
export const Projectile = trait(
  (): ProjectileData => ({
    ownerEntity: 0,
    damage: 0,
    headshotBonus: 0,
    critChance: 0,
    critMultiplier: 1,
    armorPierce: 0,
    damageMods: [],
    critChanceMods: [],
    rangeRemaining: 0,
    projectileType: "bullet",
    trailType: "linear-tracer",
  }),
);

export const Collectible = trait({
  variantId: "" as string,
  graceBonusS: 0,
});

export const Lifecycle = trait({
  spawnedAt: 0,
  /** Nonzero when entity is queued for despawn (sim seconds). */
  deadAt: 0,
});

export interface TrailData {
  kind: TrailType;
  pointsX: ReadonlyArray<number>;
  pointsY: ReadonlyArray<number>;
  ttlS: number;
}
export const Trail = trait(
  (): TrailData => ({
    kind: "linear-tracer",
    pointsX: [],
    pointsY: [],
    ttlS: 0,
  }),
);

export const Splash = trait({
  variantId: "" as string,
  intensity: 1,
  ttlS: 0,
});

/** Singleton-pattern: one entity in the world holds the Score trait. */
export const Score = trait({
  total: 0,
  multiplier: 1,
  multiplierGraceUntil: 0,
  multiplierDecayAt: 0,
  noReloadStreak: 0,
});

/** Singleton: per-mission state. */
export const Mission = trait({
  id: "" as string,
  startedAt: 0,
  parScore: 0,
  parAccuracy: 0.7,
});

/** Per-encounter entity carrying the FSM snapshot. */
export const Encounter = trait({
  id: "" as string,
  phase: "WAITING_FOR_CAMERA" as EncounterPhase,
  remaining: 0,
  armingStartedAt: 0,
  activeStartedAt: 0,
  timeLimitS: 0,
  armingDurationS: 1,
});

/** Singleton: player + reticle state. */
export const Player = trait({
  reticleX: 0,
  reticleY: 0,
  weaponId: "shotgun" as string,
  ammoCurrent: 0,
  ammoMax: 0,
  livesRemaining: 3,
  damageTaken: 0,
});

/** Tag traits: zero-data markers. */
export const Vermin = trait({
  archetypeId: "rat" as ArchetypeId,
  isBoss: false,
  locomotion: "ground" as Locomotion,
});
