import type { Brain, BrainStep } from "./_types";

/**
 * Street dog: barrels straight at the player, no jitter, no finesse.
 * Plan: brief telegraph wait → straight charge to player position.
 */
export const chargerBrain: Brain = (self, world, _rng) => {
  const speed = 130 + 50 * self.aggression;
  const steps: BrainStep[] = [
    { kind: "wait", durationS: 0.2 + self.reactionDelayS },
    { kind: "move-to", target: world.playerPosition, speed },
  ];
  return { brainId: "charger", steps, plannedAt: world.now };
};
