import { CompositeGoal } from "./CompositeGoal";
import { GOAL_STATUS, type GoalContext, type GoalStatus } from "./Goal";
import type { GoalEvaluator } from "./GoalEvaluator";

/**
 * Top-level brain goal. Holds the evaluator pool, picks the highest-
 * desirability evaluator on `arbitrate()`, and replaces its current
 * subgoal with the winner's goal.
 *
 * Yuka's `Think` minus the entity coupling. The `arbitrationCadenceS`
 * controls how often the evaluator pool is re-polled — too aggressive
 * and the brain flips constantly; too lazy and it commits to bad
 * plans for too long. 0.25s is a reasonable default for vermin.
 */
export class Think<Owner, World> extends CompositeGoal<Owner> {
  readonly evaluators: GoalEvaluator<Owner, World>[] = [];
  arbitrationCadenceS = 0.25;
  lastArbitrationAt = -Infinity;

  addEvaluator(ev: GoalEvaluator<Owner, World>): this {
    this.evaluators.push(ev);
    return this;
  }

  /**
   * Pick the highest-scoring evaluator and install its goal as the
   * sole subgoal. Returns the picked evaluator's id (useful for
   * tracing/telemetry). If no evaluator scores >0, leaves subgoals
   * untouched and returns null.
   */
  arbitrate(world: World, ctx: GoalContext): string | null {
    let best: GoalEvaluator<Owner, World> | null = null;
    let bestScore = 0;
    for (const ev of this.evaluators) {
      const s = ev.characterBias * ev.calculateDesirability(this.owner, world);
      if (s > bestScore) {
        bestScore = s;
        best = ev;
      }
    }
    if (!best) return null;
    this.lastArbitrationAt = ctx.now;
    this.removeAllSubgoals(ctx);
    this.addSubgoal(best.setGoal(this.owner, world));
    return best.id;
  }

  /**
   * Per-tick driver. Re-arbitrates if the cadence has elapsed (or if
   * we have no current subgoal), then ticks the active subgoal. Keeps
   * `this.status` in sync with the executed subgoal so callers reading
   * `think.completed()` / `.failed()` see the truth.
   */
  override tick(ctx: GoalContext): GoalStatus {
    this.status = this.executeSubgoals(ctx);
    return this.status;
  }

  /**
   * Convenience for brains: arbitrate-if-due then tick subgoals in
   * one call. The world snapshot is passed because evaluators need it.
   *
   * A top-level Think is intentionally persistent: when its subgoal
   * completes or fails, we strip the subgoal stack and force ACTIVE
   * so the next tick re-arbitrates rather than the parent treating
   * Think itself as "done."
   */
  step(world: World, ctx: GoalContext): GoalStatus {
    const due = ctx.now - this.lastArbitrationAt >= this.arbitrationCadenceS;
    if (due || !this.hasSubgoals()) this.arbitrate(world, ctx);
    if (this.inactive()) this.activate(ctx);
    const headStatus = this.executeSubgoals(ctx);
    if (headStatus === GOAL_STATUS.COMPLETED || headStatus === GOAL_STATUS.FAILED) {
      this.removeAllSubgoals(ctx);
      this.status = GOAL_STATUS.ACTIVE;
    } else {
      this.status = headStatus;
    }
    return this.status;
  }
}
