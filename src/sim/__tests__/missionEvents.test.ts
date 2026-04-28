import { describe, expect, it } from "vitest";
import { MISSIONS } from "../content/missions";
import { VARIANT_IDS } from "../content/variants";
import { SPAWN_PATTERNS } from "../factories/patterns";

describe("mission events catalog", () => {
  it("every mission declares 3-5 dynamic event triggers", () => {
    for (const m of MISSIONS) {
      expect(m.events.length, `${m.id} event count`).toBeGreaterThanOrEqual(3);
      expect(m.events.length, `${m.id} event count`).toBeLessThanOrEqual(5);
    }
  });

  it("event ids are unique within each mission", () => {
    for (const m of MISSIONS) {
      const ids = m.events.map((e) => e.id);
      expect(new Set(ids).size, `${m.id} duplicate event id`).toBe(ids.length);
    }
  });

  it("at-encounter-start triggers reference a real encounter index", () => {
    for (const m of MISSIONS) {
      for (const ev of m.events) {
        if (ev.trigger.kind !== "at-encounter-start") continue;
        expect(
          ev.trigger.index,
          `${m.id}/${ev.id}: encounter index out of range`,
        ).toBeLessThan(m.encounters.length);
      }
    }
  });

  it("surprise-wave variants and patterns are real", () => {
    const variantSet = new Set<string>(VARIANT_IDS);
    const patternSet = new Set<string>(SPAWN_PATTERNS);
    for (const m of MISSIONS) {
      for (const ev of m.events) {
        if (ev.effect.kind !== "surprise-wave") continue;
        expect(variantSet.has(ev.effect.variant), `${m.id}/${ev.id}: unknown variant`).toBe(true);
        expect(patternSet.has(ev.effect.pattern), `${m.id}/${ev.id}: unknown pattern`).toBe(true);
      }
    }
  });

  it("each mission mixes at least two distinct effect kinds", () => {
    for (const m of MISSIONS) {
      const kinds = new Set(m.events.map((e) => e.effect.kind));
      expect(kinds.size, `${m.id} effect-kind variety`).toBeGreaterThanOrEqual(2);
    }
  });
});
