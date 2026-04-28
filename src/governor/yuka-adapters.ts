export interface Kinematic {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface LeadOptions {
  reticleMaxSpeed: number;
  predictionFactor?: number;
  /** If provided, added to the returned point so the governor aims at the head zone. */
  headOffset?: { x: number; y: number };
}

/**
 * Lifted inline from Yuka's PursuitBehavior (lookahead = displacement /
 * (selfSpeed + targetSpeed)) instead of instantiating a Yuka Vehicle per
 * call: the math is four lines and a per-tick Vehicle build is wasteful.
 * Yuka stays installed for Goal/Think used by GovernorLoop.
 */
export function leadPoint(
  shooter: { x: number; y: number },
  target: Kinematic,
  opts: LeadOptions,
): { x: number; y: number } {
  const predictionFactor = opts.predictionFactor ?? 1;
  const dx = target.x - shooter.x;
  const dy = target.y - shooter.y;
  const distance = Math.hypot(dx, dy);
  const targetSpeed = Math.hypot(target.vx, target.vy);
  // Floor so an "instant" weapon profile (reticleMaxSpeed = 0) against a
  // stationary target yields the target's current position, not NaN.
  const sumSpeed = Math.max(Number.EPSILON, opts.reticleMaxSpeed + targetSpeed);
  const lookAhead = (distance / sumSpeed) * predictionFactor;
  return {
    x: target.x + target.vx * lookAhead + (opts.headOffset?.x ?? 0),
    y: target.y + target.vy * lookAhead + (opts.headOffset?.y ?? 0),
  };
}
