import { createWorld, type World } from "koota";
import { createRng, type Rng } from "../sim/rng";
import {
  AIBrain,
  AIPlan,
  Collectible,
  Encounter,
  Health,
  Hitbox,
  Lifecycle,
  Mission,
  Player,
  Position,
  Projectile,
  Score,
  Splash,
  SpriteRef,
  Trail,
  Velocity,
  Vermin,
} from "./traits";

/**
 * Game-world bootstrap. Creates a Koota world, attaches the master rng
 * (forked per system at tick time), and spawns the singleton entities
 * the rest of the engine reads from: Player, Score, Mission.
 *
 * Pure-construction: identical seeds produce identical empty-world
 * snapshots. The mission ticker is what introduces stimulus.
 */

export interface GameWorld {
  world: World;
  rng: Rng;
  /** Singleton entity ids — cached to avoid re-querying every frame. */
  playerEntity: number;
  scoreEntity: number;
  missionEntity: number;
}

/**
 * All trait declarations registered by the world. Useful for tests +
 * for asserting registration completeness in CI.
 */
export const ALL_TRAITS = Object.freeze([
  Position,
  Velocity,
  Health,
  Hitbox,
  SpriteRef,
  AIBrain,
  AIPlan,
  Projectile,
  Collectible,
  Lifecycle,
  Trail,
  Splash,
  Score,
  Mission,
  Encounter,
  Player,
  Vermin,
]);

export function createGameWorld(seed: number): GameWorld {
  const world = createWorld();
  const rng = createRng(seed);

  // Singletons. Spawn order is part of the determinism contract — never
  // reorder these without bumping the seed-compat version.
  const playerEntity = world.spawn(Player).id();
  const scoreEntity = world.spawn(Score).id();
  const missionEntity = world.spawn(Mission).id();

  return { world, rng, playerEntity, scoreEntity, missionEntity };
}
