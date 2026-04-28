import { describe, expect, it } from "vitest";
import { composeVermin } from "../../../sim/factories/actor";
import { createRng } from "../../../sim/rng";
import { spawnVermin } from "../../actions";
import { Health, Lifecycle, NapalmPool } from "../../traits";
import { createGameWorld } from "../../world";
import { napalmSystem } from "../napalm";

const NOW_MS = 1000;
const DPS = 60; // 60 dps × (1/60) s = 1 hp per tick — easy to assert

function spawnTestVermin(world: ReturnType<typeof createGameWorld>["world"], x: number, y: number) {
  const rng = createRng(42);
  const rec = composeVermin("rat", {}, rng);
  const e = spawnVermin(world, rec, { position: { x, y }, now: NOW_MS / 1000 });
  // Force a known health value for deterministic assertions.
  e.set(Health, { current: 100, max: 100 });
  return e;
}

function spawnPool(
  world: ReturnType<typeof createGameWorld>["world"],
  opts: { x: number; y: number; radius: number; dps: number; ttlMs?: number; nowMs?: number },
) {
  const now = opts.nowMs ?? NOW_MS;
  const ttl = opts.ttlMs ?? 2000;
  return world.spawn(
    NapalmPool({
      x: opts.x,
      y: opts.y,
      radius: opts.radius,
      dps: opts.dps,
      ttlMs: ttl,
      expiresAt: now + ttl,
    }),
  );
}

describe("napalmSystem — damage application", () => {
  it("deals dps damage to a vermin inside the pool each tick", () => {
    const { world } = createGameWorld(1);
    const v = spawnTestVermin(world, 100, 100);
    spawnPool(world, { x: 100, y: 100, radius: 40, dps: DPS });

    napalmSystem(world, NOW_MS);

    const hp = v.get(Health)?.current ?? -1;
    // Exactly 1 hp drained (60 dps × 1/60 s).
    expect(hp).toBeCloseTo(99, 4);
  });

  it("does not damage a vermin outside the pool radius", () => {
    const { world } = createGameWorld(1);
    // Vermin placed 100 px away from a pool with radius 40.
    const v = spawnTestVermin(world, 200, 100);
    spawnPool(world, { x: 100, y: 100, radius: 40, dps: DPS });

    napalmSystem(world, NOW_MS);

    const hp = v.get(Health)?.current ?? -1;
    expect(hp).toBe(100); // untouched
  });

  it("double-overlap: vermin in two pools takes combined DPS", () => {
    const { world } = createGameWorld(1);
    const v = spawnTestVermin(world, 100, 100);
    // Two pools both covering position (100, 100).
    spawnPool(world, { x: 100, y: 100, radius: 40, dps: DPS });
    spawnPool(world, { x: 100, y: 100, radius: 40, dps: DPS });

    napalmSystem(world, NOW_MS);

    const hp = v.get(Health)?.current ?? -1;
    // Two pools each deal 1 hp per tick → total 2 hp drained.
    expect(hp).toBeCloseTo(98, 4);
  });

  it("does not damage vermin that are already dead (deadAt > 0)", () => {
    const { world } = createGameWorld(1);
    const v = spawnTestVermin(world, 100, 100);
    // Mark the vermin as dead before running the system.
    const lc = v.get(Lifecycle);
    v.set(Lifecycle, { spawnedAt: lc?.spawnedAt ?? 0, deadAt: NOW_MS / 1000 - 0.1 });
    spawnPool(world, { x: 100, y: 100, radius: 40, dps: DPS });

    napalmSystem(world, NOW_MS);

    // hp unchanged — dead entities are skipped.
    expect(v.get(Health)?.current).toBe(100);
  });
});

describe("napalmSystem — pool expiry", () => {
  it("destroys a pool whose expiresAt <= nowMs", () => {
    const { world } = createGameWorld(1);
    // Pool that expired 1 ms ago.
    spawnPool(world, {
      x: 100,
      y: 100,
      radius: 40,
      dps: DPS,
      ttlMs: 1000,
      nowMs: NOW_MS - 1001, // expiresAt = NOW_MS - 1001 + 1000 = NOW_MS - 1
    });

    napalmSystem(world, NOW_MS);

    // No pools should remain in the world.
    const remaining = [...world.query(NapalmPool)];
    expect(remaining).toHaveLength(0);
  });

  it("keeps a pool that has not yet expired", () => {
    const { world } = createGameWorld(1);
    spawnPool(world, { x: 100, y: 100, radius: 40, dps: DPS, ttlMs: 2000 });

    napalmSystem(world, NOW_MS);

    const remaining = [...world.query(NapalmPool)];
    expect(remaining).toHaveLength(1);
  });

  it("expired pools are not applied before being destroyed", () => {
    const { world } = createGameWorld(1);
    const v = spawnTestVermin(world, 100, 100);
    // Pool expired 1 ms ago — should be destroyed before damage pass.
    spawnPool(world, {
      x: 100,
      y: 100,
      radius: 40,
      dps: DPS,
      ttlMs: 1000,
      nowMs: NOW_MS - 1001,
    });

    napalmSystem(world, NOW_MS);

    // Vermin is undamaged because the pool was swept before damage.
    expect(v.get(Health)?.current).toBe(100);
  });
});
