import type { Archetype } from "./_types";

export const bossDumpsterBear: Readonly<Archetype> = Object.freeze({
  id: "boss-dumpster-bear",
  brain: "boss-scripted",
  locomotion: "ground",
  baseStats: { health: 600, speed: 90, contactDamage: 25, bounty: 2500, headshotMultiplier: 1.5 },
  hitbox: { width: 180, height: 200, headOffset: { x: 60, y: -90 } },
  spriteAtlas: "vermin/boss-dumpster-bear",
  audio: {
    spawn: "vermin.bossbear.spawn",
    hit: "vermin.bossbear.hit",
    death: "vermin.bossbear.death",
    idle: "vermin.bossbear.idle",
  },
  isBoss: true,
});
