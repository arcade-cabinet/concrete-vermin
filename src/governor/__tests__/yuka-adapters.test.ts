import { describe, it, expect } from "vitest";
import { leadPoint } from "../yuka-adapters";

describe("leadPoint", () => {
  it("returns the target's current position when target is stationary", () => {
    const aim = leadPoint(
      { x: 0, y: 0 },
      { x: 100, y: 50, vx: 0, vy: 0 },
      { reticleMaxSpeed: 200 },
    );
    expect(aim.x).toBeCloseTo(100);
    expect(aim.y).toBeCloseTo(50);
  });

  it("leads a horizontally-moving target in the direction of travel", () => {
    const aim = leadPoint(
      { x: 0, y: 0 },
      { x: 100, y: 0, vx: 50, vy: 0 },
      { reticleMaxSpeed: 200 },
    );
    expect(aim.x).toBeCloseTo(120);
    expect(aim.y).toBeCloseTo(0);
  });

  it("leads further when predictionFactor > 1", () => {
    const a = leadPoint(
      { x: 0, y: 0 },
      { x: 100, y: 0, vx: 50, vy: 0 },
      { reticleMaxSpeed: 200, predictionFactor: 1 },
    );
    const b = leadPoint(
      { x: 0, y: 0 },
      { x: 100, y: 0, vx: 50, vy: 0 },
      { reticleMaxSpeed: 200, predictionFactor: 2 },
    );
    expect(b.x - 100).toBeGreaterThan(a.x - 100);
    // canonical lead = 20; 2x prediction = 40
    expect(b.x).toBeCloseTo(140);
  });

  it("leads less when reticleMaxSpeed is high (we catch up faster)", () => {
    const slow = leadPoint(
      { x: 0, y: 0 },
      { x: 100, y: 0, vx: 50, vy: 0 },
      { reticleMaxSpeed: 100 },
    );
    const fast = leadPoint(
      { x: 0, y: 0 },
      { x: 100, y: 0, vx: 50, vy: 0 },
      { reticleMaxSpeed: 1000 },
    );
    expect(slow.x).toBeGreaterThan(fast.x);
  });

  it("handles a 2D diagonal target (vx and vy both non-zero)", () => {
    const aim = leadPoint(
      { x: 0, y: 0 },
      { x: 100, y: 100, vx: 30, vy: -40 },
      { reticleMaxSpeed: 250 },
    );
    // distance = sqrt(100^2 + 100^2) ≈ 141.42
    // targetSpeed = sqrt(30^2 + 40^2) = 50
    // lookahead = 141.42 / 300 ≈ 0.4714s
    // x = 100 + 30 * 0.4714 ≈ 114.14
    // y = 100 + -40 * 0.4714 ≈ 81.14
    expect(aim.x).toBeCloseTo(114.14, 1);
    expect(aim.y).toBeCloseTo(81.14, 1);
  });

  it("does not divide by zero when shooter coincides with target and target stationary", () => {
    const aim = leadPoint(
      { x: 50, y: 50 },
      { x: 50, y: 50, vx: 0, vy: 0 },
      { reticleMaxSpeed: 200 },
    );
    expect(aim.x).toBe(50);
    expect(aim.y).toBe(50);
  });

  it("does not produce NaN when reticleMaxSpeed=0 against a stationary target", () => {
    const aim = leadPoint({ x: 0, y: 0 }, { x: 100, y: 50, vx: 0, vy: 0 }, { reticleMaxSpeed: 0 });
    expect(Number.isFinite(aim.x)).toBe(true);
    expect(Number.isFinite(aim.y)).toBe(true);
    expect(aim.x).toBeCloseTo(100);
    expect(aim.y).toBeCloseTo(50);
  });
});
