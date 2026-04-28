import type { Archetype } from "./_types";

export const goose: Readonly<Archetype> = Object.freeze({
  id: "goose",
  brain: "mixed-threat",
  locomotion: "mixed",
  baseStats: { health: 16, speed: 220, contactDamage: 7, bounty: 75, headshotMultiplier: 2.25 },
  hitbox: { width: 52, height: 60, headOffset: { x: 0, y: -22 } },
  spriteAtlas: "vermin/goose",
  audio: { spawn: "vermin.goose.spawn", hit: "vermin.goose.hit", death: "vermin.goose.death" },
  isBoss: false,
});
