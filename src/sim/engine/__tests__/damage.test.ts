import { describe, expect, it } from "vitest";
import { resolveHit, type TargetInput, type WeaponInput } from "../damage";

const baseWeapon: WeaponInput = {
  damage: 4,
  headshotBonus: 0,
  critChance: 0,
  critMultiplier: 2,
  damageMods: [],
  critChanceMods: [],
  armorPierce: 1,
};

const baseTarget: TargetInput = {
  health: 10,
  healthMod: "normal",
  headshotMultiplier: 2,
};

const noHit = { isHeadshot: false, critRoll: 0.99 };
const headshot = { isHeadshot: true, critRoll: 0.99 };
const critting = { isHeadshot: false, critRoll: 0 };

describe("resolveHit", () => {
  it("base body shot deals weapon.damage and decrements health", () => {
    const r = resolveHit(baseWeapon, baseTarget, noHit);
    expect(r.damage).toBe(4);
    expect(r.isHeadshot).toBe(false);
    expect(r.isCrit).toBe(false);
    expect(r.killed).toBe(false);
    expect(r.remainingHealth).toBe(6);
  });

  it("headshot multiplies by target.headshotMultiplier", () => {
    const r = resolveHit(baseWeapon, baseTarget, headshot);
    expect(r.damage).toBe(4 * 2);
    expect(r.isHeadshot).toBe(true);
  });

  it("weapon headshotBonus is additive on top of target multiplier", () => {
    const r = resolveHit({ ...baseWeapon, headshotBonus: 0.5 }, baseTarget, headshot);
    expect(r.damage).toBe(Math.round(4 * 2.5));
  });

  it("crit roll under critChance fires critMultiplier", () => {
    const r = resolveHit({ ...baseWeapon, critChance: 0.5 }, baseTarget, critting);
    expect(r.isCrit).toBe(true);
    expect(r.damage).toBe(8);
  });

  it("crit roll above critChance does NOT crit", () => {
    const r = resolveHit({ ...baseWeapon, critChance: 0.5 }, baseTarget, {
      isHeadshot: false,
      critRoll: 0.6,
    });
    expect(r.isCrit).toBe(false);
    expect(r.damage).toBe(4);
  });

  it("critChanceMods are additive and clamp to [0,1]", () => {
    const w: WeaponInput = { ...baseWeapon, critChance: 0.4, critChanceMods: [0.3, 0.5] };
    // total 1.2 → clamps to 1.0, every roll is a crit
    const r = resolveHit(w, baseTarget, { isHeadshot: false, critRoll: 0.999 });
    expect(r.isCrit).toBe(true);
  });

  it("damageMods stack multiplicatively", () => {
    const w: WeaponInput = { ...baseWeapon, damageMods: [1.25, 1.1] };
    const r = resolveHit(w, baseTarget, noHit);
    expect(r.damage).toBe(Math.round(4 * 1.25 * 1.1));
  });

  it("armored target reduces damage by 40% when armorPierce=0", () => {
    const w: WeaponInput = { ...baseWeapon, armorPierce: 0 };
    const t: TargetInput = { ...baseTarget, healthMod: "armored" };
    const r = resolveHit(w, t, noHit);
    expect(r.damage).toBe(Math.max(1, Math.round(4 * 0.6)));
  });

  it("armorPierce=1 ignores armor entirely", () => {
    const t: TargetInput = { ...baseTarget, healthMod: "armored" };
    const r = resolveHit(baseWeapon, t, noHit);
    expect(r.damage).toBe(4);
  });

  it("tough target reduces damage by 20% at full armor", () => {
    const w: WeaponInput = { ...baseWeapon, armorPierce: 0 };
    const t: TargetInput = { ...baseTarget, healthMod: "tough" };
    const r = resolveHit(w, t, noHit);
    expect(r.damage).toBe(Math.max(1, Math.round(4 * 0.8)));
  });

  it("fragile and normal have no armor reduction", () => {
    const w: WeaponInput = { ...baseWeapon, armorPierce: 0 };
    const a = resolveHit(w, { ...baseTarget, healthMod: "fragile" }, noHit);
    const b = resolveHit(w, { ...baseTarget, healthMod: "normal" }, noHit);
    expect(a.damage).toBe(4);
    expect(b.damage).toBe(4);
  });

  it("damage floor is 1 even after heavy armor reduction", () => {
    const w: WeaponInput = { ...baseWeapon, damage: 1, armorPierce: 0 };
    const t: TargetInput = { ...baseTarget, healthMod: "armored" };
    const r = resolveHit(w, t, noHit);
    expect(r.damage).toBeGreaterThanOrEqual(1);
  });

  it("kills target when damage >= remaining health", () => {
    const r = resolveHit(baseWeapon, { ...baseTarget, health: 4 }, noHit);
    expect(r.killed).toBe(true);
    expect(r.remainingHealth).toBe(0);
  });

  it("overkill clamps remainingHealth to 0", () => {
    const r = resolveHit({ ...baseWeapon, damage: 100 }, baseTarget, noHit);
    expect(r.remainingHealth).toBe(0);
    expect(r.killed).toBe(true);
  });

  it("headshot + crit + damageMod stack into one shot", () => {
    const w: WeaponInput = {
      ...baseWeapon,
      damageMods: [1.5],
      critChance: 1,
      critMultiplier: 2,
    };
    const r = resolveHit(w, baseTarget, { isHeadshot: true, critRoll: 0 });
    // 4 * 1.5 * 2 (target headshot) * 2 (crit) = 24
    expect(r.damage).toBe(24);
    expect(r.isCrit).toBe(true);
    expect(r.isHeadshot).toBe(true);
    expect(r.killed).toBe(true);
  });

  it("is pure: same inputs → same outputs", () => {
    const a = resolveHit(baseWeapon, baseTarget, headshot);
    const b = resolveHit(baseWeapon, baseTarget, headshot);
    expect(a).toEqual(b);
  });
});
