import type { Goal } from "./Goal";

export interface GoalEvaluator<Owner, World> {
  readonly id: string;
  characterBias: number;
  calculateDesirability(owner: Owner, world: World): number;
  setGoal(owner: Owner, world: World): Goal<Owner>;
}
