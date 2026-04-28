import type { Archetype } from "./_types";

export const bossPigeonKing: Readonly<Archetype> = Object.freeze({
  id: "boss-pigeon-king",
  brain: "boss-scripted",
  locomotion: "flying",
  baseStats: { health: 1000, speed: 200, contactDamage: 35, bounty: 5000, headshotMultiplier: 1.5 },
  hitbox: { width: 240, height: 180, headOffset: { x: 0, y: -80 } },
  spriteAtlas: "vermin/boss-pigeon-king",
  audio: {
    spawn: "vermin.bosspigeon.spawn",
    hit: "vermin.bosspigeon.hit",
    death: "vermin.bosspigeon.death",
    idle: "vermin.bosspigeon.idle",
  },
  isBoss: true,
});
