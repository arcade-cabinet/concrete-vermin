import type { Brain, BrainStep } from "./_types";

/**
 * Pigeons: erratic mid-air orbit, jitter heavy, dive at random.
 * Plan: 2-3 wobbly waypoints + a chance to dive on aggression roll.
 */
export const erraticFlyerBrain: Brain = (self, world, rng) => {
  const speed = 90 + 30 * self.aggression;
  const cruiseY = world.zone.minY + 30;
  const span = world.zone.maxX - world.zone.minX;

  const wobble = (): BrainStep => ({
    kind: "move-to",
    target: {
      x: world.zone.minX + rng.next() * span,
      y: cruiseY + (rng.next() - 0.5) * 40 * self.jitter,
    },
    speed,
  });

  const steps: BrainStep[] = [{ kind: "wait", durationS: self.reactionDelayS }, wobble(), wobble()];

  // ~aggression chance to dive on the player after the wobble.
  if (rng.next() < self.aggression) {
    steps.push({ kind: "dive-at", target: world.playerPosition, speed: speed * 1.6 });
  } else {
    steps.push(wobble());
  }
  return { brainId: "erratic-flyer", steps, plannedAt: world.now };
};
