import { afterEach, describe, expect, it } from "vitest";
import { activeShakeCount, pushShake, resetShakeForTest, sampleShake } from "../screenShake";

afterEach(() => resetShakeForTest());

describe("runtime/screenShake", () => {
  it("starts empty + sampleShake returns (0, 0)", () => {
    expect(activeShakeCount()).toBe(0);
    expect(sampleShake(0, false)).toEqual({ dx: 0, dy: 0 });
  });

  it("pushShake('kill') registers an event with non-zero amplitude", () => {
    pushShake("kill", 1000);
    expect(activeShakeCount()).toBe(1);
    const s = sampleShake(1010, false);
    expect(s.dx === 0 && s.dy === 0).toBe(false);
  });

  it("amplitude scales: bossDeath > bossHit > kill", () => {
    pushShake("kill", 1000);
    const k = sampleShake(1001, false);
    resetShakeForTest();
    pushShake("bossHit", 1000);
    const bh = sampleShake(1001, false);
    resetShakeForTest();
    pushShake("bossDeath", 1000);
    const bd = sampleShake(1001, false);
    const mag = (s: { dx: number; dy: number }) => Math.hypot(s.dx, s.dy);
    expect(mag(bd)).toBeGreaterThan(mag(bh));
    expect(mag(bh)).toBeGreaterThan(mag(k));
  });

  it("decays to zero after the duration window", () => {
    pushShake("kill", 1000);
    const after = sampleShake(1100, false); // 100 ms past, > 80 ms duration
    expect(after).toEqual({ dx: 0, dy: 0 });
    expect(activeShakeCount()).toBe(0);
  });

  it("dedupes rapid same-kind events within 30 ms", () => {
    pushShake("kill", 1000);
    pushShake("kill", 1010);
    pushShake("kill", 1020);
    expect(activeShakeCount()).toBe(1);
  });

  it("reduced-motion zeroes the offset even with active events", () => {
    pushShake("bossDeath", 1000);
    expect(sampleShake(1010, true)).toEqual({ dx: 0, dy: 0 });
  });
});
