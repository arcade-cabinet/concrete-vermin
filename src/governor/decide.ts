import type { GameRunner } from "../runtime/runner";
import { useGameStore } from "../runtime/store";
import { ARCHETYPES, type ArchetypeId } from "../sim/archetypes/vermin";
import type { WeaponArchetype } from "../sim/archetypes/weapons/_types";
import { selectHighestThreat } from "./threat";
import { leadPoint } from "./yuka-adapters";

export interface GovernorProfile {
  predictionFactor: number; // 1 = canonical Reynolds; <1 dampens lookahead
  reticleMaxSpeed: number; // sim-units/sec; reticle snaps, knob only
  shotCooldownMs: number; // gap between consecutive queueShot calls
  hitToleranceUnits: number; // slack on lead-vs-current overshoot gate
}

export const PLAYTHROUGH: GovernorProfile = {
  predictionFactor: 1,
  reticleMaxSpeed: 600,
  shotCooldownMs: 80,
  hitToleranceUnits: 12,
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

  const archetype = ARCHETYPES[target.archetypeId as ArchetypeId];
  const headOffset = archetype?.hitbox.headOffset;

  // Lead point without head offset — used only for the overshoot gate.
  // The gate checks whether velocity lead lands inside the target hitbox,
  // independent of the head offset (which is a fixed anatomical shift, not
  // a prediction error).
  const leadOnly = leadPoint(shooterPos, target, {
    reticleMaxSpeed: profile.reticleMaxSpeed,
    predictionFactor: profile.predictionFactor,
  });

  const tolerance = weapon.reticleRadius + profile.hitToleranceUnits;
  const leadOvershoot = Math.hypot(leadOnly.x - target.x, leadOnly.y - target.y);

  // Aim point: lead + head offset (aim at head zone for headshot bonus).
  const aimX = leadOnly.x + (headOffset?.x ?? 0);
  const aimY = leadOnly.y + (headOffset?.y ?? 0);

  if (leadOvershoot <= tolerance) {
    runner.queueShot(aimX, aimY);
    state.lastShotAtMs = nowMs;
    return;
  }

  // Fallback: body-center + head offset (no velocity lead).
  // Fires when the target is moving fast enough that the velocity lead
  // overshoots — we take the certain body-center shot rather than skipping.
  const fallbackX = target.x + (headOffset?.x ?? 0);
  const fallbackY = target.y + (headOffset?.y ?? 0);
  runner.queueShot(fallbackX, fallbackY);
  state.lastShotAtMs = nowMs;
}
