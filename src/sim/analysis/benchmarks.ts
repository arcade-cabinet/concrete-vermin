/**
 * Headless mission benchmark. Runs an abstract simulation: composes the
 * mission's encounters, walks the spawn schedule, applies a governor's
 * coefficients to compute kills/misses/damage-taken/duration, returns
 * a grade. No Pixi, no React, no DOM, no audio — purely arithmetic.
 *
 * The abstraction trades fidelity for speed: 1000 runs land in
 * milliseconds. Use it for "is this mission *roughly* in spec" gating;
 * use the real runner (src/runtime/runner.ts) for end-to-end checks.
 */

import { applyLoadout, MOD_REGISTRY, type WeaponMod } from "../archetypes/mods";
import { ARCHETYPES, type Archetype, type ArchetypeId } from "../archetypes/vermin";
import { WEAPON_REGISTRY } from "../archetypes/weapons";
import { getMission, MISSIONS } from "../content/missions";
import { VARIANTS } from "../content/variants";
import { composeEncounter, type Encounter } from "../factories/encounter";
import type { Mission } from "../factories/mission";
import { createRng } from "../rng";
import { getGovernor, type Governor, type GovernorProfile } from "./governors";
import { gradeFor, type Grade } from "./scoring";

export interface BenchmarkRun {
  missionId: string;
  governor: Governor;
  seed: number;
  cleared: boolean;
  durationS: number;
  shotsFired: number;
  shotsHit: number;
  accuracy: number;
  /** Kills / total spawned. */
  killRatio: number;
  livesLost: number;
  grade: Grade;
}

export interface BenchmarkSummary {
  missionId: string;
  governor: Governor;
  runs: number;
  clearRate: number;
  meanDurationS: number;
  meanAccuracy: number;
  /** Per-grade run count. */
  gradeHistogram: Readonly<Record<Grade, number>>;
}

const STARTING_LIVES = 3;

/**
 * Run a single deterministic benchmark: same (missionId, seed,
 * governor) → identical output. Always.
 */
export function runOnce(
  missionId: string,
  seed: number,
  governor: Governor,
  modIds: ReadonlyArray<string> = [],
): BenchmarkRun {
  const mission = getMission(missionId);
  const profile = getGovernor(governor);
  const rng = createRng(seed);
  const tuned = applyLoadout(WEAPON_REGISTRY[mission.weapon], resolveMods(modIds, mission));

  const encounters = mission.encounters.map((e) =>
    composeEncounter(e, rng.fork(`encounter:${e.id}`)),
  );

  let totalSpawned = 0;
  let kills = 0;
  let shotsFired = 0;
  let shotsHit = 0;
  let durationS = 0;
  let livesLost = 0;

  for (const enc of encounters) {
    const r = simulateEncounter(enc, mission, tuned, profile, rng.fork(`run:${enc.id}`));
    totalSpawned += r.spawned;
    kills += r.kills;
    shotsFired += r.shotsFired;
    shotsHit += r.shotsHit;
    durationS += r.durationS;
    livesLost += r.livesLost;
    if (livesLost >= STARTING_LIVES) break;
  }

  const cleared = kills >= totalSpawned && livesLost < STARTING_LIVES;
  const accuracy = shotsFired === 0 ? 0 : shotsHit / shotsFired;
  const survival = Math.max(0, (STARTING_LIVES - livesLost) / STARTING_LIVES);
  const grade = cleared ? gradeFor(accuracy, survival) : "F";
  const killRatio = totalSpawned === 0 ? 1 : kills / totalSpawned;

  return Object.freeze({
    missionId,
    governor,
    seed,
    cleared,
    durationS,
    shotsFired,
    shotsHit,
    accuracy,
    killRatio,
    livesLost,
    grade,
  });
}

/**
 * Run N seeded benchmarks and aggregate. The seed list is taken
 * verbatim — caller controls determinism.
 */
export function runSeededBenchmark(
  missionId: string,
  seeds: ReadonlyArray<number>,
  governor: Governor,
  modIds: ReadonlyArray<string> = [],
): BenchmarkSummary {
  const runs = seeds.map((s) => runOnce(missionId, s, governor, modIds));
  const cleared = runs.filter((r) => r.cleared).length;
  const meanDurationS = mean(runs.map((r) => r.durationS));
  const meanAccuracy = mean(runs.map((r) => r.accuracy));
  const histogram: Record<Grade, number> = {
    "S+": 0,
    S: 0,
    A: 0,
    B: 0,
    C: 0,
    D: 0,
    F: 0,
  };
  for (const r of runs) histogram[r.grade]++;
  return Object.freeze({
    missionId,
    governor,
    runs: runs.length,
    clearRate: runs.length === 0 ? 0 : cleared / runs.length,
    meanDurationS,
    meanAccuracy,
    gradeHistogram: Object.freeze(histogram),
  });
}

/** Convenience: run every mission against a governor with the same seed list. */
export function runAllMissions(
  seeds: ReadonlyArray<number>,
  governor: Governor,
): ReadonlyArray<BenchmarkSummary> {
  return MISSIONS.map((m) => runSeededBenchmark(m.id, seeds, governor));
}

