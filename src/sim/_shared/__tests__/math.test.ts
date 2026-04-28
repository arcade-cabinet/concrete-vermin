import { describe, expect, it } from "vitest";
import {
  approxEqual,
  clamp,
  lerp,
  lerpV2,
  modWrap,
  sign,
  smoothDamp,
  v2,
  v2add,
  v2dist,
  v2dot,
  v2len,
  v2norm,
  v2scale,
  v2sub,
} from "../math";

describe("vec2", () => {
  it("add/sub/scale", () => {
    expect(v2add(v2(1, 2), v2(3, 4))).toEqual({ x: 4, y: 6 });
    expect(v2sub(v2(5, 5), v2(1, 2))).toEqual({ x: 4, y: 3 });
    expect(v2scale(v2(2, 3), 4)).toEqual({ x: 8, y: 12 });
  });

  it("dot/length", () => {
    expect(v2dot(v2(1, 2), v2(3, 4))).toBe(11);
    expect(v2len(v2(3, 4))).toBe(5);
    expect(v2dist(v2(0, 0), v2(3, 4))).toBe(5);
  });

  it("norm of zero is zero (no NaN)", () => {
    expect(v2norm(v2(0, 0))).toEqual({ x: 0, y: 0 });
  });

  it("norm of non-zero has unit length", () => {
    const n = v2norm(v2(3, 4));
    expect(approxEqual(v2len(n), 1)).toBe(true);
  });
});

describe("scalar helpers", () => {
  it("clamp", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });

  it("lerp", () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerpV2(v2(0, 0), v2(10, 20), 0.5)).toEqual({ x: 5, y: 10 });
  });

  it("modWrap handles negatives", () => {
    expect(modWrap(7, 3)).toBe(1);
    expect(modWrap(-1, 3)).toBe(2);
    expect(modWrap(-7, 3)).toBe(2);
  });

  it("sign", () => {
    expect(sign(5)).toBe(1);
    expect(sign(-3)).toBe(-1);
    expect(sign(0)).toBe(0);
  });

  it("smoothDamp converges toward target", () => {
    let v = 0;
    for (let i = 0; i < 240; i++) v = smoothDamp(v, 100, 1 / 60, 0.2);
    expect(approxEqual(v, 100, 0.5)).toBe(true);
  });

  it("smoothDamp with halfLifeS<=0 snaps to target", () => {
    expect(smoothDamp(0, 100, 0.016, 0)).toBe(100);
  });
});
