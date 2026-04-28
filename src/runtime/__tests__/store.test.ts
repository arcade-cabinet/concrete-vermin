/**
 * Store-level invariants. Lightweight unit tests that don't construct
 * a runner — just exercise the store actions + INITIAL_SNAPSHOT
 * contract directly.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { INITIAL_SNAPSHOT, useGameStore } from "../store";

beforeEach(() => {
  useGameStore.setState({
    ...INITIAL_SNAPSHOT,
    player: { ammoCurrent: 6, ammoMax: 6, livesRemaining: 3 },
  });
});

describe("INITIAL_SNAPSHOT", () => {
  it("excludes runner-owned `player` so spreads don't stomp shop / weapon-mod upgrades", () => {
    // The Pick<...> union is the contract. If a future commit adds
    // `player` back into the snapshot, this test fires before it
    // can land.
    expect(INITIAL_SNAPSHOT).not.toHaveProperty("player");
  });

  it("startMission preserves an upgraded ammoMax across mission boundaries", () => {
    // Simulate a shop or weapon-mod upgrade: +6 magazine size.
    useGameStore.setState({
      player: { ammoCurrent: 12, ammoMax: 12, livesRemaining: 5 },
    });
    useGameStore.getState().startMission("streets-02-alley", 18, "streets");
    // The runner is what re-publishes player; in the gap before its
    // first publishSnapshot, the upgraded values must still be present.
    expect(useGameStore.getState().player.ammoMax).toBe(12);
    expect(useGameStore.getState().player.livesRemaining).toBe(5);
  });

  it("startMission resets per-mission scaffolding (score, killCount, vermin, now)", () => {
    useGameStore.setState({
      score: { total: 9999, multiplier: 4 },
      killCount: 50,
      now: 123,
    });
    useGameStore.getState().startMission("streets-01-bodega", 14, "streets");
    expect(useGameStore.getState().score).toEqual({ total: 0, multiplier: 1 });
    expect(useGameStore.getState().killCount).toBe(0);
    expect(useGameStore.getState().now).toBe(0);
    expect(useGameStore.getState().missionId).toBe("streets-01-bodega");
    expect(useGameStore.getState().missionAct).toBe("streets");
    expect(useGameStore.getState().killsRequired).toBe(14);
    expect(useGameStore.getState().phase).toBe("playing");
  });

  it("endMission flips phase to won/lost without disturbing other state", () => {
    useGameStore.setState({ score: { total: 4321, multiplier: 2 }, killCount: 17 });
    useGameStore.getState().endMission(true);
    expect(useGameStore.getState().phase).toBe("won");
    expect(useGameStore.getState().score.total).toBe(4321);
    expect(useGameStore.getState().killCount).toBe(17);
    useGameStore.getState().endMission(false);
    expect(useGameStore.getState().phase).toBe("lost");
  });
});

describe("startMission resets the snapshot but layers in the mission scaffolding", () => {
  // Documents the contract that MissionResult relies on: a player who
  // replays a cleared mission gets fresh score / killCount / vermin
  // arrays at the moment startMission() runs. The first publishSnapshot
  // from the runner then overwrites the score/killCount with sim
  // values, so this is just the inter-mission gap state.
  it("zeroes vermin / projectiles / muzzle flashes / event barks", () => {
    useGameStore.setState({
      vermin: [
        {
          id: 1,
          archetypeId: "rat",
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          width: 0,
          height: 0,
          health: 0,
          maxHealth: 0,
        },
      ],
      projectiles: [{ id: 1, x: 0, y: 0, vx: 0, vy: 0 }],
      muzzleFlashes: [{ x: 0, y: 0, targetX: 0, targetY: 0, firedAt: 0, ttlS: 0 }],
      eventBarks: [{ id: "x", kind: "boss", text: "y", at: 0 }],
    });
    useGameStore.getState().startMission("streets-01-bodega", 14, "streets");
    expect(useGameStore.getState().vermin).toEqual([]);
    expect(useGameStore.getState().projectiles).toEqual([]);
    expect(useGameStore.getState().muzzleFlashes).toEqual([]);
    expect(useGameStore.getState().eventBarks).toEqual([]);
  });
});
