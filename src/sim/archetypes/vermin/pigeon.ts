import type { Archetype } from "./_types";

export const pigeon: Readonly<Archetype> = Object.freeze({
  id: "pigeon",
  brain: "erratic-flyer",
  locomotion: "flying",
  baseStats: { health: 5, speed: 260, contactDamage: 3, bounty: 35, headshotMultiplier: 2.5 },
  hitbox: { width: 32, height: 24, headOffset: { x: 0, y: -10 } },
  spriteAtlas: "vermin/pigeon",
  audio: { spawn: "vermin.pigeon.spawn", hit: "vermin.pigeon.hit", death: "vermin.pigeon.death" },
  isBoss: false,
});
