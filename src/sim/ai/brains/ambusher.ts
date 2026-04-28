import type { Brain, BrainStep } from "./_types";

export const ambusherBrain: Brain = (self, world, _rng) => {
  const speed = 100 + 40 * self.aggression;

  const steps: BrainStep[] = [
    { kind: "wait", durationS: 0.8 + self.reactionDelayS },
    {
      kind: "lunge-at",
      target: { x: world.playerPosition.x, y: world.playerPosition.y },
      speed: speed * 2.5,
      durationS: 0.5,
    },
  ];
  return { brainId: "ambusher", steps, plannedAt: world.now };
};
