import type { Archetype } from "./_types";

export const sewerFish: Readonly<Archetype> = Object.freeze({
  id: "sewer-fish",
  brain: "pop-up",
  locomotion: "amphibious",
  baseStats: { health: 8, speed: 200, contactDamage: 5, bounty: 45, headshotMultiplier: 2.5 },
  hitbox: { width: 40, height: 18, headOffset: { x: 16, y: 0 } },
  spriteAtlas: "vermin/sewer-fish",
  audio: {
    spawn: "vermin.sewerfish.spawn",
    hit: "vermin.sewerfish.hit",
    death: "vermin.sewerfish.death",
  },
  isBoss: false,
});
