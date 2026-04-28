import { describe, expect, it } from "vitest";
import {
  getWeapon,
  PROJECTILE_TYPES,
  TRAIL_TYPES,
  WEAPON_IDS,
  WEAPON_REGISTRY,
  weaponArchetypeSchema,
} from "..";
import { weaponArchetypeSchema as schemaCheck } from "../_types";

describe("weapon registry", () => {
  it("has every WeaponId", () => {
    expect(Object.keys(WEAPON_REGISTRY).sort()).toEqual([...WEAPON_IDS].sort());
  });

  it("getWeapon returns the same record for the same id", () => {
    expect(getWeapon("shotgun")).toBe(WEAPON_REGISTRY.shotgun);
  });

  it("every record passes the zod schema (defense in depth)", () => {
    for (const w of Object.values(WEAPON_REGISTRY)) {
      expect(() => schemaCheck.parse(w)).not.toThrow();
    }
  });

  it("every record is frozen", () => {
    for (const w of Object.values(WEAPON_REGISTRY)) {
      expect(Object.isFrozen(w)).toBe(true);
    }
  });

  it("uses only declared projectile/trail types", () => {
    for (const w of Object.values(WEAPON_REGISTRY)) {
      expect(PROJECTILE_TYPES).toContain(w.projectileType);
      expect(TRAIL_TYPES).toContain(w.trailType);
    }
  });
});

describe("weapon balance feel", () => {
  it("shotgun trades range for pellet count", () => {
    const w = WEAPON_REGISTRY.shotgun;
    expect(w.pellets).toBeGreaterThan(1);
    expect(w.rangeMax).toBeLessThan(WEAPON_REGISTRY.revolver.rangeMax);
  });

  it("revolver is high single-shot damage", () => {
    expect(WEAPON_REGISTRY.revolver.damage).toBeGreaterThan(WEAPON_REGISTRY.smg.damage);
  });

  it("smg has the highest fire rate of the conventional guns", () => {
    expect(WEAPON_REGISTRY.smg.fireRate).toBeGreaterThan(WEAPON_REGISTRY.revolver.fireRate);
    expect(WEAPON_REGISTRY.smg.fireRate).toBeGreaterThan(WEAPON_REGISTRY.shotgun.fireRate);
  });

  it("sawed-off is short-range high-pellet", () => {
    const w = WEAPON_REGISTRY["sawed-off"];
    expect(w.pellets).toBeGreaterThanOrEqual(WEAPON_REGISTRY.shotgun.pellets);
    expect(w.rangeMax).toBeLessThan(WEAPON_REGISTRY.shotgun.rangeMax);
  });

  it("flamethrower has no headshot or crit", () => {
    const w = WEAPON_REGISTRY.flamethrower;
    expect(w.headshotBonus).toBe(0);
    expect(w.critChance).toBe(0);
  });

  it("tesla pierces armor fully and has zero spread", () => {
    expect(WEAPON_REGISTRY.tesla.armorPierce).toBe(1);
    expect(WEAPON_REGISTRY.tesla.spread).toBe(0);
  });
});

describe("weaponArchetypeSchema export", () => {
  it("is the same exported from both barrel and _types", () => {
    expect(weaponArchetypeSchema).toBe(schemaCheck);
  });
});
