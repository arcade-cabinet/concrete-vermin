import type { Brain, BrainStep } from "./_types";

export const chargerBrain: Brain = (self, world, _rng) => {
  const speed = 130 + 50 * self.aggression;
  const steps: BrainStep[] = [
    { kind: "wait", durationS: 0.2 + self.reactionDelayS },
    { kind: "move-to", target: { x: world.playerPosition.x, y: world.playerPosition.y }, speed },
  ];
  return { brainId: "charger", steps, plannedAt: world.now };
};
