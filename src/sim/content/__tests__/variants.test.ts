import { describe, expect, it } from "vitest";
import { ARCHETYPE_IDS } from "../../archetypes/vermin";
import { composeVermin } from "../../factories/actor";
import { createRng } from "../../rng";
import { getVariant, VARIANT_IDS, VARIANTS } from "../variants";

describe("VARIANTS registry", () => {
  it("has at least 30 variants", () => {
    expect(VARIANTS.size).toBeGreaterThanOrEqual(30);
  });

  it("covers all 12 archetypes (≥1 variant each)", () => {
    const archs = new Set([...VARIANTS.values()].map((v) => v.archetype));
    for (const id of ARCHETYPE_IDS) {
      expect(archs.has(id)).toBe(true);
    }
  });

  it("has multiple variants per non-boss archetype", () => {
    const counts = new Map<string, number>();
    for (const v of VARIANTS.values()) {
      counts.set(v.archetype, (counts.get(v.archetype) ?? 0) + 1);
    }
    for (const id of ARCHETYPE_IDS) {
      const c = counts.get(id) ?? 0;
      if (id.startsWith("boss-")) {
        expect(c).toBeGreaterThanOrEqual(1);
      } else {
        expect(c).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it("ids are unique (no duplicate keys collapsed)", () => {
    expect(VARIANT_IDS.length).toBe(VARIANTS.size);
  });

  it("getVariant returns the same record as the map", () => {
    const id = VARIANT_IDS[0] as string;
    expect(getVariant(id)).toBe(VARIANTS.get(id));
  });

  it("variant records are frozen", () => {
    for (const v of VARIANTS.values()) {
      expect(Object.isFrozen(v)).toBe(true);
      expect(Object.isFrozen(v.traits)).toBe(true);
    }
  });
});

describe("every variant composes via composeVermin", () => {
  for (const id of VARIANT_IDS) {
    it(`'${id}' composes successfully`, () => {
      const v = getVariant(id);
      if (!v) throw new Error(`missing variant ${id}`);
      const rec = composeVermin(v.archetype, v.traits, createRng(42));
      expect(rec.archetypeId).toBe(v.archetype);
      expect(rec.spawnId).toBeGreaterThan(0);
      expect(rec.stats.health).toBeGreaterThan(0);
    });
  }
});

describe("variant determinism", () => {
  it("same variant + same seed → same composed record", () => {
    const id = VARIANT_IDS[0] as string;
    const v = getVariant(id)!;
    const a = composeVermin(v.archetype, v.traits, createRng(7));
    const b = composeVermin(v.archetype, v.traits, createRng(7));
    // spawnId is incremented from a module-local counter, so won't match.
    // Compare everything else.
    const { spawnId: _aId, ...aRest } = a;
    const { spawnId: _bId, ...bRest } = b;
    expect(aRest).toEqual(bRest);
  });
});
