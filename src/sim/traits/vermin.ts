import { clamp } from "../_shared/math";

/**
 * Vermin trait taxonomy. Pure data + pure functions.
 *
 * Traits are composable modifiers applied on top of an Archetype's base
 * stats and AI brain config. They never carry behavior on their own —
 * `applyTraitsToStats` and `tuneAIForTraits` are the only translation
 * surfaces, so balance changes have a single audit point.
 */

export type FurColor = "mangy-brown" | "oil-black" | "piebald" | "albino" | "soot-grey" | "rust";
export type EyeGlow = "none" | "red" | "amber" | "sickly-green";
export type BodySize = "runt" | "normal" | "fat" | "engorged";
export type TailLength = "stub" | "normal" | "whiplash";
export type AntennaSize = "none" | "short" | "waving" | "massive";
export type SpeedMod = "sluggish" | "normal" | "scuttling" | "panicked";
export type HealthMod = "fragile" | "normal" | "tough" | "armored";
export type Aggression = "skittish" | "curious" | "aggressive" | "berserk";
export type Affliction = "none" | "rabid" | "radioactive" | "cybernetic";

export interface VerminTraitSet {
  furColor: FurColor;
  eyeGlow: EyeGlow;
  bodySize: BodySize;
  tailLength: TailLength;
  antennaSize: AntennaSize;
  speedMod: SpeedMod;
  healthMod: HealthMod;
  aggression: Aggression;
  affliction: Affliction;
}

export const DEFAULT_TRAITS: VerminTraitSet = Object.freeze({
  furColor: "mangy-brown",
  eyeGlow: "none",
  bodySize: "normal",
  tailLength: "normal",
  antennaSize: "none",
  speedMod: "normal",
  healthMod: "normal",
  aggression: "curious",
  affliction: "none",
});

export interface VerminBaseStats {
  health: number;
  speed: number;
  contactDamage: number;
  bounty: number;
  headshotMultiplier: number;
}

export interface AIConfig {
  /** Aggression curve [0..1], 1 = berserk. */
  aggression: number;
  /** Reaction delay in seconds. */
  reactionDelayS: number;
  /** Movement noise amplitude (0..1). */
  jitter: number;
  /** Affliction-specific ability flag. */
  ability: "none" | "rabid-aoe" | "toxic-puddle" | "spark-shield";
}

export const BASE_AI_CONFIG: AIConfig = Object.freeze({
  aggression: 0.5,
  reactionDelayS: 0.25,
  jitter: 0.1,
  ability: "none",
});

const SIZE_HEALTH: Record<BodySize, number> = {
  runt: 0.6,
  normal: 1,
  fat: 1.4,
  engorged: 2.2,
};

const SIZE_SPEED: Record<BodySize, number> = {
  runt: 1.15,
  normal: 1,
  fat: 0.85,
  engorged: 0.65,
};

const SIZE_DAMAGE: Record<BodySize, number> = {
  runt: 0.7,
  normal: 1,
  fat: 1.25,
  engorged: 1.5,
};

const SPEED_MULT: Record<SpeedMod, number> = {
  sluggish: 0.6,
  normal: 1,
  scuttling: 1.35,
  panicked: 1.7,
};

const HEALTH_MULT: Record<HealthMod, number> = {
  fragile: 0.6,
  normal: 1,
  tough: 1.6,
  armored: 2.4,
};

const HEADSHOT_BY_AFFLICTION: Record<Affliction, number> = {
  none: 1,
  rabid: 1.1,
  radioactive: 0.9,
  cybernetic: 0.7,
};

const BOUNTY_BY_AFFLICTION: Record<Affliction, number> = {
  none: 1,
  rabid: 1.5,
  radioactive: 1.75,
  cybernetic: 2.5,
};

const TAIL_HITBOX_DAMAGE: Record<TailLength, number> = {
  stub: 1,
  normal: 1,
  whiplash: 1.1,
};

export function applyTraitsToStats(base: VerminBaseStats, traits: VerminTraitSet): VerminBaseStats {
  const sizeHealth = SIZE_HEALTH[traits.bodySize];
  const sizeSpeed = SIZE_SPEED[traits.bodySize];
  const sizeDamage = SIZE_DAMAGE[traits.bodySize];
  const speedMul = SPEED_MULT[traits.speedMod];
  const healthMul = HEALTH_MULT[traits.healthMod];
  const headshotAffl = HEADSHOT_BY_AFFLICTION[traits.affliction];
  const bountyAffl = BOUNTY_BY_AFFLICTION[traits.affliction];
  const tailDamage = TAIL_HITBOX_DAMAGE[traits.tailLength];

  const cyberHealth = traits.affliction === "cybernetic" ? 2 : 1;
  const rabidSpeed = traits.affliction === "rabid" ? 1.5 : 1;

  return {
    health: Math.max(1, Math.round(base.health * sizeHealth * healthMul * cyberHealth)),
    speed: clamp(base.speed * sizeSpeed * speedMul * rabidSpeed, 10, 1200),
    contactDamage: Math.max(1, Math.round(base.contactDamage * sizeDamage * tailDamage)),
    bounty: Math.max(1, Math.round(base.bounty * bountyAffl)),
    headshotMultiplier: clamp(base.headshotMultiplier * headshotAffl, 1, 8),
  };
}

const AGGRESSION_LEVEL: Record<Aggression, number> = {
  skittish: 0.15,
  curious: 0.4,
  aggressive: 0.75,
  berserk: 1,
};

const REACTION_BY_AGGRESSION: Record<Aggression, number> = {
  skittish: 0.45,
  curious: 0.3,
  aggressive: 0.18,
  berserk: 0.08,
};

const JITTER_BY_SPEED: Record<SpeedMod, number> = {
  sluggish: 0.05,
  normal: 0.1,
  scuttling: 0.2,
  panicked: 0.4,
};

const ABILITY_BY_AFFLICTION: Record<Affliction, AIConfig["ability"]> = {
  none: "none",
  rabid: "rabid-aoe",
  radioactive: "toxic-puddle",
  cybernetic: "spark-shield",
};

export function tuneAIForTraits(base: AIConfig, traits: VerminTraitSet): AIConfig {
  // Layer trait adjustments onto the caller's base config rather than
  // recomputing absolutes — archetype-level brain tuning (e.g. a boss
  // with longer reaction delay) must survive trait composition.
  const aggression = clamp(
    base.aggression * 0.25 + AGGRESSION_LEVEL[traits.aggression] * 0.75,
    0,
    1,
  );
  const traitReactionMul =
    REACTION_BY_AGGRESSION[traits.aggression] / REACTION_BY_AGGRESSION.curious;
  const reactionDelayS = clamp(
    base.reactionDelayS * traitReactionMul * (traits.affliction === "rabid" ? 0.7 : 1),
    0.05,
    1,
  );
  const traitJitterMul = JITTER_BY_SPEED[traits.speedMod] / JITTER_BY_SPEED.normal;
  const jitter = clamp(base.jitter * traitJitterMul, 0, 1);
  // Affliction overrides ability when present; otherwise inherit base.
  const ability =
    traits.affliction === "none" ? base.ability : ABILITY_BY_AFFLICTION[traits.affliction];
  return { aggression, reactionDelayS, jitter, ability };
}

export function mergeTraits(
  base: VerminTraitSet,
  override: Partial<VerminTraitSet>,
): VerminTraitSet {
  return { ...base, ...override };
}
