/**
 * Atomic GOAP goal. Pure-TS port of Yuka's `Goal` primitive minus the
 * Entity/Vehicle dependency. A Goal owns its lifecycle (`activate` →
 * `execute` repeatedly → `terminate`) and tracks status so the parent
 * (CompositeGoal or Think) can decide whether to advance, replan, or
 * stay the course.
 *
 * Goals are NOT pure functions — they carry status — but the *brain*
 * code that builds them is pure: brain `(self, world, rng) => Goal`.
 * The sim ticker re-evaluates goals each tick.
 */

export const GOAL_STATUS = {
  INACTIVE: "inactive",
  ACTIVE: "active",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export type GoalStatus = (typeof GOAL_STATUS)[keyof typeof GOAL_STATUS];

export interface GoalContext {
  /** Sim seconds since mission start. */
  now: number;
  /** Fixed timestep this tick. */
  dt: number;
}

export class Goal<Owner = unknown> {
  readonly owner: Owner;
  status: GoalStatus = GOAL_STATUS.INACTIVE;

  constructor(owner: Owner) {
    this.owner = owner;
  }

  activate(_ctx: GoalContext): void {
    this.status = GOAL_STATUS.ACTIVE;
  }

  execute(_ctx: GoalContext): void {
    // Subclass implements behavior; default is a no-op.
  }

  terminate(_ctx: GoalContext): void {
    // Subclass cleans up; default is a no-op.
  }

  handleMessage<M>(_msg: M): boolean {
    return false;
  }

  active(): boolean {
    return this.status === GOAL_STATUS.ACTIVE;
  }

  inactive(): boolean {
    return this.status === GOAL_STATUS.INACTIVE;
  }

  completed(): boolean {
    return this.status === GOAL_STATUS.COMPLETED;
  }

  failed(): boolean {
    return this.status === GOAL_STATUS.FAILED;
  }

  /**
   * Drive the goal forward by one tick. Activates if inactive,
   * executes if active. Returns the (possibly updated) status.
   */
  tick(ctx: GoalContext): GoalStatus {
    if (this.inactive()) this.activate(ctx);
    if (this.active()) this.execute(ctx);
    return this.status;
  }

  replanIfFailed(): boolean {
    return this.failed();
  }
}
