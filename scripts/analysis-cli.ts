#!/usr/bin/env tsx
/**
 * Analysis CLI. Subcommands map to the directive's pnpm scripts:
 *
 *   pnpm analysis:smoke                  → smoke (5 runs/mission, median)
 *   pnpm analysis:benchmark              → benchmark --profile ci  (25 runs)
 *   pnpm analysis:focus --mission ID     → benchmark a single mission
 *   pnpm analysis:sweep --shape S ...    → sweep
 *   pnpm analysis:lock:quick             → lock recommendations
 *   pnpm analysis:autobalance            → propose nudges
 *
 * The CLI is read-only by default. autobalance prints the plan; it
 * never edits source files (that's a downstream tool's job).
 */

import { execFileSync } from "node:child_process";
import { argv, exit, stderr, stdout } from "node:process";
import {
  deriveLockRecommendations,
  GOVERNORS,
  type Governor,
  proposeAutobalance,
  runAllMissions,
  runSeededBenchmark,
  sweep,
  type SweepShape,
} from "../src/sim/analysis";
import { MISSIONS } from "../src/sim/content/missions";

const PROFILES = {
  smoke: { runs: 5, governors: ["median"] as const },
  ci: { runs: 25, governors: ["median", "trash"] as const },
  standard: { runs: 100, governors: ["perfect", "median", "trash"] as const },
  release: { runs: 500, governors: ["perfect", "median", "trash"] as const },
} as const;
type ProfileName = keyof typeof PROFILES;

function arg(name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  if (i < 0) return undefined;
  return argv[i + 1];
}

function seedsFor(count: number): number[] {
  // Deterministic seed sequence; same count → same seeds across runs.
  return Array.from({ length: count }, (_, i) => 1979_01_01 + i * 7);
}

function isWorkingTreeDirty(): boolean {
  try {
    // execFileSync (not exec) — argv array, no shell interpolation,
    // hard-coded args.
    const out = execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" });
    return out.trim().length > 0;
  } catch {
    // Not a git repo or git missing — be safe and assume dirty.
    return true;
  }
}

function cmdSmoke(): void {
  runProfile("smoke");
}

function cmdBenchmark(): void {
  const profile = (arg("profile") ?? "ci") as ProfileName;
  if (!(profile in PROFILES)) {
    stderr.write(`unknown profile: ${profile} (one of ${Object.keys(PROFILES).join(", ")})\n`);
    exit(2);
  }
  runProfile(profile);
}

function cmdFocus(): void {
  const missionId = arg("mission");
  if (!missionId) {
    stderr.write("--mission <id> required\n");
    exit(2);
  }
  const seeds = seedsFor(25);
  for (const g of GOVERNORS) {
    const s = runSeededBenchmark(missionId, seeds, g);
    stdout.write(formatSummary(s));
  }
}

function cmdSweep(): void {
  const shape = (arg("shape") ?? "weapon-damage") as SweepShape;
  const missionId = arg("mission") ?? MISSIONS[0]?.id;
  if (!missionId) throw new Error("no mission");
  const lo = Number.parseFloat(arg("lo") ?? "0.8");
  const hi = Number.parseFloat(arg("hi") ?? "1.2");
  const step = Number.parseFloat(arg("step") ?? "0.05");
  const result = sweep({
    shape,
    missionId,
    seeds: seedsFor(10),
    governor: "median",
    range: [lo, hi],
    step,
  });
  stdout.write(`# Sweep ${shape} on ${missionId} (median, ${result.steps.length} steps)\n`);
  for (const s of result.steps) {
    stdout.write(
      `  ${s.value.toFixed(3)}  clear=${(s.summary.clearRate * 100).toFixed(0)}%  acc=${s.summary.meanAccuracy.toFixed(2)}  dur=${s.summary.meanDurationS.toFixed(0)}s\n`,
    );
  }
}

function cmdLockQuick(): void {
  // Build a tiny rolling history by running a smoke profile three times.
  const seeds = seedsFor(5);
  const passA = MISSIONS.map((m) => runSeededBenchmark(m.id, seeds, "median"));
  const passB = MISSIONS.map((m) => runSeededBenchmark(m.id, seeds, "median"));
  const passC = MISSIONS.map((m) => runSeededBenchmark(m.id, seeds, "median"));
  const recs = deriveLockRecommendations([...passA, ...passB, ...passC]);
  stdout.write("# Lock recommendations (3-pass smoke)\n");
  for (const r of recs) {
    stdout.write(
      `  ${r.missionId}  ${r.state}  variance=${r.variance}  dominant=${r.dominantGrade ?? "-"}  n=${r.sampleSize}\n`,
    );
  }
}

function cmdAutobalance(): void {
  if (isWorkingTreeDirty()) {
    stderr.write("autobalance: refusing — working tree is dirty. Commit or stash first.\n");
    exit(1);
  }
  const seeds = seedsFor(25);
  let anyOutOfSpec = false;
  for (const m of MISSIONS) {
    const plan = proposeAutobalance({
      missionId: m.id,
      seeds,
      governor: "median",
    });
    if (!plan.inSpec) anyOutOfSpec = true;
    stdout.write(`# ${m.id}  ${plan.inSpec ? "IN SPEC" : "OUT OF SPEC"}\n`);
    for (const p of plan.proposals) {
      stdout.write(`    ${p.kind}  ${p.target}  ${p.from} → ${p.to}\n      reason: ${p.reason}\n`);
    }
  }
  exit(anyOutOfSpec ? 1 : 0);
}

function runProfile(profile: ProfileName): void {
  const cfg = PROFILES[profile];
  const seeds = seedsFor(cfg.runs);
  let anyFail = false;
  for (const g of cfg.governors as ReadonlyArray<Governor>) {
    stdout.write(`\n# Profile ${profile} · governor ${g} · ${cfg.runs} runs/mission\n`);
    const all = runAllMissions(seeds, g);
    for (const s of all) stdout.write(formatSummary(s));
    if (g === "median" && all.some((s) => s.clearRate < 0.4)) anyFail = true;
  }
  // Only the ci/standard/release profiles gate CI. smoke is a local
  // dev affordance — it always exits 0 even when missions are out of
  // spec, so devs can iterate without the harness breaking their flow.
  if (anyFail && profile !== "smoke") {
    stderr.write("\nFAIL: at least one mission missed the 40% median clear floor.\n");
    exit(1);
  }
}

function formatSummary(s: ReturnType<typeof runSeededBenchmark>): string {
  const top = (Object.entries(s.gradeHistogram) as [string, number][])
    .filter(([, c]) => c > 0)
    .map(([g, c]) => `${g}:${c}`)
    .join(" ");
  return `  ${s.missionId}  [${s.governor}]  clear=${(s.clearRate * 100).toFixed(0)}%  acc=${s.meanAccuracy.toFixed(2)}  dur=${s.meanDurationS.toFixed(0)}s  ${top}\n`;
}

const sub = argv[2];
switch (sub) {
  case "smoke":
    cmdSmoke();
    break;
  case "benchmark":
    cmdBenchmark();
    break;
  case "focus":
    cmdFocus();
    break;
  case "sweep":
    cmdSweep();
    break;
  case "lock:quick":
    cmdLockQuick();
    break;
  case "autobalance":
    cmdAutobalance();
    break;
  default:
    stderr.write(
      `Usage: tsx scripts/analysis-cli.ts <smoke|benchmark|focus|sweep|lock:quick|autobalance> [opts]\n`,
    );
    exit(2);
}
