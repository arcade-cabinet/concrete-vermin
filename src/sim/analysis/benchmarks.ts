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
import { ARCHETYPES } from "../archetypes/vermin";
import { WEAPON_REGISTRY } from "../archetypes/weapons";
import { getMission, MISSIONS } from "../content/missions";
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
  let livesLost = 0;
  // Encounter duration: longest spawn delay + reaction + per-target
  // engagement time, derated by accuracy.
  let lastSpawnDelay = 0;
  let perTargetTimeAccum = 0;

  for (const sched of encounter.schedules) {
    const archetype =
      ARCHETYPES[sched.variant.split("-")[0] as keyof typeof ARCHETYPES] ?? ARCHETYPES.rat;
    const damagePerShot = tuned.base.damage * tuned.base.pellets;
    const baseShotsToKill = Math.max(1, Math.ceil(archetype.baseStats.health / damagePerShot));
    // Premature-reload tax: each premature reload wastes ~1 mag
    // duration; baked into per-target engagement time.
    const perTargetTime =
      profile.reactionS +
      (baseShotsToKill / Math.max(0.001, tuned.base.fireRate)) *
        (1 / Math.max(0.1, profile.accuracy));
    for (const tick of sched.schedule) {
      spawned++;
      lastSpawnDelay = Math.max(lastSpawnDelay, tick.delayS);
      // Player engagement: did the shot land?
      const intendedShots = baseShotsToKill;
      // Panic shots count as misses with no damage.
      const panicExtras = rng.next() < profile.panicShotProb ? 1 : 0;
      const totalShotsThisTarget = intendedShots + panicExtras;
      shotsFired += totalShotsThisTarget;
      const hits = Math.min(
        intendedShots,
        intendedShots * profile.accuracy + (rng.next() - 0.5) * 0.2,
      );
      const roundedHits = Math.max(0, Math.round(hits));
      shotsHit += roundedHits;
      const damageDealt = roundedHits * damagePerShot;
      const killed = damageDealt >= archetype.baseStats.health;
      if (killed) {
        kills++;
      } else {
        // Vermin survived → cost the player a contact-damage tick.
        // Assume one bite per surviving vermin.
        const remaining = archetype.baseStats.contactDamage;
        if (remaining > 0) livesLost += 1;
      }
      perTargetTimeAccum += perTargetTime;
    }
  }

  const durationS = lastSpawnDelay + perTargetTimeAccum;
  return { spawned, kills, shotsFired, shotsHit, durationS, livesLost };
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
