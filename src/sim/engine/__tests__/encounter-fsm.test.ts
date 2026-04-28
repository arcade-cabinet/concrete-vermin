import { describe, expect, it } from "vitest";
import { type EncounterFsm, makeEncounterFsm, step } from "../encounter-fsm";

const baseFsm = (): EncounterFsm =>
  makeEncounterFsm({ totalVermin: 3, armingDurationS: 1, timeLimitS: 30 });

describe("encounter-fsm", () => {
  it("starts in WAITING_FOR_CAMERA with full vermin count", () => {
    const f = baseFsm();
    expect(f.phase).toBe("WAITING_FOR_CAMERA");
    expect(f.remaining).toBe(3);
  });

  it("camera-arrived → ARMING and records the time", () => {
    const r = step(baseFsm(), { kind: "camera-arrived" }, 5);
    expect(r.next.phase).toBe("ARMING");
    expect(r.next.armingStartedAt).toBe(5);
    expect(r.emitted).toEqual([{ kind: "phase-entered", phase: "ARMING", at: 5 }]);
  });

  it("camera-arrived during ARMING is a no-op", () => {
    const a = step(baseFsm(), { kind: "camera-arrived" }, 0);
    const b = step(a.next, { kind: "camera-arrived" }, 1);
    expect(b.next).toEqual(a.next);
    expect(b.emitted).toEqual([]);
  });

  it("ARMING → ACTIVE after armingDurationS elapses (tick)", () => {
    const a = step(baseFsm(), { kind: "camera-arrived" }, 0);
    const b = step(a.next, { kind: "tick" }, 0.5);
    expect(b.next.phase).toBe("ARMING");
    const c = step(b.next, { kind: "tick" }, 1.0);
    expect(c.next.phase).toBe("ACTIVE");
    expect(c.next.activeStartedAt).toBe(1.0);
  });

  it("vermin-killed during ACTIVE decrements remaining", () => {
    const f = { ...baseFsm(), phase: "ACTIVE" as const, activeStartedAt: 0 };
    const r = step(f, { kind: "vermin-killed" }, 5);
    expect(r.next.remaining).toBe(2);
    expect(r.emitted).toEqual([]);
  });

  it("vermin-killed honors count", () => {
    const f = { ...baseFsm(), phase: "ACTIVE" as const, activeStartedAt: 0 };
    const r = step(f, { kind: "vermin-killed", count: 2 }, 5);
    expect(r.next.remaining).toBe(1);
  });

  it("ACTIVE → CLEARED when remaining hits 0", () => {
    const f = { ...baseFsm(), phase: "ACTIVE" as const, remaining: 1, activeStartedAt: 0 };
    const r = step(f, { kind: "vermin-killed" }, 5);
    expect(r.next.phase).toBe("CLEARED");
    expect(r.next.remaining).toBe(0);
    expect(r.emitted.map((e) => e.kind)).toEqual(["phase-entered", "encounter-cleared"]);
  });

  it("vermin-killed outside ACTIVE is ignored", () => {
    const f = baseFsm();
    const r = step(f, { kind: "vermin-killed" }, 0);
    expect(r.next).toEqual(f);
    expect(r.emitted).toEqual([]);
  });

  it("ACTIVE → FAILED on timeout via tick", () => {
    const f = { ...baseFsm(), phase: "ACTIVE" as const, activeStartedAt: 0 };
    const r = step(f, { kind: "tick" }, 31);
    expect(r.next.phase).toBe("FAILED");
    expect(r.emitted.map((e) => e.kind)).toEqual(["phase-entered", "encounter-failed"]);
    const failed = r.emitted.find((e) => e.kind === "encounter-failed");
    expect(failed && "reason" in failed && failed.reason).toBe("timeout");
  });

  it("timeLimitS=0 disables timeout", () => {
    const f: EncounterFsm = {
      ...baseFsm(),
      phase: "ACTIVE",
      activeStartedAt: 0,
      timeLimitS: 0,
    };
    const r = step(f, { kind: "tick" }, 99999);
    expect(r.next.phase).toBe("ACTIVE");
    expect(r.emitted).toEqual([]);
  });

  it("explicit fail event during ACTIVE → FAILED with reason", () => {
    const f = { ...baseFsm(), phase: "ACTIVE" as const, activeStartedAt: 0 };
    const r = step(f, { kind: "fail", reason: "player-died" }, 10);
    expect(r.next.phase).toBe("FAILED");
    const failed = r.emitted.find((e) => e.kind === "encounter-failed");
    expect(failed && "reason" in failed && failed.reason).toBe("player-died");
  });

  it("fail outside ACTIVE is ignored", () => {
    const r = step(baseFsm(), { kind: "fail", reason: "x" }, 0);
    expect(r.next.phase).toBe("WAITING_FOR_CAMERA");
    expect(r.emitted).toEqual([]);
  });

  it("CLEARED is terminal — further events do nothing", () => {
    const f: EncounterFsm = { ...baseFsm(), phase: "CLEARED", remaining: 0 };
    for (const ev of [
      { kind: "vermin-killed" as const },
      { kind: "tick" as const },
      { kind: "camera-arrived" as const },
      { kind: "fail" as const, reason: "x" },
    ]) {
      const r = step(f, ev, 100);
      expect(r.next).toEqual(f);
      expect(r.emitted).toEqual([]);
    }
  });

  it("FAILED is terminal — further events do nothing", () => {
    const f: EncounterFsm = { ...baseFsm(), phase: "FAILED" };
    const r = step(f, { kind: "vermin-killed" }, 0);
    expect(r.next).toEqual(f);
    expect(r.emitted).toEqual([]);
  });

  it("does not mutate the input fsm", () => {
    const f = baseFsm();
    const snapshot = JSON.stringify(f);
    step(f, { kind: "camera-arrived" }, 5);
    expect(JSON.stringify(f)).toBe(snapshot);
  });
});
