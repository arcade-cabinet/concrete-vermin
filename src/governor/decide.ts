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
  useChargeShot?: boolean;
}

export const PLAYTHROUGH: GovernorProfile = {
  predictionFactor: 1,
  reticleMaxSpeed: 600,
  shotCooldownMs: 80,
  hitToleranceUnits: 12,
  useChargeShot: false,
};

export const STRESS: GovernorProfile = {
  ...PLAYTHROUGH,
  useChargeShot: true,
};

export interface GovernorState {
  lastShotAtMs: number;
  reloadQueued: boolean;
  chargeStartedAtMs: number | null;
}

export function makeGovernorState(): GovernorState {
  return { lastShotAtMs: -Infinity, reloadQueued: false, chargeStartedAtMs: null };
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

// zone.maxX/2=240, zone.maxY-24=246 — center of player hitbox at ground level.
const DEFAULT_PLAYER_ORIGIN = { x: 240, y: 246 };

// Speed cap above which a stationary-AOE charge effect (napalm-pool) is
// counterproductive — the target out-walks the pool before the DoT pays
// for the charge-time. Tap-fire is strictly better above this threshold.
const NAPALM_TARGET_SPEED_MAX = 30; // sim units / sec
// Health cap above which boss-class targets out-tank an arc-repeater's
// 3 rapid arcs vs sustained tap from a charged-up mag. Bosses ≥150 HP
// are better killed by tap; below that, the burst clears trash quickly.
const ARC_REPEATER_TARGET_HEALTH_MAX = 150;

function shouldCharge(
  weapon: WeaponArchetype,
  target: { vx: number; vy: number; maxHealth: number; archetypeId: string },
  snap: ReturnType<typeof useGameStore.getState>,
): boolean {
  const profile = weapon.chargeProfile;
  if (!profile) return false;
  // Don't engage charge until ammo is at least the cost — otherwise we
  // burn the whine + 80% wait for a tap-fallback.
  if (snap.player.ammoCurrent < profile.shellsConsumed) return false;

  const isBoss = target.archetypeId.startsWith("boss-");
  const targetSpeed = Math.hypot(target.vx, target.vy);
  switch (profile.effect) {
    case "napalm-pool":
      // Stationary pool can't catch a moving boss; sustained tap wins.
      if (isBoss) return false;
      return targetSpeed <= NAPALM_TARGET_SPEED_MAX;
    case "arc-repeater":
      // Three rapid arcs lose to sustained tap on heavy bosses.
      return target.maxHealth <= ARC_REPEATER_TARGET_HEALTH_MAX;
    default:
      return true;
  }
}

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

  const tolerance = snap.reticleRadius + profile.hitToleranceUnits;
  const leadOvershoot = Math.hypot(leadOnly.x - target.x, leadOnly.y - target.y);

  const aim = applyOffset(leadOnly, headOffset);

  if (leadOvershoot <= tolerance) {
    if (profile.useChargeShot && weapon.chargeProfile && shouldCharge(weapon, target, snap)) {
      const chargeProgress = snap.chargeProgress;
      if (chargeProgress === null && state.chargeStartedAtMs === null) {
        runner.queueChargeStart();
        state.chargeStartedAtMs = nowMs;
        return;
      }
      if (chargeProgress !== null && chargeProgress >= 0.8) {
        runner.queueChargeRelease(aim.x, aim.y);
        state.chargeStartedAtMs = null;
        state.lastShotAtMs = nowMs;
        return;
      }
      return;
    }

    // No charge — but if we were charging and the target moved out of
    // the charge-eligible window, release the held charge so the whine
    // doesn't loop forever and the shells aren't burned by the
    // shouldCharge guard's gate flip.
    if (state.chargeStartedAtMs !== null) {
      runner.queueChargeRelease(aim.x, aim.y);
      state.chargeStartedAtMs = null;
      state.lastShotAtMs = nowMs;
      return;
    }

    runner.queueShot(aim.x, aim.y);
    state.lastShotAtMs = nowMs;
    return;
  }

  // Velocity lead overshoots: take the certain body-center shot rather than skipping.
  const fallback = applyOffset({ x: target.x, y: target.y }, headOffset);
  // Don't interrupt a charge mid-build — wait for release condition on next in-tolerance tick.
  if (profile.useChargeShot && weapon.chargeProfile && state.chargeStartedAtMs !== null) {
    return;
  }
  runner.queueShot(fallback.x, fallback.y);
  state.lastShotAtMs = nowMs;
}
