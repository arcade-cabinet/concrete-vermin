import type { Archetype } from "./_types";

export const feralCat: Readonly<Archetype> = Object.freeze({
  id: "feral-cat",
  brain: "ambusher",
  locomotion: "ground",
  baseStats: { health: 10, speed: 240, contactDamage: 6, bounty: 55, headshotMultiplier: 2.5 },
  hitbox: { width: 48, height: 30, headOffset: { x: 14, y: -10 } },
  spriteAtlas: "vermin/feral-cat",
  audio: {
    spawn: "vermin.feralcat.spawn",
    hit: "vermin.feralcat.hit",
    death: "vermin.feralcat.death",
  },
  isBoss: false,
});
