import type { Archetype } from "./_types";

export const rat: Readonly<Archetype> = Object.freeze({
  id: "rat",
  brain: "ground-swarm",
  locomotion: "ground",
  baseStats: { health: 6, speed: 220, contactDamage: 4, bounty: 30, headshotMultiplier: 2 },
  hitbox: { width: 36, height: 22, headOffset: { x: 12, y: -6 } },
  spriteAtlas: "vermin/rat",
  audio: { spawn: "vermin.rat.spawn", hit: "vermin.rat.hit", death: "vermin.rat.death" },
  isBoss: false,
});
