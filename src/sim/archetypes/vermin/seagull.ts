import type { Archetype } from "./_types";

export const seagull: Readonly<Archetype> = Object.freeze({
  id: "seagull",
  brain: "dive-bomber",
  locomotion: "flying",
  baseStats: { health: 7, speed: 320, contactDamage: 5, bounty: 50, headshotMultiplier: 3 },
  hitbox: { width: 44, height: 28, headOffset: { x: 0, y: -12 } },
  spriteAtlas: "vermin/seagull",
  audio: {
    spawn: "vermin.seagull.spawn",
    hit: "vermin.seagull.hit",
    death: "vermin.seagull.death",
  },
  isBoss: false,
});
