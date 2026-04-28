import type { Brain, BrainStep } from "./_types";

/**
 * Seagulls: line up high, then commit to a single steep dive.
 * Plan: climb-to perch above player → wait → dive-at player.
 */
export const diveBomberBrain: Brain = (self, world, _rng) => {
  const speed = 110 + 30 * self.aggression;
  const perchY = world.zone.minY + 12;

  const steps: BrainStep[] = [
    { kind: "climb-to", target: { x: world.playerPosition.x, y: perchY }, speed },
    { kind: "wait", durationS: 0.3 + self.reactionDelayS },
    { kind: "dive-at", target: world.playerPosition, speed: speed * 1.8 },
  ];
  return { brainId: "dive-bomber", steps, plannedAt: world.now };
};
