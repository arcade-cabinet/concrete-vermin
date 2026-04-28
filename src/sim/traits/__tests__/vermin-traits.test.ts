import { describe, expect, it } from "vitest";
import {
  type Affliction,
  type Aggression,
  type AntennaSize,
  applyTraitsToStats,
  BASE_AI_CONFIG,
  type BodySize,
  DEFAULT_TRAITS,
  type EyeGlow,
  type FurColor,
  type HealthMod,
  mergeTraits,
  type SpeedMod,
  type TailLength,
  tuneAIForTraits,
  type VerminBaseStats,
  type VerminTraitSet,
} from "../vermin";

const BASE_STATS: VerminBaseStats = {
  health: 10,
  speed: 100,
  contactDamage: 5,
  bounty: 50,
  headshotMultiplier: 2,
};

const FUR: FurColor[] = ["mangy-brown", "oil-black", "piebald", "albino", "soot-grey", "rust"];
const EYES: EyeGlow[] = ["none", "red", "amber", "sickly-green"];
const SIZE: BodySize[] = ["runt", "normal", "fat", "engorged"];
const TAIL: TailLength[] = ["stub", "normal", "whiplash"];
const ANT: AntennaSize[] = ["none", "short", "waving", "massive"];
const SPEED: SpeedMod[] = ["sluggish", "normal", "scuttling", "panicked"];
const HEALTH: HealthMod[] = ["fragile", "normal", "tough", "armored"];
const AGG: Aggression[] = ["skittish", "curious", "aggressive", "berserk"];
const AFFL: Affliction[] = ["none", "rabid", "radioactive", "cybernetic"];

describe("DEFAULT_TRAITS", () => {
  it("is the identity composition for stats", () => {
    const out = applyTraitsToStats(BASE_STATS, DEFAULT_TRAITS);
    expect(out.health).toBe(BASE_STATS.health);
    expect(out.speed).toBeCloseTo(BASE_STATS.speed, 5);
    expect(out.contactDamage).toBe(BASE_STATS.contactDamage);
    expect(out.bounty).toBe(BASE_STATS.bounty);
    expect(out.headshotMultiplier).toBe(BASE_STATS.headshotMultiplier);
  });

  it("is frozen", () => {
    expect(Object.isFrozen(DEFAULT_TRAITS)).toBe(true);
  });
});

describe("applyTraitsToStats — every trait dimension", () => {
  it("scales health by body size", () => {
    for (const bodySize of SIZE) {
      const t: VerminTraitSet = { ...DEFAULT_TRAITS, bodySize };
      const out = applyTraitsToStats(BASE_STATS, t);
      if (bodySize === "runt") expect(out.health).toBeLessThan(BASE_STATS.health);
      if (bodySize === "engorged") expect(out.health).toBeGreaterThan(BASE_STATS.health);
    }
  });

  it("scales speed by speedMod", () => {
    for (const speedMod of SPEED) {
      const t: VerminTraitSet = { ...DEFAULT_TRAITS, speedMod };
      const out = applyTraitsToStats(BASE_STATS, t);
      if (speedMod === "sluggish") expect(out.speed).toBeLessThan(BASE_STATS.speed);
      if (speedMod === "panicked") expect(out.speed).toBeGreaterThan(BASE_STATS.speed);
    }
  });

  it("scales health by healthMod", () => {
    for (const healthMod of HEALTH) {
      const t: VerminTraitSet = { ...DEFAULT_TRAITS, healthMod };
      const out = applyTraitsToStats(BASE_STATS, t);
      if (healthMod === "fragile") expect(out.health).toBeLessThan(BASE_STATS.health);
      if (healthMod === "armored") expect(out.health).toBeGreaterThan(BASE_STATS.health);
    }
  });

  it("scales bounty by affliction (cybernetic > radioactive > rabid > none)", () => {
    const bounty = (a: Affliction) =>
      applyTraitsToStats(BASE_STATS, { ...DEFAULT_TRAITS, affliction: a }).bounty;
    expect(bounty("cybernetic")).toBeGreaterThan(bounty("radioactive"));
    expect(bounty("radioactive")).toBeGreaterThan(bounty("rabid"));
    expect(bounty("rabid")).toBeGreaterThan(bounty("none"));
  });

  it("rabid affliction increases speed", () => {
    const a = applyTraitsToStats(BASE_STATS, { ...DEFAULT_TRAITS, affliction: "rabid" });
    expect(a.speed).toBeGreaterThan(BASE_STATS.speed);
  });

  it("cybernetic affliction doubles health and lowers headshot multiplier", () => {
    const c = applyTraitsToStats(BASE_STATS, { ...DEFAULT_TRAITS, affliction: "cybernetic" });
    expect(c.health).toBeGreaterThan(BASE_STATS.health * 1.5);
    expect(c.headshotMultiplier).toBeLessThan(BASE_STATS.headshotMultiplier);
  });

  it("whiplash tail boosts contact damage", () => {
    const w = applyTraitsToStats(BASE_STATS, { ...DEFAULT_TRAITS, tailLength: "whiplash" });
    expect(w.contactDamage).toBeGreaterThanOrEqual(BASE_STATS.contactDamage);
  });

  it("never returns health < 1 even for fragile runts", () => {
    const tiny: VerminBaseStats = { ...BASE_STATS, health: 1 };
    const out = applyTraitsToStats(tiny, {
      ...DEFAULT_TRAITS,
      bodySize: "runt",
      healthMod: "fragile",
    });
    expect(out.health).toBeGreaterThanOrEqual(1);
  });

  it("clamps headshot multiplier within [1, 8]", () => {
    const huge: VerminBaseStats = { ...BASE_STATS, headshotMultiplier: 16 };
    const out = applyTraitsToStats(huge, DEFAULT_TRAITS);
    expect(out.headshotMultiplier).toBeLessThanOrEqual(8);
    expect(out.headshotMultiplier).toBeGreaterThanOrEqual(1);
  });

  it("covers every fur/eye/tail/antenna value (purely cosmetic — must not throw)", () => {
    for (const furColor of FUR) {
      for (const eyeGlow of EYES) {
        for (const tailLength of TAIL) {
          for (const antennaSize of ANT) {
            expect(() =>
              applyTraitsToStats(BASE_STATS, {
                ...DEFAULT_TRAITS,
                furColor,
                eyeGlow,
                tailLength,
                antennaSize,
              }),
            ).not.toThrow();
          }
        }
      }
    }
  });
});

