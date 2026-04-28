import { describe, expect, it } from "vitest";
import { WEAPON_REGISTRY } from "../../weapons";
import { applyLoadout, getMod, LoadoutError, MAX_LOADOUT_SLOTS, MOD_REGISTRY, MOD_SLOTS } from "..";

describe("MOD_REGISTRY", () => {
  it("has at least 20 mods", () => {
    expect(MOD_REGISTRY.size).toBeGreaterThanOrEqual(20);
  });

  it("every mod has a valid slot", () => {
    for (const m of MOD_REGISTRY.values()) {
      expect(MOD_SLOTS).toContain(m.slot);
    }
  });

  it("every slot has at least one mod", () => {
    const used = new Set([...MOD_REGISTRY.values()].map((m) => m.slot));
    for (const s of MOD_SLOTS) expect(used.has(s)).toBe(true);
  });

  it("getMod returns the same record as the map", () => {
    expect(getMod("rabbits-foot")).toBe(MOD_REGISTRY.get("rabbits-foot"));
  });

  it("every record is frozen", () => {
    for (const m of MOD_REGISTRY.values()) expect(Object.isFrozen(m)).toBe(true);
  });
});

describe("applyLoadout", () => {
  const shotgun = WEAPON_REGISTRY.shotgun;
  const tightChoke = MOD_REGISTRY.get("tight-choke")!;
  const incendiary = MOD_REGISTRY.get("incendiary-shells")!;
  const ironSights = MOD_REGISTRY.get("iron-sights-pro")!;
  const lucky = MOD_REGISTRY.get("lucky-shell")!;

  it("0-mod loadout returns base values", () => {
    const t = applyLoadout(shotgun, []);
    expect(t.spread).toBe(shotgun.spread);
    expect(t.magSize).toBe(shotgun.magSize);
    expect(t.damageMods).toEqual([]);
    expect(t.mods).toEqual([]);
  });

  it("tight-choke tightens spread", () => {
    const t = applyLoadout(shotgun, [tightChoke]);
    expect(t.spread).toBeCloseTo(shotgun.spread * 0.6);
  });

  it("incendiary-shells stacks into damageMods", () => {
    const t = applyLoadout(shotgun, [incendiary]);
    expect(t.damageMods).toEqual([1.25]);
  });

  it("scope adds headshot bonus and tightens spread", () => {
    const t = applyLoadout(shotgun, [ironSights]);
    expect(t.headshotBonus).toBeCloseTo(shotgun.headshotBonus + 0.15);
    expect(t.spread).toBeCloseTo(shotgun.spread * 0.85);
  });

  it("3-slot stack: choke + incendiary + scope all fold in", () => {
    const t = applyLoadout(shotgun, [tightChoke, incendiary, ironSights]);
    expect(t.mods.length).toBe(3);
    expect(t.spread).toBeCloseTo(shotgun.spread * 0.6 * 0.85);
    expect(t.damageMods).toEqual([1.25]);
    expect(t.headshotBonus).toBeCloseTo(shotgun.headshotBonus + 0.15);
  });

  it("rejects 4 mods (exceeds slot cap)", () => {
    const overflow = [tightChoke, incendiary, ironSights, lucky];
    expect(overflow.length).toBeGreaterThan(MAX_LOADOUT_SLOTS);
    expect(() => applyLoadout(shotgun, overflow)).toThrow(LoadoutError);
  });

  it("rejects two mods of the same slot type", () => {
    const twoTalismans = [MOD_REGISTRY.get("rabbits-foot")!, MOD_REGISTRY.get("st-anthony-medal")!];
    expect(() => applyLoadout(shotgun, twoTalismans)).toThrow(/'talisman'/);
  });

  it("rejects mods incompatible with the chosen weapon", () => {
    const drumMag = MOD_REGISTRY.get("drum-mag")!; // smg-only
    expect(() => applyLoadout(shotgun, [drumMag])).toThrow(/not compatible/);
  });

  it("universal mods (compatibleWith=[]) work on every weapon", () => {
    const universal = MOD_REGISTRY.get("rabbits-foot")!;
    expect(universal.compatibleWith).toEqual([]);
    for (const w of Object.values(WEAPON_REGISTRY)) {
      expect(() => applyLoadout(w, [universal])).not.toThrow();
    }
  });

  it("crit-chance-add mods land in critChanceMods array", () => {
    const t = applyLoadout(shotgun, [lucky]);
    expect(t.critChanceMods).toEqual([0.08]);
  });

  it("magSizeAdd is additive", () => {
    const smg = WEAPON_REGISTRY.smg;
    const drum = MOD_REGISTRY.get("drum-mag")!;
    const t = applyLoadout(smg, [drum]);
    expect(t.magSize).toBe(smg.magSize + 20);
    expect(t.reloadMs).toBe(Math.round(smg.reloadMs * 1.2));
  });
});
