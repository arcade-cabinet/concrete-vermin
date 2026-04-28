import { describe, it, expect } from "vitest";
import type { VerminSnapshot } from "../../runtime/store";
import { scoreThreat, selectHighestThreat } from "../threat";

function v(overrides: Partial<VerminSnapshot>): VerminSnapshot {
  return {
    id: 1,
    archetypeId: "rat",
    x: 100,
    y: 100,
    vx: 0,
    vy: 0,
    width: 16,
    height: 16,
    health: 5,
    maxHealth: 5,
    ...overrides,
  };
}

describe("selectHighestThreat", () => {
  it("returns null when list is empty", () => {
    expect(selectHighestThreat([], 3, { playerLineY: 270 })).toBeNull();
  });

  it("ignores zero-health vermin", () => {
    const dead = v({ id: 1, health: 0 });
    expect(selectHighestThreat([dead], 3, { playerLineY: 270 })).toBeNull();
  });

  it("prefers a vermin closer to the player line", () => {
    const far = v({ id: 1, y: 50 });
    const near = v({ id: 2, y: 250 });
    const pick = selectHighestThreat([far, near], 3, { playerLineY: 270 });
    expect(pick?.id).toBe(2);
  });

  it("prefers a beefier vermin when proximity is equal AND the weapon can kill it in similar time", () => {
    const a = v({ id: 1, y: 200, health: 5, maxHealth: 5 });
    const b = v({ id: 2, y: 200, health: 20, maxHealth: 20 });
    // Weapon damage 20 → both die in 1 shot; beefier should win on damageWeight tiebreak.
    const pick = selectHighestThreat([a, b], 20, { playerLineY: 270 });
    expect(pick?.id).toBe(2);
  });

  it("prefers the easier kill when the beefy target needs many more shots", () => {
    const easy = v({ id: 1, y: 200, health: 5, maxHealth: 5 });
    const tank = v({ id: 2, y: 200, health: 20, maxHealth: 20 });
    // Weapon damage 3 → easy = 2 shots, tank = 7 shots. Tank's shot cost
    // outweighs its damageWeight; pick the easy clear so the tank doesn't
    // close while we're stuck on it.
    const pick = selectHighestThreat([easy, tank], 3, { playerLineY: 270 });
    expect(pick?.id).toBe(1);
  });

  it("avoids overkilling near-dead targets when a stronger one is just as close", () => {
    const nearDead = v({ id: 1, y: 200, health: 1, maxHealth: 20 });
    const fullStrength = v({ id: 2, y: 200, health: 20, maxHealth: 20 });
    const pick = selectHighestThreat([nearDead, fullStrength], 8, { playerLineY: 270 });
    expect(pick?.id).toBe(2);
  });

  it("scores a single candidate consistently", () => {
    const lone = v({ y: 270 }); // exactly on the line
    const pick = selectHighestThreat([lone], 3, { playerLineY: 270 });
    expect(pick?.id).toBe(1);
  });
});

describe("scoreThreat", () => {
  it("gives proximity 100 to a vermin sitting on the player line", () => {
    const onLine = v({ y: 270, health: 1, maxHealth: 1 });
    const score = scoreThreat(onLine, 3, { playerLineY: 270 });
    // proximity = 1 → 100; damageWeight = 1; killShots = 1 → -5; near-dead penalty: -1.5 * 1 = -1.5
    expect(score).toBeCloseTo(100 + 1 - 5 - 1.5);
  });

  it("gives proximity ~0 to a vermin at the top of the screen", () => {
    const atTop = v({ y: 0, health: 5, maxHealth: 5 });
    const score = scoreThreat(atTop, 3, { playerLineY: 270 });
    // proximity = 0; damageWeight = 5; killShots = ceil(5/3) = 2 → -10
    expect(score).toBeCloseTo(0 + 5 - 10);
  });
});
