import { GOAL_STATUS, Goal, type GoalContext, type GoalStatus } from "./Goal";

export class CompositeGoal<Owner = unknown> extends Goal<Owner> {
  readonly subgoals: Goal<Owner>[] = [];

  addSubgoal(goal: Goal<Owner>): this {
    this.subgoals.unshift(goal);
    return this;
  }

  clearSubgoals(ctx: GoalContext): void {
    for (const sg of this.subgoals) {
      sg.terminate(ctx);
    }
    this.subgoals.length = 0;
  }

  removeAllSubgoals(ctx: GoalContext): void {
    this.clearSubgoals(ctx);
  }

  hasSubgoals(): boolean {
    return this.subgoals.length > 0;
  }

  currentSubgoal(): Goal<Owner> | null {
    return this.subgoals[0] ?? null;
  }

  /**
   * Pop completed/failed subgoals off the front, then tick the next
   * one. Returns the resulting status of the head subgoal — the
   * concrete composite decides how to interpret it (replan, escalate
   * to parent, etc.).
   */
  executeSubgoals(ctx: GoalContext): GoalStatus {
    while (this.subgoals[0]?.completed()) {
      const done = this.subgoals.shift();
      done?.terminate(ctx);
    }
    const head = this.subgoals[0];
    if (!head) return GOAL_STATUS.COMPLETED;
    return head.tick(ctx);
  }

  /**
   * Default execute drives the subgoal stack and lifts the head's
   * status onto the composite. Subclasses (Think, boss scripts) may
   * override to reinterpret COMPLETED as "replan" rather than "done."
   */
  override execute(ctx: GoalContext): void {
    this.status = this.executeSubgoals(ctx);
  }

  override terminate(ctx: GoalContext): void {
    this.clearSubgoals(ctx);
  }

  override handleMessage<M>(msg: M): boolean {
    const head = this.subgoals[0];
    return head ? head.handleMessage(msg) : false;
  }
}
