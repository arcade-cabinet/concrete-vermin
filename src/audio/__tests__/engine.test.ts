/**
 * Audio engine: subscription, dedupe via seq, mute drains without firing.
 * We patch the dispatch path with a spy so we don't need a real Tone
 * AudioContext in node — the subscription mechanics are the contract.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INITIAL_SNAPSHOT, useGameStore, type AudioEvent } from "../../runtime/store";
import { installAudioEngine } from "../engine";

let dispatchSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  dispatchSpy = vi.fn();
  useGameStore.setState({ ...INITIAL_SNAPSHOT });
});

afterEach(() => {
  useGameStore.setState({ settings: { ...useGameStore.getState().settings, muted: false } });
});

function publish(events: AudioEvent[], startSeq: number): void {
  useGameStore.getState().setSnapshot({
    audioEvents: events.map((event, i) => ({ seq: startSeq + i + 1, event })),
  });
}

describe("audio engine", () => {
  it("dispatches new audio events emitted via the snapshot", () => {
    const uninstall = installAudioEngine(dispatchSpy);
    try {
      publish([{ kind: "mission-start" }, { kind: "vermin-spawn" }], 0);
      expect(dispatchSpy).toHaveBeenCalledTimes(2);
      expect(dispatchSpy).toHaveBeenNthCalledWith(1, { kind: "mission-start" });
      expect(dispatchSpy).toHaveBeenNthCalledWith(2, { kind: "vermin-spawn" });
    } finally {
      uninstall();
    }
  });

  it("dedupes events by seq across multiple publishes", () => {
    const uninstall = installAudioEngine(dispatchSpy);
    try {
      // First publish: 2 events.
      publish([{ kind: "mission-start" }, { kind: "vermin-spawn" }], 0);
      expect(dispatchSpy).toHaveBeenCalledTimes(2);
      // Re-publish the SAME seq pair — should be ignored.
      publish([{ kind: "mission-start" }, { kind: "vermin-spawn" }], 0);
      expect(dispatchSpy).toHaveBeenCalledTimes(2);
      // Publish a fresh seq — dispatched.
      publish([{ kind: "vermin-death", archetypeId: "rat" }], 2);
      expect(dispatchSpy).toHaveBeenCalledTimes(3);
    } finally {
      uninstall();
    }
  });

  it("respects mute: drains seq pointer but does not dispatch", () => {
    const uninstall = installAudioEngine(dispatchSpy);
    try {
      useGameStore.setState({
        settings: { ...useGameStore.getState().settings, muted: true },
      });
      publish([{ kind: "weapon-fire", weaponId: "shotgun" }], 0);
      expect(dispatchSpy).not.toHaveBeenCalled();
      // Unmute, then publish another event — only the new one fires
      // (the muted-period event is NOT replayed).
      useGameStore.setState({
        settings: { ...useGameStore.getState().settings, muted: false },
      });
      publish([{ kind: "weapon-empty" }], 1);
      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      expect(dispatchSpy).toHaveBeenCalledWith({ kind: "weapon-empty" });
    } finally {
      uninstall();
    }
  });

  it("uninstall stops dispatching", () => {
    const uninstall = installAudioEngine(dispatchSpy);
    publish([{ kind: "mission-start" }], 0);
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    uninstall();
    publish([{ kind: "mission-won" }], 1);
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
  });

  it("every AudioEvent kind can round-trip through publish → dispatcher", () => {
    const uninstall = installAudioEngine(dispatchSpy);
    try {
      const all: AudioEvent[] = [
        { kind: "mission-start" },
        { kind: "mission-won" },
        { kind: "mission-won-sgrade" },
        { kind: "mission-lost" },
        { kind: "act-ambience", act: "streets" },
        { kind: "weapon-fire", weaponId: "shotgun" },
        { kind: "weapon-reload", weaponId: "shotgun" },
        { kind: "weapon-empty" },
        { kind: "music-duck", bus: "music", db: 4, attackS: 0.18, holdS: 0.25 },
        { kind: "charge-start", weaponId: "shotgun" },
        { kind: "charge-progress", progress: 0.5 },
        { kind: "charge-stop" },
        { kind: "charge-release", weaponId: "shotgun", progress: 0.8 },
        { kind: "vermin-spawn" },
        { kind: "vermin-hit", archetypeId: "rat" },
        { kind: "vermin-death", archetypeId: "rat" },
        { kind: "boss-leitmotif-start" },
        { kind: "boss-leitmotif-stop" },
        { kind: "boss-death-sting" },
      ];
      publish(all, 0);
      expect(dispatchSpy).toHaveBeenCalledTimes(all.length);
      for (let i = 0; i < all.length; i++) {
        expect(dispatchSpy).toHaveBeenNthCalledWith(i + 1, all[i]);
      }
    } finally {
      uninstall();
    }
  });
});
