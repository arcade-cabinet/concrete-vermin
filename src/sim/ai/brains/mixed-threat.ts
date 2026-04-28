import type { Brain, BrainStep } from "./_types";

/**
 * Goose: alternates between flying and ground charges.
 * Plan: pick mode by aggression — air-flank then dive, OR ground-charge
 * with honking pause.
 */
export const mixedThreatBrain: Brain = (self, world, rng) => {
  const speed = 100 + 40 * self.aggression;
  const useAir = rng.next() < self.aggression;

  if (useAir) {
    const cruiseY = world.zone.minY + 24;
    const flankX = world.zone.minX + rng.next() * (world.zone.maxX - world.zone.minX);
    const steps: BrainStep[] = [
      { kind: "climb-to", target: { x: flankX, y: cruiseY }, speed },
      { kind: "wait", durationS: 0.25 + self.reactionDelayS },
      { kind: "dive-at", target: world.playerPosition, speed: speed * 1.7 },
    ];
    return { brainId: "mixed-threat", steps, plannedAt: world.now };
  }
  const steps: BrainStep[] = [
    { kind: "wait", durationS: 0.4 + self.reactionDelayS },
    { kind: "lunge-at", target: world.playerPosition, speed: speed * 1.6, durationS: 0.5 },
    { kind: "wait", durationS: 0.3 },
    { kind: "lunge-at", target: world.playerPosition, speed: speed * 1.6, durationS: 0.5 },
  ];
  return { brainId: "mixed-threat", steps, plannedAt: world.now };
};
