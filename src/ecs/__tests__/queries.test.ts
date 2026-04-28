import { describe, expect, it } from "vitest";
import {
  queryAlive,
  queryCollectibles,
  queryDying,
  queryNearReticle,
  queryProjectiles,
  queryVermin,
} from "../queries";
import { Collectible, Health, Lifecycle, Position, Projectile, Vermin } from "../traits";
import { createGameWorld } from "../world";

describe("queryVermin", () => {
  it("returns only entities with Vermin + Position", () => {
    const { world } = createGameWorld(1);
    const v1 = world.spawn(Vermin, Position({ x: 10, y: 0 }));
    const v2 = world.spawn(Vermin, Position({ x: 20, y: 0 }));
    world.spawn(Position({ x: 30, y: 0 })); // no Vermin
    world.spawn(Vermin); // no Position

    const r = queryVermin(world);
    expect(r.length).toBe(2);
    expect(r.map((e) => e.id()).sort()).toEqual([v1.id(), v2.id()].sort());
  });
});

describe("queryProjectiles", () => {
  it("returns Projectile + Position entities", () => {
    const { world } = createGameWorld(1);
    world.spawn(Projectile, Position);
    world.spawn(Projectile); // no Position
    expect(queryProjectiles(world).length).toBe(1);
  });
});

describe("queryCollectibles", () => {
  it("returns Collectible + Position entities", () => {
    const { world } = createGameWorld(1);
    world.spawn(Collectible, Position);
    expect(queryCollectibles(world).length).toBe(1);
  });
});

describe("queryAlive", () => {
  it("filters out Health.current <= 0", () => {
    const { world } = createGameWorld(1);
    world.spawn(Health({ current: 5, max: 10 }));
    world.spawn(Health({ current: 0, max: 10 }));
    world.spawn(Health({ current: -1, max: 10 }));
    expect(queryAlive(world).length).toBe(1);
  });

  it("returns empty when nothing alive", () => {
    const { world } = createGameWorld(1);
    world.spawn(Health({ current: 0, max: 10 }));
    expect(queryAlive(world)).toEqual([]);
  });
});

describe("queryNearReticle", () => {
  it("includes only vermin within radius", () => {
    const { world } = createGameWorld(1);
    world.spawn(Vermin, Position({ x: 0, y: 0 }));
    world.spawn(Vermin, Position({ x: 5, y: 0 }));
    world.spawn(Vermin, Position({ x: 100, y: 0 }));
    const r = queryNearReticle(world, { x: 0, y: 0 }, 10);
    expect(r.length).toBe(2);
  });

  it("respects radius boundary (squared distance compare)", () => {
    const { world } = createGameWorld(1);
    world.spawn(Vermin, Position({ x: 3, y: 4 })); // distance 5
    expect(queryNearReticle(world, { x: 0, y: 0 }, 5).length).toBe(1);
    expect(queryNearReticle(world, { x: 0, y: 0 }, 4.999).length).toBe(0);
  });
});

describe("queryDying", () => {
  it("returns Lifecycle entities with deadAt > 0", () => {
    const { world } = createGameWorld(1);
    world.spawn(Lifecycle({ spawnedAt: 0, deadAt: 0 }));
    world.spawn(Lifecycle({ spawnedAt: 0, deadAt: 5 }));
    expect(queryDying(world).length).toBe(1);
  });
});
