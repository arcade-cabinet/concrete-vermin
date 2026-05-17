import { GameRunner } from "../runtime/runner";
import { INITIAL_SNAPSHOT, useGameStore } from "../runtime/store";
import { WEAPON_REGISTRY } from "../sim/archetypes/weapons";
import type { Mission } from "../sim/factories/mission";
import { type GovernorProfile, PLAYTHROUGH, governorTick, makeGovernorState } from "./decide";

/**
 * Per-mission shooter position overrides for the headless playthrough harness.
 * Used when the default (240, 260) leaves ceiling-drop or pop-from-vent spawns
 * out of weapon range. The override positions the governor so all spawn zones
 * are reachable within the weapon's rangeMax.
 *
 * Missions with ONLY ground/surface spawns use the default position.
 * Missions mixing ground + ceiling spawns use y ≈ viewport centre (135).
 */
const MISSION_SHOOTER_OVERRIDES: Record<string, { x: number; y: number; playerLineY: number }> = {
  // Secret cellar: pop-from-vent roaches spawn at y≈210 then climb toward y≈10.
  // Must shoot them early (while still in sawed-off range 130) before they ascend.
  // playerLineY=135 scores roaches at y=210 above rats at y=250, forcing
  // the governor to target them immediately on spawn.
  "streets-secret-cellar": { x: 240, y: 260, playerLineY: 135 },

  // River mutant: flamethrower origin is (240, 246). Boss-scripted at y=135;
  // surface-from-grate fish at y≈256. Both are within flamethrower rangeMax=180.
  // Raise shooterPos to y=135 so the lead-point calculation for the boss
  // (which moves around y=135) stays close to the actual projectile origin,
  // reducing overshoot-gate misses. playerLineY=135 weights the boss as the
  // top threat the moment encounter-2 starts.
  "underworld-07-river-mutant": { x: 240, y: 135, playerLineY: 135 },
};

/**
 * Per-mission profile overrides. Applied on top of PLAYTHROUGH defaults.
 * Use sparingly — only when the mission's weapon mechanics require a
 * different timing budget (e.g. flamethrower's high fire-rate).
 */
const MISSION_PROFILE_OVERRIDES: Partial<Record<string, Partial<GovernorProfile>>> = {
  // Flamethrower fires at 24 Hz (≈41.7 ms/shot). The default shotCooldownMs=80
  // throttles the governor to ~12.5 Hz — halving DPS against the 4224 HP armored
  // boss. Drop to 0 so the governor queues shots at the weapon's maximum cadence
  // (magSize=80 empties in ~1.33s, then 2400ms reload → 21 effective shots/sec).
  "underworld-07-river-mutant": { shotCooldownMs: 0 },
};

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

export function playMissionWithGovernor(
  mission: Readonly<Mission>,
  opts: PlaythroughOpts = {},
): PlaythroughResult {
  const profileOverride = MISSION_PROFILE_OVERRIDES[mission.id];
  // Caller-supplied profile (e.g. STRESS) still gets the per-mission overlay
  // applied — those overrides exist because of mission-specific weapon
  // mechanics (flamethrower fire-rate, etc.), and the caller's tap-vs-charge
  // toggle shouldn't undo them.
  const profileBase = opts.profile ?? PLAYTHROUGH;
  const profile = profileOverride ? { ...profileBase, ...profileOverride } : profileBase;
  const maxSimSeconds = opts.maxSimSeconds ?? 180;
  const override = MISSION_SHOOTER_OVERRIDES[mission.id];
  const defaultPos = { x: 240, y: 260 };
  const shooterPos = opts.shooterPos ?? override ?? defaultPos;
  const playerLineY = opts.playerLineY ?? override?.playerLineY ?? 270;
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
    governorTick({ runner, weapon, profile, playerLineY, shooterPos, state });
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
