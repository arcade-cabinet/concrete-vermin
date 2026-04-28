import { describe, expect, it } from "vitest";
import { applyLoadout } from "../../sim/archetypes/mods";
import { WEAPON_REGISTRY } from "../../sim/archetypes/weapons";
import { composeVermin } from "../../sim/factories/actor";
import { createRng } from "../../sim/rng";
import { consumeCollectible, fireWeapon, spawnSplash, spawnVermin, takeDamage } from "../actions";
import { Collectible, Health, Lifecycle, Position, Projectile, Splash, Vermin } from "../traits";
import { createGameWorld } from "../world";

describe("spawnVermin", () => {
  it("creates an entity with all expected traits", () => {
    const { world } = createGameWorld(1);
    const rec = composeVermin("rat", {}, createRng(7));
    const e = spawnVermin(world, rec, { position: { x: 100, y: 50 }, now: 0 });
    expect(e.has(Vermin)).toBe(true);
    expect(e.has(Position)).toBe(true);
    expect(e.has(Health)).toBe(true);
    expect(e.has(Lifecycle)).toBe(true);
    expect(e.get(Position)?.x).toBe(100);
    expect(e.get(Health)?.max).toBeGreaterThan(0);
  });
});

describe("fireWeapon", () => {
  it("spawns one projectile per pellet", () => {
    const { world, playerEntity } = createGameWorld(1);
    const tuned = applyLoadout(WEAPON_REGISTRY.shotgun, []);
    const ents = fireWeapon(world, tuned, {
      origin: { x: 0, y: 0 },
      target: { x: 100, y: 0 },
      now: 0,
      ownerEntity: playerEntity,
    });
    expect(ents.length).toBe(WEAPON_REGISTRY.shotgun.pellets);
    expect(ents[0]?.has(Projectile)).toBe(true);
  });

  it("revolver fires one bullet, smg fires one per call", () => {
    const { world, playerEntity } = createGameWorld(1);
    const r = applyLoadout(WEAPON_REGISTRY.revolver, []);
    const s = applyLoadout(WEAPON_REGISTRY.smg, []);
    expect(
      fireWeapon(world, r, {
        origin: { x: 0, y: 0 },
        target: { x: 1, y: 0 },
        now: 0,
        ownerEntity: playerEntity,
      }).length,
    ).toBe(1);
    expect(
      fireWeapon(world, s, {
        origin: { x: 0, y: 0 },
        target: { x: 1, y: 0 },
        now: 0,
        ownerEntity: playerEntity,
      }).length,
    ).toBe(1);
  });
});

describe("takeDamage", () => {
  it("reduces health and marks dead at 0", () => {
    const { world } = createGameWorld(1);
    const rec = composeVermin("rat", {}, createRng(1));
    const e = spawnVermin(world, rec, { position: { x: 0, y: 0 }, now: 0 });
    const max = e.get(Health)!.max;
    takeDamage(world, e.id(), max, 5);
    expect(e.get(Health)?.current).toBe(0);
    expect(e.get(Lifecycle)?.deadAt).toBe(5);
  });

  it("partial damage does NOT mark dead", () => {
    const { world } = createGameWorld(1);
    const rec = composeVermin("rat", {}, createRng(1));
    const e = spawnVermin(world, rec, { position: { x: 0, y: 0 }, now: 0 });
    takeDamage(world, e.id(), 1, 5);
    expect(e.get(Health)?.current).toBeGreaterThan(0);
    expect(e.get(Lifecycle)?.deadAt).toBe(0);
  });
});

describe("spawnSplash", () => {
  it("creates a Splash + Position + Lifecycle entity with deadAt set", () => {
    const { world } = createGameWorld(1);
    const e = spawnSplash(world, { x: 50, y: 50 }, "rat-mangy", 1, 0.3);
    expect(e.has(Splash)).toBe(true);
    expect(e.get(Lifecycle)?.deadAt).toBeCloseTo(1.3);
  });
});

describe("consumeCollectible", () => {
  it("marks the collectible's lifecycle deadAt", () => {
    const { world } = createGameWorld(1);
    const e = world.spawn(Collectible({ variantId: "x", graceBonusS: 5 }), Lifecycle);
    consumeCollectible(world, e.id(), 7);
    expect(e.get(Lifecycle)?.deadAt).toBe(7);
  });
});
