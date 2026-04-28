import type { Brain, BrainStep } from "./_types";

export const popUpBrain: Brain = (self, world, rng) => {
  const exposure = 0.6 + 0.6 * (1 - self.aggression);
  const popY = world.zone.maxY - 12;
  const popOut: BrainStep = {
    kind: "pop-out",
    from: { x: self.position.x, y: popY + 12 },
    to: { x: self.position.x, y: popY },
    durationS: 0.25,
  };
  const steps: BrainStep[] = [popOut, { kind: "wait", durationS: exposure }];
  if (rng.next() < self.aggression) {
    steps.push({
      kind: "lunge-at",
      target: { x: world.playerPosition.x, y: world.playerPosition.y },
      speed: 120,
      durationS: 0.4,
    });
  } else {
    steps.push({
      kind: "flee-to",
      target: { x: self.position.x, y: popY + 16 },
      speed: 90,
    });
  }
  return { brainId: "pop-up", steps, plannedAt: world.now };
};
