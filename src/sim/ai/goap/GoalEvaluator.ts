import type { Goal } from "./Goal";

/**
 * GoalEvaluator returns a desirability score [0..1] for the goal it
 * represents, given the owner's current world snapshot. The Think
 * goal picks the highest-scoring evaluator each tick (or each
 * planning interval, depending on the brain's discipline).
 *
 * Pure-TS port of Yuka's GoalEvaluator. The `characterBias` lets
 * trait-driven brains skew their personality (aggressive vs cautious)
 * toward different goal families without rewriting evaluators.
 */
export interface GoalEvaluator<Owner, World> {
  readonly id: string;
  /** Multiplier applied to `calculateDesirability`; default 1. */
  characterBias: number;
  /** [0..1] — caller picks the highest score. */
  calculateDesirability(owner: Owner, world: World): number;
  /** Build the actual goal to enqueue when this evaluator wins. */
  setGoal(owner: Owner, world: World): Goal<Owner>;
}
