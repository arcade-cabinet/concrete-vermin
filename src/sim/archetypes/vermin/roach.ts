import type { Archetype } from "./_types";

export const roach: Readonly<Archetype> = Object.freeze({
  id: "roach",
  brain: "wall-climber",
  locomotion: "wall",
  baseStats: { health: 3, speed: 280, contactDamage: 2, bounty: 20, headshotMultiplier: 1.5 },
  hitbox: { width: 24, height: 16, headOffset: { x: 8, y: -4 } },
  spriteAtlas: "vermin/roach",
  audio: { spawn: "vermin.roach.spawn", hit: "vermin.roach.hit", death: "vermin.roach.death" },
  isBoss: false,
});
