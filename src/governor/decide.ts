import type { GameRunner } from "../runtime/runner";
import { useGameStore } from "../runtime/store";
import { ARCHETYPES, type ArchetypeId } from "../sim/archetypes/vermin";
import type { WeaponArchetype } from "../sim/archetypes/weapons/_types";
import { selectHighestThreat } from "./threat";
import { leadPoint } from "./yuka-adapters";

function applyOffset(
  pos: { x: number; y: number },
  offset?: { x: number; y: number },
): { x: number; y: number } {
  return { x: pos.x + (offset?.x ?? 0), y: pos.y + (offset?.y ?? 0) };
}

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
  /**
   * Actual projectile origin in sim coords. Defaults to the fixed player
   * position (zone.maxX/2, zone.maxY-24) = (240, 246). Used to pre-filter
   * out-of-range targets so the governor doesn't waste shots on vermin that
   * the projectile can't reach given the weapon's rangeMax.
   */
  playerOrigin?: { x: number; y: number };
}

/**
 * One decision step. Mutates `state` in place. The playthrough harness
 * calls this in a loop; the React GovernorLoop wraps it in useTick.
 * Reads useGameStore.getState() — the store is the source of truth for
 * what the player can see, so the governor reads from there too.
 */
// Default player origin: zone.maxX/2=240, zone.maxY-24=246.
const DEFAULT_PLAYER_ORIGIN = { x: 240, y: 246 };

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

  // Pre-filter vermin that are beyond weapon range from the actual player
  // origin. Shots fired at out-of-range targets die in flight and waste
  // ammo, especially for short-range weapons (sawed-off rangeMax=130).
  const origin = input.playerOrigin ?? DEFAULT_PLAYER_ORIGIN;
  const reachable = snap.vermin.filter(
    (v) => Math.hypot(v.x - origin.x, v.y - origin.y) <= weapon.rangeMax,
  );

  const target = selectHighestThreat(reachable, weapon.damage, { playerLineY });
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
  const aim = applyOffset(leadOnly, headOffset);

  if (leadOvershoot <= tolerance) {
    runner.queueShot(aim.x, aim.y);
    state.lastShotAtMs = nowMs;
    return;
  }

  // Fallback: body-center + head offset (no velocity lead).
  // Fires when the target is moving fast enough that the velocity lead
  // overshoots — we take the certain body-center shot rather than skipping.
  const fallback = applyOffset({ x: target.x, y: target.y }, headOffset);
  runner.queueShot(fallback.x, fallback.y);
  state.lastShotAtMs = nowMs;
}
