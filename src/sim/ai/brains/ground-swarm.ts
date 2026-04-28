import type { Brain, BrainStep } from "./_types";

/**
 * Rats: low-to-the-ground, swarm toward the player in a noisy line.
 * Plan: jitter approach in 2-3 hops, then lunge.
 */
export const groundSwarmBrain: Brain = (self, world, rng) => {
  const dx = world.playerPosition.x - self.position.x;
  const dirX = dx >= 0 ? 1 : -1;
  const speed = 80 + 20 * self.aggression;
  const jitterY = (rng.next() - 0.5) * 30 * self.jitter;

  const stepX = self.position.x + dirX * Math.max(40, Math.abs(dx) / 2);
  const steps: BrainStep[] = [
    { kind: "wait", durationS: self.reactionDelayS },
    { kind: "move-to", target: { x: stepX, y: world.zone.maxY - 8 + jitterY }, speed },
    { kind: "lunge-at", target: world.playerPosition, speed: speed * 1.5, durationS: 0.4 },
  ];
  return { brainId: "ground-swarm", steps, plannedAt: world.now };
};
