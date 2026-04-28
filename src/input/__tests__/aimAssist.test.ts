import { describe, expect, it } from "vitest";
import { applyAimAssist } from "../aimAssist";

const rat = (x: number, y: number) => ({
  archetypeId: "rat",
  x,
  y,
  width: 8,
  height: 6,
});

const boss = (x: number, y: number) => ({
  archetypeId: "boss-pigeon-king",
  x,
  y,
  width: 24,
  height: 18,
});

describe("input/aimAssist", () => {
  it("returns the original reticle when no vermin in range", () => {
    const r = applyAimAssist(100, 100, [rat(300, 300)]);
    expect(r.snapped).toBe(false);
    expect(r.x).toBe(100);
    expect(r.y).toBe(100);
    expect(r.target).toBeNull();
  });

  it("snaps to the nearest vermin within radius", () => {
    const target = rat(105, 100);
    const r = applyAimAssist(100, 100, [target, rat(200, 100)]);
    expect(r.snapped).toBe(true);
    expect(r.x).toBe(105);
    expect(r.target).toBe(target);
  });

  it("picks the closest of multiple in-range candidates", () => {
    // Both candidates outside the AABB so perimeter distances differ.
    const close = rat(106, 100); // perimeter dist 2 from reticle 100
    const far = rat(108, 100); // perimeter dist 4
    const r = applyAimAssist(100, 100, [far, close]);
    expect(r.target).toBe(close);
  });

  it("respects an inflated radius for bosses (3× pull)", () => {
    // Boss is 12 px outside the 5 px default radius — but boss bonus
    // makes effective radius 15, so it snaps.
    const b = boss(116, 100);
    const r = applyAimAssist(100, 100, [b]);
    expect(r.snapped).toBe(true);
    expect(r.target).toBe(b);
  });

  it("respects custom radius", () => {
    const target = rat(120, 100);
    const r = applyAimAssist(100, 100, [target], 30);
    expect(r.snapped).toBe(true);
  });

  it("counts distance from AABB perimeter, not centre", () => {
    // Vermin's right edge is at x=104 (centre 100 + hw 4); reticle at
    // x=107 is 3 px from the perimeter, well within the 5-px radius.
    const target = rat(100, 100);
    const r = applyAimAssist(107, 100, [target]);
    expect(r.snapped).toBe(true);
  });
});
