import { GameRunner } from "../runtime/runner";
import { INITIAL_SNAPSHOT, useGameStore } from "../runtime/store";
import { WEAPON_REGISTRY } from "../sim/archetypes/weapons";
import type { Mission } from "../sim/factories/mission";
import {
  type GovernorProfile,
  PLAYTHROUGH,
  governorTick,
  makeGovernorState,
} from "./decide";

export interface PlaythroughResult {
  outcome: "won" | "lost" | "timeout";
  ticks: number;
  simSeconds: number;
  shotsFired: number;
  reloads: number;
  killCount: number;
  scoreTotal: number;
  livesRemaining: number;
}

export interface PlaythroughOpts {
  /** Wall-clock budget in sim-seconds. Default 180s (a generous mission). */
  maxSimSeconds?: number;
  profile?: GovernorProfile;
  /** Sim coords the governor "stands at." Default (240, 260) — center, low. */
  shooterPos?: { x: number; y: number };
  /** Y of the player line for threat scoring. Default 270 (viewport bottom). */
  playerLineY?: number;
  /** Optional seed override forwarded to GameRunner. */
  seed?: number;
}

/**
 * Headless playthrough: constructs a real GameRunner for the mission,
 * drives runner.step(1/60) in a loop, and calls governorTick() every
 * frame to issue queueShot/queueReload via the SAME public methods
 * GameStage uses. Returns when the runner reports "won" or "lost", or
 * when the wall-clock budget is exhausted.
 *
 * Pure node-environment — no React, no Pixi. The runner publishes its
 * snapshot to useGameStore on every step; governorTick reads from there.
 */
export function playMissionWithGovernor(
  mission: Readonly<Mission>,
  opts: PlaythroughOpts = {},
): PlaythroughResult {
  const profile = opts.profile ?? PLAYTHROUGH;
  const maxSimSeconds = opts.maxSimSeconds ?? 180;
  const shooterPos = opts.shooterPos ?? { x: 240, y: 260 };
  const playerLineY = opts.playerLineY ?? 270;
  const weapon = WEAPON_REGISTRY[mission.weapon];

  // Reset the global store so each playthrough starts from a clean
  // snapshot — without this the previous mission's `phase: "won"` leaks
  // into the new run and the loop exits on tick 1.
  useGameStore.setState({
    ...INITIAL_SNAPSHOT,
    player: { ammoCurrent: 0, ammoMax: 0, livesRemaining: 0 },
  });

  const runner = new GameRunner(mission, [], opts.seed);
  const state = makeGovernorState();

  const dt = 1 / 60;
  const maxTicks = Math.ceil(maxSimSeconds / dt);
  let ticks = 0;
  let shotsFired = 0;
  let reloads = 0;

  // Wrap runner.queue* so we can count without scraping logs.
  const realQueueShot = runner.queueShot.bind(runner);
  const realQueueReload = runner.queueReload.bind(runner);
  runner.queueShot = (x: number, y: number) => {
    shotsFired++;
    realQueueShot(x, y);
  };
  runner.queueReload = () => {
    reloads++;
    realQueueReload();
  };

  while (ticks < maxTicks) {
    runner.step(dt);
    governorTick({ runner, weapon, profile, playerLineY, shooterPos, state });
    ticks++;
    const phase = useGameStore.getState().phase;
    if (phase === "won" || phase === "lost") {
      const snap = useGameStore.getState();
      return {
        outcome: phase,
        ticks,
        simSeconds: ticks * dt,
        shotsFired,
        reloads,
        killCount: snap.killCount,
        scoreTotal: snap.score.total,
        livesRemaining: snap.player.livesRemaining,
      };
    }
  }

  const snap = useGameStore.getState();
  return {
    outcome: "timeout",
    ticks,
    simSeconds: ticks * dt,
    shotsFired,
    reloads,
    killCount: snap.killCount,
    scoreTotal: snap.score.total,
    livesRemaining: snap.player.livesRemaining,
  };
}

export function gradeFromScore(score: number): "S+" | "S" | "A" | "B" | "C" | "D" {
  if (score >= 5000) return "S+";
  if (score >= 3000) return "S";
  if (score >= 1500) return "A";
  if (score >= 800) return "B";
  if (score >= 300) return "C";
  return "D";
}
