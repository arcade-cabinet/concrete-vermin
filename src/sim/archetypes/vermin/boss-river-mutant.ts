import type { Archetype } from "./_types";

export const bossRiverMutant: Readonly<Archetype> = Object.freeze({
  id: "boss-river-mutant",
  brain: "boss-scripted",
  locomotion: "amphibious",
  baseStats: { health: 800, speed: 110, contactDamage: 30, bounty: 3500, headshotMultiplier: 1.5 },
  hitbox: { width: 220, height: 160, headOffset: { x: 80, y: -50 } },
  spriteAtlas: "vermin/boss-river-mutant",
  audio: {
    spawn: "vermin.bossmutant.spawn",
    hit: "vermin.bossmutant.hit",
    death: "vermin.bossmutant.death",
    idle: "vermin.bossmutant.idle",
  },
  isBoss: true,
});
