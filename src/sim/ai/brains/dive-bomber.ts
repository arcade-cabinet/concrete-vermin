import type { Brain, BrainStep } from "./_types";

export const diveBomberBrain: Brain = (self, world, _rng) => {
  const speed = 110 + 30 * self.aggression;
  const perchY = world.zone.minY + 12;

  const steps: BrainStep[] = [
    { kind: "climb-to", target: { x: world.playerPosition.x, y: perchY }, speed },
    { kind: "wait", durationS: 0.3 + self.reactionDelayS },
    {
      kind: "dive-at",
      target: { x: world.playerPosition.x, y: world.playerPosition.y },
      speed: speed * 1.8,
    },
  ];
  return { brainId: "dive-bomber", steps, plannedAt: world.now };
};
