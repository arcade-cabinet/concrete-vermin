import { beforeEach, describe, expect, it } from "vitest";
import { ARCHETYPE_IDS } from "../../archetypes/vermin";
import { createRng } from "../../rng";
import { _resetSpawnSequence, composeVermin } from "../actor";

beforeEach(() => _resetSpawnSequence());

describe("composeVermin", () => {
  it("rejects unknown archetypes", () => {
    // biome-ignore lint/suspicious/noExplicitAny: testing an invalid id on purpose
    expect(() => composeVermin("not-a-thing" as any, {}, createRng(1))).toThrow();
  });

  it("composes every archetype without throwing", () => {
    for (const id of ARCHETYPE_IDS) {
      _resetSpawnSequence();
      expect(() => composeVermin(id, {}, createRng(1))).not.toThrow();
    }
  });

  it("returns a frozen traits object so callers can't mutate the spawn", () => {
    const rec = composeVermin("rat", {}, createRng(1));
    expect(Object.isFrozen(rec.traits)).toBe(true);
    expect(Object.isFrozen(rec.stats)).toBe(true);
    expect(Object.isFrozen(rec.ai)).toBe(true);
  });

  it("layers overrides on top of DEFAULT_TRAITS", () => {
    const rec = composeVermin(
      "rat",
      { eyeGlow: "red", aggression: "berserk", affliction: "rabid" },
      createRng(1),
    );
    expect(rec.traits.eyeGlow).toBe("red");
    expect(rec.traits.aggression).toBe("berserk");
    expect(rec.traits.affliction).toBe("rabid");
    // unspecified traits fall through to DEFAULT
    expect(rec.traits.furColor).toBe("mangy-brown");
  });

  it("applies trait stats so that affliction-rabid produces faster speed", () => {
    const plain = composeVermin("rat", {}, createRng(1));
    _resetSpawnSequence();
    const rabid = composeVermin("rat", { affliction: "rabid" }, createRng(1));
    expect(rabid.stats.speed).toBeGreaterThan(plain.stats.speed);
  });

  it("ai configuration reflects affliction (rabid -> rabid-aoe ability)", () => {
    const rec = composeVermin("raccoon", { affliction: "rabid" }, createRng(1));
    expect(rec.ai.ability).toBe("rabid-aoe");
  });

  it("is deterministic — same RNG seed and overrides produce identical records", () => {
    _resetSpawnSequence();
    const a = composeVermin("rat", {}, createRng(42));
    _resetSpawnSequence();
    const b = composeVermin("rat", {}, createRng(42));
    expect(a).toEqual(b);
  });

  it("varies with rng forks — different forks produce different spawnIds", () => {
    const parent = createRng(7);
    const a = composeVermin("rat", {}, parent.fork("wave-a"));
    const b = composeVermin("rat", {}, parent.fork("wave-b"));
    expect(a.spawnId).not.toBe(b.spawnId);
  });

  it("each successive call from the same rng has a unique spawnId", () => {
    const rng = createRng(1);
    const ids = new Set<number>();
    for (let i = 0; i < 50; i++) ids.add(composeVermin("rat", {}, rng).spawnId);
    expect(ids.size).toBe(50);
  });

  it("preserves the archetype's brain, locomotion, hitbox, atlas, and audio refs", () => {
    const rec = composeVermin("seagull", {}, createRng(1));
    expect(rec.brain).toBe("dive-bomber");
    expect(rec.locomotion).toBe("flying");
    expect(rec.spriteAtlas).toBe("vermin/seagull");
    expect(rec.audio.spawn).toBe("vermin.seagull.spawn");
    expect(rec.hitbox.width).toBeGreaterThan(0);
  });

  it("flags bosses correctly", () => {
    expect(composeVermin("boss-pigeon-king", {}, createRng(1)).isBoss).toBe(true);
    expect(composeVermin("rat", {}, createRng(1)).isBoss).toBe(false);
  });
});
