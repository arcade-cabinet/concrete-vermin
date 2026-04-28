import type { Brain, BrainStep } from "./_types";

/**
 * Roaches: climb the wall, scuttle along it, drop on the player.
 * Plan: climb-to wall edge → scuttle horizontally → drop straight down.
 */
export const wallClimberBrain: Brain = (self, world, _rng) => {
  const speed = 60 + 40 * self.aggression;
  const wallTop = world.zone.minY + 6;
  const dropX = world.playerPosition.x;

  const steps: BrainStep[] = [
    { kind: "climb-to", target: { x: self.position.x, y: wallTop }, speed: speed * 0.7 },
    { kind: "move-to", target: { x: dropX, y: wallTop }, speed },
    {
      kind: "dive-at",
      target: { x: world.playerPosition.x, y: world.playerPosition.y },
      speed: speed * 1.4,
    },
  ];
  return { brainId: "wall-climber", steps, plannedAt: world.now };
};
