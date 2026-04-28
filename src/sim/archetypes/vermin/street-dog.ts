import type { Archetype } from "./_types";

export const streetDog: Readonly<Archetype> = Object.freeze({
  id: "street-dog",
  brain: "charger",
  locomotion: "ground",
  baseStats: { health: 18, speed: 270, contactDamage: 9, bounty: 80, headshotMultiplier: 2 },
  hitbox: { width: 60, height: 42, headOffset: { x: 22, y: -14 } },
  spriteAtlas: "vermin/street-dog",
  audio: {
    spawn: "vermin.streetdog.spawn",
    hit: "vermin.streetdog.hit",
    death: "vermin.streetdog.death",
  },
  isBoss: false,
});
