import type { Brain, BrainStep } from "./_types";

/**
 * Sewer fish: stalk in shallow water, then a long horizontal lunge.
 * Plan: idle drift → wait → lunge horizontally toward player.
 */
export const lungerBrain: Brain = (self, world, rng) => {
  const speed = 70 + 50 * self.aggression;
  const drift = (rng.next() - 0.5) * 24 * self.jitter;

  const steps: BrainStep[] = [
    {
      kind: "move-to",
      target: { x: self.position.x + drift, y: world.zone.maxY - 4 },
      speed: speed * 0.5,
    },
    { kind: "wait", durationS: 0.5 + self.reactionDelayS },
    {
      kind: "lunge-at",
      target: { x: world.playerPosition.x, y: world.playerPosition.y },
      speed: speed * 2.2,
      durationS: 0.6,
    },
  ];
  return { brainId: "lunger", steps, plannedAt: world.now };
};