interface EncounterResult {
  spawned: number;
  kills: number;
  shotsFired: number;
  shotsHit: number;
  durationS: number;
  livesLost: number;
}

/**
 * Player avoids contact damage for this many seconds per spawn before
 * the vermin closes the gap (covers reticle reaction + initial spawn
 * traverse). Tuned to keep median runs from being shredded by per-spawn
 * contact ticks at the moment the shot misses.
 */
const SPAWN_GRACE_S = 0.9;

/**
 * Damage the player can absorb before losing a life. The runner uses a
 * 3-life model with discrete contact bites; the abstract model
 * accumulates contactDamage and converts to whole lives.
 */
const HP_PER_LIFE = 100;

function effectiveDamagePerShot(tuned: ReturnType<typeof applyLoadout>): number {
  // Mods stack multiplicatively on top of base × pellets, matching the
  // damage resolver's behavior in src/sim/damage.ts.
  let dmg = tuned.base.damage * tuned.base.pellets;
  for (const m of tuned.damageMods) dmg *= m;
  return dmg;
}

function effectiveCritChance(tuned: ReturnType<typeof applyLoadout>): number {
  let crit = tuned.base.critChance;
  for (const c of tuned.critChanceMods) crit += c;
  return Math.min(1, crit);
}

function effectiveFireRate(
  tuned: ReturnType<typeof applyLoadout>,
  profile: GovernorProfile,
): number {
  // Reload cadence: every magSize shots costs reloadMs. Premature
  // reloads waste partial mags (probabilistic). Express as a sustained
  // shots-per-second.
  const shotsPerMag = Math.max(1, tuned.magSize);
  const reloadS =
    (tuned.reloadMs / 1000) *
    // Interrupted reloads (incomplete) effectively double-down on the
    // pause: model with reloadCompletion < 1 → longer mean reload.
    (2 - Math.max(0.5, profile.reloadCompletion));
  // Premature reloads cut the effective mag size.
  const effectiveMag = shotsPerMag * (1 - profile.prematureReloadProb * 0.5);
  const cycleS = effectiveMag / Math.max(0.001, tuned.base.fireRate) + reloadS;
  return effectiveMag / Math.max(0.001, cycleS);
}

function simulateEncounter(
  encounter: Encounter,
  _mission: Mission,
  tuned: ReturnType<typeof applyLoadout>,
  profile: GovernorProfile,
  rng: ReturnType<typeof createRng>,
): EncounterResult {
  let spawned = 0;
  let kills = 0;
  let shotsFired = 0;
  let shotsHit = 0;
  let damageAbsorbed = 0;
  let lastSpawnDelay = 0;
  let totalEngagementTimeS = 0;

  const damagePerShot = effectiveDamagePerShot(tuned);
  const critChance = effectiveCritChance(tuned);
  const sustainedFireRate = effectiveFireRate(tuned, profile);

  for (const sched of encounter.schedules) {
    const archetype = resolveArchetype(sched.variant);
    const headshotMul = archetype.baseStats.headshotMultiplier;

    // Expected damage per shot accounting for headshot lifts and crits.
    // headshotRate fraction of hits land on the head and apply weapon
    // headshotBonus + archetype headshotMultiplier; the rest are body.
    const headshotDmg = damagePerShot * (1 + tuned.headshotBonus) * headshotMul;
    const bodyDmg = damagePerShot;
    const expectedHitDmg =
      profile.headshotRate * headshotDmg + (1 - profile.headshotRate) * bodyDmg;
    const expectedShotDmg =
      // Crits multiply *intended* damage (headshot or body) by critMultiplier.
      expectedHitDmg * (1 + critChance * (tuned.base.critMultiplier - 1));

    const expectedShotsToKill = Math.max(1, archetype.baseStats.health / expectedShotDmg);

    for (const tick of sched.schedule) {
      spawned++;
      lastSpawnDelay = Math.max(lastSpawnDelay, tick.delayS);

      // Roll how many shots the player attempts before either killing
      // the target or running out of patience. Discrete shots simulated
      // as draws against `accuracy`; partial damage accumulates.
      let hpRemaining = archetype.baseStats.health;
      // Players keep firing on a wounded target. Generous budget — the
      // shooter only "gives up" if RNG produces a miss streak past 3×
      // expected. Bosses get a 4× cushion since they're long
      // engagements where players commit.
      const cushion = archetype.isBoss ? 4 : 3;
      const shotBudget = Math.max(
        4,
        Math.ceil((expectedShotsToKill * cushion) / Math.max(0.1, profile.accuracy)),
      );
      let shotsThisTarget = 0;
      let hitsThisTarget = 0;
      let killed = false;
      const panicShots = rng.next() < profile.panicShotProb ? 1 + Math.floor(rng.next() * 2) : 0;

      for (let i = 0; i < shotBudget; i++) {
        const hit = rng.next() < profile.accuracy;
        const headshot = hit && rng.next() < profile.headshotRate;
        const crit = hit && rng.next() < critChance;
        shotsThisTarget++;
        if (!hit) continue;
        hitsThisTarget++;
        const baseHit = headshot
          ? damagePerShot * (1 + tuned.headshotBonus) * headshotMul
          : damagePerShot;
        const dmg = crit ? baseHit * tuned.base.critMultiplier : baseHit;
        hpRemaining -= dmg;
        if (hpRemaining <= 0) {
          killed = true;
          break;
        }
      }

      shotsThisTarget += panicShots;
      shotsFired += shotsThisTarget;
      shotsHit += hitsThisTarget;

      // Per-target engagement window: time the player spent on this
      // target. Drives both encounter duration and exposure to contact
      // damage.
      const engagementS = profile.reactionS + shotsThisTarget / Math.max(0.001, sustainedFireRate);
      totalEngagementTimeS += engagementS;

      const isBoss = archetype.isBoss === true;

      if (isBoss) {
        // Boss attacks fire on a telegraphed cycle — every BOSS_TICK_S
        // seconds the boss commits an attack. The player either dodges
        // (governor accuracy proxy) or eats it. Decoupled from per-shot
        // engagement so a long boss fight doesn't accumulate continuous
        // contact damage.
        const BOSS_TICK_S = 6;
        const attackTicks = Math.floor(engagementS / BOSS_TICK_S);
        // Player dodge: median dodges 70% of telegraphs, perfect 95%,
        // trash 35%. Approximate from the governor accuracy field.
        const dodgeRate = Math.min(0.95, profile.accuracy * 0.95 + 0.05);
        const hitsTaken = Math.max(0, attackTicks * (1 - dodgeRate));
        damageAbsorbed += hitsTaken * archetype.baseStats.contactDamage;
        if (killed) kills++;
      } else if (killed) {
        kills++;
        // Survived contact: minimal exposure. If engagement drags past
        // the grace window, vermin started biting before death.
        const overrun = Math.max(0, engagementS - SPAWN_GRACE_S);
        damageAbsorbed += overrun * archetype.baseStats.contactDamage * 0.5;
      } else {
        // Survived: full contact exposure for a single sustained bite
        // cycle (~3 s).
        const exposureS = Math.min(3, engagementS);
        damageAbsorbed += exposureS * archetype.baseStats.contactDamage;
      }
    }
  }

  const livesLost = Math.floor(damageAbsorbed / HP_PER_LIFE);
  const durationS = lastSpawnDelay + totalEngagementTimeS;
  return { spawned, kills, shotsFired, shotsHit, durationS, livesLost };
}

