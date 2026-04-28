import { createWorld } from "koota";
import { describe, expect, it } from "vitest";
import {
  AIBrain,
  AIPlan,
  Collectible,
  Encounter,
  Health,
  Hitbox,
  Lifecycle,
  Mission,
  Player,
  Position,
  Projectile,
  Score,
  Splash,
  SpriteRef,
  Trail,
  Velocity,
  Vermin,
} from "../traits";

describe("ecs traits", () => {
  it("every trait can be added to an entity with default values", () => {
    const w = createWorld();
    const e = w.spawn(
      Position,
      Velocity,
      Health,
      Hitbox,
      SpriteRef,
      AIBrain,
      AIPlan,
      Projectile,
      Collectible,
      Lifecycle,
      Trail,
      Splash,
      Score,
      Mission,
      Encounter,
      Player,
      Vermin,
    );
    expect(e.has(Position)).toBe(true);
    expect(e.has(Vermin)).toBe(true);
  });

  it("Position has x/y zero by default", () => {
    const w = createWorld();
    const e = w.spawn(Position);
    const p = e.get(Position);
    expect(p?.x).toBe(0);
    expect(p?.y).toBe(0);
  });

  it("Health.current and .max default to 1", () => {
    const w = createWorld();
    const e = w.spawn(Health);
    const h = e.get(Health);
    expect(h?.current).toBe(1);
    expect(h?.max).toBe(1);
  });

  it("traits hold per-entity state independently", () => {
    const w = createWorld();
    const a = w.spawn(Position({ x: 5, y: 7 }));
    const b = w.spawn(Position({ x: 100, y: -3 }));
    expect(a.get(Position)?.x).toBe(5);
    expect(b.get(Position)?.x).toBe(100);
  });

  it("Score singleton holds multiplier defaults", () => {
    const w = createWorld();
    const e = w.spawn(Score);
    const s = e.get(Score);
    expect(s?.total).toBe(0);
    expect(s?.multiplier).toBe(1);
  });
});
