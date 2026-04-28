import { describe, expect, it } from "vitest";
import { Mission, Player, Score } from "../traits";
import { ALL_TRAITS, createGameWorld } from "../world";

describe("createGameWorld", () => {
  it("creates a world with the three singleton entities", () => {
    const gw = createGameWorld(1);
    expect(gw.playerEntity).toBeGreaterThan(0);
    expect(gw.scoreEntity).toBeGreaterThan(0);
    expect(gw.missionEntity).toBeGreaterThan(0);
    expect(gw.playerEntity).not.toBe(gw.scoreEntity);
  });

  it("singletons hold the expected traits", () => {
    const gw = createGameWorld(1);
    const players = gw.world.query(Player);
    const scores = gw.world.query(Score);
    const missions = gw.world.query(Mission);
    expect(players.length).toBe(1);
    expect(scores.length).toBe(1);
    expect(missions.length).toBe(1);
  });

  it("rng is seeded — same seed → identical first draw", () => {
    const a = createGameWorld(7);
    const b = createGameWorld(7);
    expect(a.rng.next()).toBe(b.rng.next());
  });

  it("different seeds → different rng streams", () => {
    const a = createGameWorld(1);
    const b = createGameWorld(2);
    expect(a.rng.next()).not.toBe(b.rng.next());
  });

  it("two empty worlds with the same seed produce identical entity counts", () => {
    const a = createGameWorld(42);
    const b = createGameWorld(42);
    // Empty stimulus — no spawn() calls beyond the singletons.
    expect(a.world.entities.length).toBe(b.world.entities.length);
    // Three singletons (Player + Score + Mission); Koota may add an
    // internal world entity, so accept any equal count >= 3.
    expect(a.world.entities.length).toBeGreaterThanOrEqual(3);
  });

  it("ALL_TRAITS registry has every trait used by the world", () => {
    expect(ALL_TRAITS.length).toBeGreaterThanOrEqual(15);
    expect(ALL_TRAITS).toContain(Player);
    expect(ALL_TRAITS).toContain(Score);
    expect(ALL_TRAITS).toContain(Mission);
  });
});
