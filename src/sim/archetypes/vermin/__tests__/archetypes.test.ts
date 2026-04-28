import { describe, expect, it } from "vitest";
import { ARCHETYPE_IDS, ARCHETYPES, archetypeSchema, getArchetype } from "../index";

describe("vermin archetypes registry", () => {
  it("exports an entry for every ArchetypeId", () => {
    for (const id of ARCHETYPE_IDS) {
      expect(ARCHETYPES[id]).toBeDefined();
      expect(ARCHETYPES[id].id).toBe(id);
    }
  });

  it("has unique IDs across all archetypes", () => {
    const seen = new Set<string>();
    for (const id of ARCHETYPE_IDS) {
      expect(seen.has(id)).toBe(false);
      seen.add(id);
    }
    expect(seen.size).toBe(ARCHETYPE_IDS.length);
  });

  it("matches the design's expected count of 12", () => {
    expect(ARCHETYPE_IDS.length).toBe(12);
  });

  it("every archetype passes the Zod schema", () => {
    for (const id of ARCHETYPE_IDS) {
      const result = archetypeSchema.safeParse(ARCHETYPES[id]);
      expect(result.success, `archetype ${id} failed: ${JSON.stringify(result)}`).toBe(true);
    }
  });

  it("has exactly three boss archetypes (one per act)", () => {
    const bosses = ARCHETYPE_IDS.filter((id) => ARCHETYPES[id].isBoss);
    expect(bosses.length).toBe(3);
    expect(bosses.sort()).toEqual(
      ["boss-dumpster-bear", "boss-pigeon-king", "boss-river-mutant"].sort(),
    );
  });

  it("bosses have far higher health than mooks", () => {
    const mookHealthMax = Math.max(
      ...ARCHETYPE_IDS.filter((id) => !ARCHETYPES[id].isBoss).map(
        (id) => ARCHETYPES[id].baseStats.health,
      ),
    );
    const bossHealthMin = Math.min(
      ...ARCHETYPE_IDS.filter((id) => ARCHETYPES[id].isBoss).map(
        (id) => ARCHETYPES[id].baseStats.health,
      ),
    );
    expect(bossHealthMin).toBeGreaterThan(mookHealthMax * 5);
  });

  it("getArchetype returns the same frozen reference each call", () => {
    const a = getArchetype("rat");
    const b = getArchetype("rat");
    expect(a).toBe(b);
    expect(Object.isFrozen(a)).toBe(true);
  });

  it("ARCHETYPES is frozen at the registry level", () => {
    expect(Object.isFrozen(ARCHETYPES)).toBe(true);
  });

  it("rejects malformed archetypes via the schema", () => {
    const bad = { ...ARCHETYPES.rat, baseStats: { ...ARCHETYPES.rat.baseStats, health: -1 } };
    expect(archetypeSchema.safeParse(bad).success).toBe(false);
  });
});
