import type { World } from "koota";
import { type BrainStep, type BrainWorld, getBrain, type VerminSelf } from "../../sim/ai/brains";
import type { Rng } from "../../sim/rng";
import {
  AIBrain,
  AIPlan,
  Health,
  Hitbox,
  Lifecycle,
  Player,
  Position,
  Velocity,
  Vermin,
} from "../traits";

/** Active step's instantaneous velocity vector + step bookkeeping. */
function stepDriver(
  step: BrainStep,
  self: { x: number; y: number },
): { vx: number; vy: number; finished: boolean } {
  switch (step.kind) {
    case "wait":
      return { vx: 0, vy: 0, finished: false };
    case "move-to":
    case "lunge-at":
    case "dive-at":
    case "climb-to":
    case "flee-to": {
      const dx = step.target.x - self.x;
      const dy = step.target.y - self.y;
      const d = Math.hypot(dx, dy);
      const speed = "speed" in step ? step.speed : 80;
      if (d < 4) return { vx: 0, vy: 0, finished: true };
      return { vx: (dx / d) * speed, vy: (dy / d) * speed, finished: false };
    }
    case "pop-out":
      return {
        vx: (step.to.x - self.x) / step.durationS,
        vy: (step.to.y - self.y) / step.durationS,
        finished: false,
      };
    case "scripted-sequence":
      return { vx: 0, vy: 0, finished: false };
  }
}

/**
 * AI system: re-plans every vermin's brain on cadence, then drives
 * Velocity from the current step. Each vermin gets its own forked rng.
 */
export function aiSystem(
  world: World,
  rng: Rng,
  now: number,
  zone: Readonly<{ minX: number; maxX: number; minY: number; maxY: number }>,
): void {
  // Locate the player position (singleton).
  let playerPos = { x: zone.maxX / 2, y: zone.maxY - 24 };
  for (const e of world.query(Player, Position)) {
    const p = e.get(Position);
    if (p) playerPos = { x: p.x, y: p.y };
    break;
  }
  // Player.reticle drives "where vermin think the player is" if Position
  // isn't on the player; for now reticle position == player position.

  const brainWorld: BrainWorld = { playerPosition: playerPos, now, zone };
  const STEP_DURATION_S = 0.6; // step timeout if not finished

  for (const e of world.query(
    Vermin,
    Position,
    Velocity,
    AIBrain,
    AIPlan,
    Lifecycle,
    Hitbox,
    Health,
  )) {
    const l = e.get(Lifecycle);
    const h = e.get(Health);
    if (!l || !h || l.deadAt > 0 || h.current <= 0) continue;

    const pos = e.get(Position)!;
    const traits = e.get(Vermin)!;
    const brainId = e.get(AIBrain)!.id;
    const plan = e.get(AIPlan)!;
    const brain = getBrain(brainId);

    // Re-plan if no plan yet, or current plan exhausted.
    if (!brain) continue;
    let active = plan.plan;
    let stepIdx = plan.stepIndex;
    let stepStart = plan.stepStartedAt;
    if (!active || stepIdx >= active.steps.length) {
      const self: VerminSelf = {
        spawnId: e.id(),
        archetypeId: traits.archetypeId,
        position: pos,
        velocity: { x: 0, y: 0 },
        health: h.current,
        aggression: 0.5,
        reactionDelayS: 0.2,
        jitter: 0.3,
      };
      const childRng = rng.fork(`brain:${e.id()}`);
      active = brain(self, brainWorld, childRng);
      stepIdx = 0;
      stepStart = now;
    }
    const step = active.steps[stepIdx];
    if (!step) continue;
    const drive = stepDriver(step, pos);
    e.set(Velocity, { x: drive.vx, y: drive.vy });

    // Advance step on completion or timeout.
    const elapsed = now - stepStart;
    // dive-at needs enough time to cross the full viewport height at the
    // step's speed (zone height 270 ÷ min speed 56 ≈ 4.8s). Using the
    // fixed 0.6s cap caused ceiling-drop roaches to abort their dive
    // before entering weapon range, leaving them perpetually unreachable.
    const diveAtCap =
      "speed" in step && step.speed > 0
        ? (zone.maxY - zone.minY) / step.speed + 0.5
        : STEP_DURATION_S;
    const stepCap =
      step.kind === "wait"
        ? step.durationS
        : step.kind === "lunge-at"
          ? step.durationS
          : step.kind === "pop-out"
            ? step.durationS
            : step.kind === "dive-at"
              ? diveAtCap
              : STEP_DURATION_S;
    if (drive.finished || elapsed >= stepCap) {
      e.set(AIPlan, { plan: active, stepIndex: stepIdx + 1, stepStartedAt: now });
    } else {
      e.set(AIPlan, { plan: active, stepIndex: stepIdx, stepStartedAt: stepStart });
    }
  }
}
