import type { Archetype } from "./_types";

export const raccoon: Readonly<Archetype> = Object.freeze({
  id: "raccoon",
  brain: "lunger",
  locomotion: "ground",
  baseStats: { health: 14, speed: 180, contactDamage: 8, bounty: 70, headshotMultiplier: 2 },
  hitbox: { width: 56, height: 38, headOffset: { x: 18, y: -12 } },
  spriteAtlas: "vermin/raccoon",
  audio: {
    spawn: "vermin.raccoon.spawn",
    hit: "vermin.raccoon.hit",
    death: "vermin.raccoon.death",
  },
  isBoss: false,
});
