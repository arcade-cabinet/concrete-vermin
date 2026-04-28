import { describe, expect, it } from "vitest";
import { actLightFor } from "../effects/actLighting";

describe("render/effects/actLighting", () => {
  it("returns the streets palette for streets", () => {
    const p = actLightFor("streets");
    expect(p.light).toBe(0xf2a13a);
    expect(p.brickTint).toBeNull();
  });

  it("returns the underworld palette with sickly green light + tinted brick", () => {
    const p = actLightFor("underworld");
    expect(p.light).toBe(0xa8d04a);
    expect(p.brickTint).not.toBeNull();
    expect(p.washAlpha).toBeGreaterThan(0);
  });

  it("returns the above palette with cold pale dawn light", () => {
    const p = actLightFor("above");
    expect(p.light).toBe(0xc8c0e4);
    expect(p.washAlpha).toBeGreaterThan(0);
  });

  it("falls back to streets for unknown / null / undefined acts", () => {
    expect(actLightFor(null)).toEqual(actLightFor("streets"));
    expect(actLightFor(undefined)).toEqual(actLightFor("streets"));
    expect(actLightFor("nonsense")).toEqual(actLightFor("streets"));
  });
});
