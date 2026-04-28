import { useTick } from "@pixi/react";
import { useRef } from "react";
import type { GameRunner } from "../runtime/runner";
import { useGameStore } from "../runtime/store";
import type { WeaponArchetype } from "../sim/archetypes/weapons/_types";
import { selectHighestThreat } from "./threat";
import { leadPoint } from "./yuka-adapters";

export interface GovernorProfile {
  /**
   * Yuka prediction-factor multiplier on lookahead. 1 = canonical Reynolds.
   * Profiles tune this per playthrough difficulty.
   */
  predictionFactor: number;
  /**
   * Per-weapon "reticle max travel speed" in sim-units/sec. The reticle
   * snaps, so this is purely a knob on Yuka's lookahead formula.
   */
  reticleMaxSpeed: number;
  /**
   * Minimum ms between consecutive queueShot calls. Floors to weapon
   * fireRate; higher values simulate a slower player.
   */
  shotCooldownMs: number;
  /**
   * Hit-radius slack — how close (in sim units) the lead point needs
   * to be to the target's current position before we commit to the shot.
   * Larger = governor fires more aggressively.
   */
  hitToleranceUnits: number;
}

export const PLAYTHROUGH: GovernorProfile = {
  predictionFactor: 1,
  reticleMaxSpeed: 600,
  shotCooldownMs: 120,
  hitToleranceUnits: 6,
};

export interface GovernorLoopProps {
  runner: GameRunner | null;
  weapon: WeaponArchetype;
  enabled: boolean;
  profile?: GovernorProfile;
  /**
   * Where the player "stands" in sim coords. Threat scoring weights
   * vermin closer to this Y as more urgent. Pass viewport.height.
   */
  playerLineY: number;
  /**
   * Where shots originate from in sim coords. Pursuit lookahead scales
   * with displacement from this point.
   */
  shooterPos: { x: number; y: number };
}

/**
 * Headless React component that drives the same queueShot/queueReload
 * methods GameStage uses. Mounted as a sibling of <Loop> inside
 * <Application>; reads useGameStore for player-visible state, picks
 * the highest-threat vermin, leads it via Yuka pursuit math, fires
 * when the lead point is within hit tolerance.
 *
 * Returns null — no DOM, no Pixi nodes.
 */
export function GovernorLoop({
  runner,
  weapon,
  enabled,
  profile = PLAYTHROUGH,
  playerLineY,
  shooterPos,
}: GovernorLoopProps): null {
  const lastShotAtRef = useRef<number>(-Infinity);

  useTick(() => {
    if (!enabled || !runner) return;
    const state = useGameStore.getState();
    const nowMs = state.now * 1000;

    if (state.player.ammoCurrent <= 0 && state.reloadProgress === null) {
      runner.queueReload();
      return;
    }
    if (state.reloadProgress !== null) return;
    if (nowMs - lastShotAtRef.current < profile.shotCooldownMs) return;

    const target = selectHighestThreat(state.vermin, weapon.damage, { playerLineY });
    if (!target) return;

    const aim = leadPoint(shooterPos, target, {
      reticleMaxSpeed: profile.reticleMaxSpeed,
      predictionFactor: profile.predictionFactor,
    });

    // Hit gate: lead point must be within reticle radius (+ tolerance)
    // of the target's CURRENT position. If the lead is too far ahead the
    // reticle would snap past — skip this tick and let the target close.
    const dx = aim.x - target.x;
    const dy = aim.y - target.y;
    const overshoot = Math.hypot(dx, dy);
    if (overshoot > weapon.reticleRadius + profile.hitToleranceUnits) return;

    runner.queueShot(aim.x, aim.y);
    lastShotAtRef.current = nowMs;
  });

  return null;
}
