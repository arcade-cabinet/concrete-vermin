import { describe, expect, it } from "vitest";
import { MISSIONS, SECRET_MISSIONS } from "../content/missions";
import { VARIANT_IDS } from "../content/variants";
import { SPAWN_PATTERNS } from "../factories/patterns";

const ALL = [...MISSIONS, ...SECRET_MISSIONS];

describe("mission events catalog", () => {
  it("every mission declares 3-5 dynamic event triggers", () => {
    for (const m of ALL) {
      expect(m.events.length, `${m.id} event count`).toBeGreaterThanOrEqual(3);
      expect(m.events.length, `${m.id} event count`).toBeLessThanOrEqual(5);
    }
  });

  it("event ids are unique within each mission", () => {
    for (const m of ALL) {
      const ids = m.events.map((e) => e.id);
      expect(new Set(ids).size, `${m.id} duplicate event id`).toBe(ids.length);
    }
  });

  it("at-encounter-start triggers reference a real encounter index", () => {
    for (const m of ALL) {
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
    for (const m of ALL) {
      for (const ev of m.events) {
        if (ev.effect.kind !== "surprise-wave") continue;
        expect(variantSet.has(ev.effect.variant), `${m.id}/${ev.id}: unknown variant`).toBe(true);
        expect(patternSet.has(ev.effect.pattern), `${m.id}/${ev.id}: unknown pattern`).toBe(true);
      }
    }
  });

  it("each mission mixes at least two distinct effect kinds", () => {
    for (const m of ALL) {
      const kinds = new Set(m.events.map((e) => e.effect.kind));
      expect(kinds.size, `${m.id} effect-kind variety`).toBeGreaterThanOrEqual(2);
    }
  });

  it("at-kill-count thresholds are reachable given the mission's spawn budget", () => {
    for (const m of ALL) {
      const baseSpawns = m.encounters.reduce(
        (sum, e) => sum + e.spawns.reduce((a, s) => a + s.count, 0),
        0,
      );
      const eventSpawns = m.events.reduce(
        (sum, ev) => sum + (ev.effect.kind === "surprise-wave" ? ev.effect.count : 0),
        0,
      );
      const maxKills = baseSpawns + eventSpawns;
      for (const ev of m.events) {
        if (ev.trigger.kind !== "at-kill-count") continue;
        expect(
          ev.trigger.threshold,
          `${m.id}/${ev.id}: at-kill-count threshold ${ev.trigger.threshold} unreachable (max kills=${maxKills})`,
        ).toBeLessThanOrEqual(maxKills);
      }
    }
  });
});
