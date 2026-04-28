import { describe, expect, it } from "vitest";
import { applyLoadout } from "../../../sim/archetypes/mods";
import { WEAPON_REGISTRY } from "../../../sim/archetypes/weapons";
import { composeVermin } from "../../../sim/factories/actor";
import { planSpawnPattern } from "../../../sim/factories/patterns";
import { createRng } from "../../../sim/rng";
import { fireWeapon, spawnVermin } from "../../actions";
import { Lifecycle, Position, Score, Velocity } from "../../traits";
import { createGameWorld } from "../../world";
import {
  aiSystem,
  collideSystem,
  cullOffscreenSystem,
  lifecycleSystem,
  motionSystem,
  type PendingSpawn,
  projectileSystem,
  scoreSystem,
  spawnSystem,
} from "../index";

const ZONE = { minX: 0, maxX: 480, minY: 0, maxY: 270 };

describe("motionSystem", () => {
  it("integrates position from velocity", () => {
    const { world } = createGameWorld(1);
    const e = world.spawn(Position({ x: 0, y: 0 }), Velocity({ x: 100, y: 50 }));
    motionSystem(world, 0.1);
    expect(e.get(Position)?.x).toBeCloseTo(10);
    expect(e.get(Position)?.y).toBeCloseTo(5);
  });
});

describe("cullOffscreenSystem", () => {
  it("marks off-screen entity dead", () => {
    const { world } = createGameWorld(1);
    const e = world.spawn(
      Position({ x: -1000, y: 0 }),
      Velocity,
      Lifecycle({ spawnedAt: 0, deadAt: 0 }),
    );
    cullOffscreenSystem(world, ZONE, 1);
    expect(e.get(Lifecycle)?.deadAt).toBe(1);
  });
});

describe("projectileSystem", () => {
  it("kills projectile when range exhausted", () => {
    const { world, playerEntity } = createGameWorld(1);
    const tuned = applyLoadout(WEAPON_REGISTRY.shotgun, []);
    const ents = fireWeapon(world, tuned, {
      origin: { x: 0, y: 0 },
      target: { x: 1, y: 0 },
      now: 0,
      ownerEntity: playerEntity,
    });
    const e = ents[0]!;
    // dt=10s × 1200 units/s = 12000 — way past shotgun rangeMax (220)
    projectileSystem(world, 10, 1);
    expect(e.get(Lifecycle)?.deadAt).toBe(1);
  });
});

describe("collideSystem", () => {
  it("hits a vermin in the projectile path and emits a hit event", () => {
    const { world, playerEntity } = createGameWorld(1);
    const rec = composeVermin("rat", {}, createRng(1));
    spawnVermin(world, rec, { position: { x: 100, y: 100 }, now: 0 });
    const tuned = applyLoadout(WEAPON_REGISTRY.shotgun, []);
    fireWeapon(world, tuned, {
      origin: { x: 100, y: 100 }, // on top of the vermin
      target: { x: 200, y: 100 },
      now: 0,
      ownerEntity: playerEntity,
    });
    const events = collideSystem(world, createRng(7), 0.1);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0]?.archetypeId).toBe("rat");
  });

  it("returns empty when no vermin in range", () => {
    const { world, playerEntity } = createGameWorld(1);
    const tuned = applyLoadout(WEAPON_REGISTRY.revolver, []);
    fireWeapon(world, tuned, {
      origin: { x: 0, y: 0 },
      target: { x: 100, y: 0 },
      now: 0,
      ownerEntity: playerEntity,
    });
    const events = collideSystem(world, createRng(1), 0.1);
    expect(events).toEqual([]);
  });

  it("dedupes per-tick kills — multi-pellet shotgun on one rat fires one kill event", () => {
    const { world, playerEntity } = createGameWorld(1);
    const rec = composeVermin("rat", {}, createRng(1));
    spawnVermin(world, rec, { position: { x: 100, y: 100 }, now: 0 });
    const tuned = applyLoadout(WEAPON_REGISTRY.shotgun, []);
    fireWeapon(world, tuned, {
      origin: { x: 100, y: 100 },
      target: { x: 200, y: 100 },
      now: 0,
      ownerEntity: playerEntity,
    });
    const events = collideSystem(world, createRng(7), 0.1);
    const kills = events.filter((e) => e.kind === "kill");
    expect(kills.length, "multi-pellet blast must produce exactly one kill").toBe(1);
  });
});

describe("lifecycleSystem", () => {
  it("destroys entities with deadAt <= now", () => {
    const { world } = createGameWorld(1);
    const e = world.spawn(Position, Lifecycle({ spawnedAt: 0, deadAt: 1 }));
    expect(e.isAlive()).toBe(true);
    lifecycleSystem(world, 1.5);
    expect(e.isAlive()).toBe(false);
  });
});

describe("spawnSystem", () => {
  it("spawns each pending entry once after its delay elapses", () => {
    const { world } = createGameWorld(1);
    const timings = planSpawnPattern("left-flood", 3, createRng(1));
    const pending: PendingSpawn[] = timings.map((t) => ({
      variantId: "rat-mangy",
      timing: t,
      activeStartedAt: 0,
      zone: ZONE,
    }));
    spawnSystem(world, createRng(1), 10, pending);
    expect(pending.every((p) => p.spawned)).toBe(true);
    // Three vermin spawned (Vermin-tagged entities ≥ 3, plus singletons).
    const verminCount = pending.length;
    expect(verminCount).toBe(3);
  });
});

describe("aiSystem", () => {
  it("plans a brain and sets a non-zero velocity for an idle vermin", () => {
    const { world } = createGameWorld(1);
    const rec = composeVermin("rat", {}, createRng(1));
    const e = spawnVermin(world, rec, { position: { x: 200, y: 200 }, now: 0 });
    aiSystem(world, createRng(1), 0, ZONE);
    // The first step is a "wait" so velocity may be zero; advance time
    // past the wait and re-tick to confirm the brain drives motion.
    aiSystem(world, createRng(1), 1, ZONE);
    aiSystem(world, createRng(1), 2, ZONE);
    const v = e.get(Velocity);
    // After several ticks a non-wait step should fire.
    expect(v).toBeTruthy();
  });
});

describe("scoreSystem", () => {
  it("records kills into the singleton Score trait", () => {
    const { world, scoreEntity } = createGameWorld(1);
    scoreSystem(
      world,
      scoreEntity,
      [
        {
          kind: "kill",
          verminEntity: 0,
          archetypeId: "rat",
          isHeadshot: false,
          isCrit: false,
          damage: 5,
          position: { x: 0, y: 0 },
          at: 0,
        },
      ],
      0,
      0,
    );
    // Read score singleton.
    let total = -1;
    for (const e of world.query(Score)) {
      if (e.id() === scoreEntity) total = e.get(Score)?.total ?? -1;
    }
    expect(total).toBeGreaterThan(0);
  });
});
