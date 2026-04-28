/**
 * Analysis stack — the offline benchmark + balance subsystem.
 *
 * The stack is sim-pure: zero imports from React, Pixi, Tone, or
 * Capacitor. CLI entry is in cli.ts (run via `pnpm tsx`).
 */

export {
  proposeAutobalance,
  type AutobalancePlan,
  type AutobalanceOptions,
  type Proposal,
  type ProposalKind,
} from "./autobalance";
export {
  runAllMissions,
  runOnce,
  runSeededBenchmark,
  type BenchmarkRun,
  type BenchmarkSummary,
} from "./benchmarks";
export { estimateVariantDrift, estimateWeaponEffect, type EffectEstimate } from "./effects";
export { getGovernor, GOVERNORS, type Governor, type GovernorProfile } from "./governors";
export {
  deriveLockRecommendations,
  type LockRecommendation,
  type LockState,
} from "./locking";
export { gradeAtLeast, gradeFor, GRADES, medianGrade, type Grade } from "./scoring";
export {
  sweep,
  type SweepOptions,
  type SweepResult,
  type SweepShape,
  type SweepStep,
} from "./sweeps";
export {
  getThreshold,
  MISSION_THRESHOLDS,
  type MissionThreshold,
} from "./thresholds";
