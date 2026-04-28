import { type AIBrain, ARCHETYPES, type ArchetypeId, type Locomotion } from "../archetypes/vermin";
import { hashSeed, type Rng } from "../rng";
import {
  type AIConfig,
  applyTraitsToStats,
  BASE_AI_CONFIG,
  DEFAULT_TRAITS,
  mergeTraits,
  tuneAIForTraits,
  type VerminBaseStats,
  type VerminTraitSet,
} from "../traits";

/**
 * Plain-data record produced by the factory. The ECS bridge lifts this into
 * Koota traits; the renderer reads sprite/atlas/locomotion to pick draw
 * paths; the audio layer reads the sfxIds. Sim never spawns vermin any
 * other way — see STANDARDS.md §6 (factory pyramid).
 */
export interface VerminSpawnRecord {
  /** Stable per-spawn id derived from the rng seed + counter. */
  spawnId: number;
  archetypeId: ArchetypeId;
  brain: AIBrain;
  locomotion: Locomotion;
  isBoss: boolean;
  traits: Readonly<VerminTraitSet>;
  stats: Readonly<VerminBaseStats>;
  ai: Readonly<AIConfig>;
  hitbox: Readonly<{
    width: number;
    height: number;
    headOffset: { x: number; y: number };
  }>;
  spriteAtlas: string;
  audio: Readonly<{ spawn: string; hit: string; death: string; idle?: string | undefined }>;
}

/** Module-local counter so successive spawns from the same rng have unique ids. */
let SPAWN_SEQUENCE = 0;

/**
 * The ONLY allowed path to construct a vermin spawn record.
 * Pre-edit hooks + CI grep gates block any other call site.
 *
 * @param archetypeId — the species class
 * @param overrides   — partial traits layered on top of DEFAULT_TRAITS
 * @param rng         — owning encounter's rng (or a forked stream)
 */
export function composeVermin(
  archetypeId: ArchetypeId,
  overrides: Partial<VerminTraitSet>,
  rng: Rng,
): VerminSpawnRecord {
  const archetype = ARCHETYPES[archetypeId];
  if (!archetype) throw new Error(`composeVermin: unknown archetype "${archetypeId}"`);

  const traits = Object.freeze(mergeTraits(DEFAULT_TRAITS, overrides));
  const stats = Object.freeze(applyTraitsToStats(archetype.baseStats, traits));
  const ai = Object.freeze(tuneAIForTraits(BASE_AI_CONFIG, traits));

  // Derive a per-spawn id from rng + counter — deterministic given seed.
  const sample = Math.floor(rng.next() * 0xffffffff);
  const spawnId = hashSeed(sample, ++SPAWN_SEQUENCE);

  return {
    spawnId,
    archetypeId,
    brain: archetype.brain,
    locomotion: archetype.locomotion,
    isBoss: archetype.isBoss,
    traits,
    stats,
    ai,
    hitbox: archetype.hitbox,
    spriteAtlas: archetype.spriteAtlas,
    audio: archetype.audio,
  };
}

/** Test/dev helper: reset the module sequence so deterministic tests are
 *  reproducible regardless of side-effects in earlier tests. Not exported
 *  from the package barrel. */
export function _resetSpawnSequence(): void {
  SPAWN_SEQUENCE = 0;
}