/**
 * Map a mission's variant id to its underlying archetype. Mission specs
 * reference variants directly (e.g. `sewer-fish-radioactive`), and a
 * handful of boss missions reference the archetype id directly
 * (`boss-river-mutant`). Try both lookup paths in order. Variants
 * with health/aggression overrides apply a modest multiplier so the
 * benchmark sees the variant's true difficulty curve.
 */
function resolveArchetype(variantOrArchetype: string): Readonly<Archetype> {
  const variant = VARIANTS.get(variantOrArchetype);
  if (variant) {
    const base = ARCHETYPES[variant.archetype];
    return applyVariantTraits(base, variant.traits);
  }
  const direct = ARCHETYPES[variantOrArchetype as ArchetypeId];
  if (direct) return direct;
  return ARCHETYPES.rat;
}

function applyVariantTraits(
  base: Readonly<Archetype>,
  traits: { healthMod?: string; bodySize?: string; aggression?: string } | undefined,
): Readonly<Archetype> {
  if (!traits) return base;
  let healthMul = 1;
  let contactMul = 1;
  if (traits.healthMod === "tough") healthMul *= 1.5;
  if (traits.healthMod === "armored") {
    healthMul *= 2.0;
    contactMul *= 1.25;
  }
  if (traits.bodySize === "engorged") healthMul *= 1.3;
  if (traits.bodySize === "fat") healthMul *= 1.15;
  if (traits.aggression === "aggressive") contactMul *= 1.2;
  if (traits.aggression === "berserk") contactMul *= 1.5;
  if (healthMul === 1 && contactMul === 1) return base;
  return Object.freeze({
    ...base,
    baseStats: Object.freeze({
      ...base.baseStats,
      health: Math.max(1, Math.round(base.baseStats.health * healthMul)),
      contactDamage: Math.max(1, Math.round(base.baseStats.contactDamage * contactMul)),
    }),
  });
}

function mean(xs: ReadonlyArray<number>): number {
  if (xs.length === 0) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

function resolveMods(
  modIds: ReadonlyArray<string>,
  mission: Mission,
): ReadonlyArray<Readonly<WeaponMod>> {
  const out: WeaponMod[] = [];
  for (const id of modIds) {
    const mod = MOD_REGISTRY.get(id);
    if (!mod) continue;
    if (mod.compatibleWith.length > 0 && !mod.compatibleWith.includes(mission.weapon)) continue;
    out.push(mod);
  }
  return out;
}
