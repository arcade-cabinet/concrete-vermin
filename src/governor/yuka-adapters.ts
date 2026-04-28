export interface Kinematic {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface LeadOptions {
  /**
   * Reticle "max travel speed" in sim-units/sec. The governor snaps the
   * reticle so this isn't a physical constraint — it's a knob on Yuka's
   * Reynolds lookahead formula: `time = distance / (selfSpeed + targetSpeed)`.
   * Higher → less lead. Tuned per weapon (slow shotgun pellets lead more
   * than instant tesla arcs).
   */
  reticleMaxSpeed: number;
  /**
   * Multiplier on the computed lookahead. 1 = canonical Reynolds.
   * Default 1.
   */
  predictionFactor?: number;
}

/**
 * Where to aim to hit a moving target.
 *
 * Lifted directly from Yuka's PursuitBehavior (~/src/reference-codebases/yuka
 * /src/steering/behaviors/PursuitBehavior.js:88-94): lookahead scales with
 * distance and inversely with the sum of the two speeds. We extrapolate the
 * target along its current velocity by that lookahead.
 *
 * Implemented inline rather than instantiating a Yuka Vehicle per tick
 * because (a) building Vector3 + Vehicle + MovingEntity per shot is wasteful
 * when the math is four lines, and (b) keeps this layer trivially testable
 * without a Yuka world fixture. Yuka itself stays installed for the Goal /
 * Think / CompositeGoal classes used by GovernorLoop.
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
  const lookAhead = (distance / (opts.reticleMaxSpeed + targetSpeed)) * predictionFactor;
  return {
    x: target.x + target.vx * lookAhead,
    y: target.y + target.vy * lookAhead,
  };
}

/**
 * Vertical distance from a point to the horizontal player line. The player
 * line is the y-coordinate the player "stands at" in the side-on view; any
 * vermin reaching it deals damage. Threat scoring uses this to weight
 * "about to bite you" higher than "still walking in."
 */
export function distanceToPlayerLine(
  point: { x: number; y: number },
  playerLineY: number,
): number {
  return Math.abs(point.y - playerLineY);
}
