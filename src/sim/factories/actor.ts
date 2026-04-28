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

export interface VerminSpawnRecord {
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

/**
 * The ONLY allowed path to construct a vermin spawn record.
 * Pre-edit hooks + CI grep gates block any other call site.
 *
 * @param archetypeId — the species class
 * @param overrides   — partial traits layered on top of DEFAULT_TRAITS
 * @param rng         — owning encounter's rng (or a forked stream).
 *                      Two draws are consumed: one for spawnId, one
 *                      mixed with the seed via hashSeed for uniqueness.
 *                      No module-global state, so concurrent missions
 *                      and replays produce identical ids per seed.
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

  // Pure-from-rng spawn id. Two draws → 32-bit-ish unsigned id via hashSeed.
  // No module global; concurrent missions and replays from the same seed
  // produce identical ids in the same call order.
  const a = Math.floor(rng.next() * 0xffffffff);
  const b = Math.floor(rng.next() * 0xffffffff);
  const spawnId = hashSeed(a, b);

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