describe("tuneAIForTraits", () => {
  it("berserk aggression > skittish aggression", () => {
    const b = tuneAIForTraits(BASE_AI_CONFIG, { ...DEFAULT_TRAITS, aggression: "berserk" });
    const s = tuneAIForTraits(BASE_AI_CONFIG, { ...DEFAULT_TRAITS, aggression: "skittish" });
    expect(b.aggression).toBeGreaterThan(s.aggression);
    expect(b.reactionDelayS).toBeLessThan(s.reactionDelayS);
  });

  it("rabid affliction maps to rabid-aoe ability", () => {
    expect(
      tuneAIForTraits(BASE_AI_CONFIG, { ...DEFAULT_TRAITS, affliction: "rabid" }).ability,
    ).toBe("rabid-aoe");
  });

  it("radioactive affliction maps to toxic-puddle", () => {
    expect(
      tuneAIForTraits(BASE_AI_CONFIG, { ...DEFAULT_TRAITS, affliction: "radioactive" }).ability,
    ).toBe("toxic-puddle");
  });

  it("cybernetic affliction maps to spark-shield", () => {
    expect(
      tuneAIForTraits(BASE_AI_CONFIG, { ...DEFAULT_TRAITS, affliction: "cybernetic" }).ability,
    ).toBe("spark-shield");
  });

  it("panicked speedMod produces highest jitter", () => {
    const p = tuneAIForTraits(BASE_AI_CONFIG, { ...DEFAULT_TRAITS, speedMod: "panicked" });
    const s = tuneAIForTraits(BASE_AI_CONFIG, { ...DEFAULT_TRAITS, speedMod: "sluggish" });
    expect(p.jitter).toBeGreaterThan(s.jitter);
  });

  it("aggression and reactionDelayS stay clamped in [0,1]", () => {
    for (const agg of AGG) {
      for (const aff of AFFL) {
        const cfg = tuneAIForTraits(BASE_AI_CONFIG, {
          ...DEFAULT_TRAITS,
          aggression: agg,
          affliction: aff,
        });
        expect(cfg.aggression).toBeGreaterThanOrEqual(0);
        expect(cfg.aggression).toBeLessThanOrEqual(1);
        expect(cfg.reactionDelayS).toBeGreaterThanOrEqual(0.05);
        expect(cfg.reactionDelayS).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("mergeTraits", () => {
  it("layers a partial override on top of a base", () => {
    const t = mergeTraits(DEFAULT_TRAITS, { eyeGlow: "red", aggression: "berserk" });
    expect(t.eyeGlow).toBe("red");
    expect(t.aggression).toBe("berserk");
    expect(t.furColor).toBe(DEFAULT_TRAITS.furColor);
  });
});
