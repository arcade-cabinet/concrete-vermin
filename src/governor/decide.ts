import type { GameRunner } from "../runtime/runner";
import { useGameStore } from "../runtime/store";
import type { WeaponArchetype } from "../sim/archetypes/weapons/_types";
import { selectHighestThreat } from "./threat";
import { leadPoint } from "./yuka-adapters";

export interface GovernorProfile {
  predictionFactor: number;   // 1 = canonical Reynolds; <1 dampens lookahead
  reticleMaxSpeed: number;    // sim-units/sec; reticle snaps, knob only
  shotCooldownMs: number;     // gap between consecutive queueShot calls
  hitToleranceUnits: number;  // slack on lead-vs-current overshoot gate
}

export const PLAYTHROUGH: GovernorProfile = {
  predictionFactor: 1,
  reticleMaxSpeed: 600,
  shotCooldownMs: 120,
  hitToleranceUnits: 6,
};

export interface GovernorState {
  lastShotAtMs: number;
  reloadQueued: boolean;
}

export function makeGovernorState(): GovernorState {
  return { lastShotAtMs: -Infinity, reloadQueued: false };
}

export interface GovernorTickInput {
  runner: GameRunner;
  weapon: WeaponArchetype;
  profile: GovernorProfile;
  playerLineY: number;
  shooterPos: { x: number; y: number };
  state: GovernorState;
}

/**
 * One decision step. Mutates `state` in place. The playthrough harness
 * calls this in a loop; the React GovernorLoop wraps it in useTick.
 * Reads useGameStore.getState() — the store is the source of truth for
 * what the player can see, so the governor reads from there too.
 */
export function governorTick(input: GovernorTickInput): void {
  const { runner, weapon, profile, playerLineY, shooterPos, state } = input;
  const snap = useGameStore.getState();
  const nowMs = snap.now * 1000;

  if (snap.reloadProgress !== null) {
    state.reloadQueued = false;
    return;
  }

  if (snap.player.ammoCurrent <= 0) {
    if (!state.reloadQueued) {
      runner.queueReload();
      state.reloadQueued = true;
    }
    return;
  }

  if (nowMs - state.lastShotAtMs < profile.shotCooldownMs) return;

  const target = selectHighestThreat(snap.vermin, weapon.damage, { playerLineY });
  if (!target) return;

  const aim = leadPoint(shooterPos, target, {
    reticleMaxSpeed: profile.reticleMaxSpeed,
    predictionFactor: profile.predictionFactor,
  });

  const overshoot = Math.hypot(aim.x - target.x, aim.y - target.y);
  if (overshoot > weapon.reticleRadius + profile.hitToleranceUnits) return;

  runner.queueShot(aim.x, aim.y);
  state.lastShotAtMs = nowMs;
}
