import { describe, expect, it } from "vitest";
import { actLightFor, COLOR, fontFamilyFor, MOTION, SPACING, TYPE } from "../tokens";

describe("theme tokens", () => {
  it("COLOR exposes the canonical brand palette", () => {
    expect(COLOR.sodium).toBe("#d4943a");
    expect(COLOR.brick).toBe("#7a2818");
    expect(COLOR.bgAsphalt).toBe("#0d0c0a");
    expect(COLOR.cream).toBe("#e8dcc4");
  });

  it("COLOR is frozen — no runtime mutation", () => {
    expect(Object.isFrozen(COLOR)).toBe(true);
  });

  it("TYPE ramp picks the right face per token", () => {
    expect(TYPE.display.face).toBe("display");
    expect(TYPE.hud.face).toBe("mono");
    expect(fontFamilyFor("display")).toMatch(/Big Shoulders/);
    expect(fontFamilyFor("mono")).toMatch(/Special Elite/);
  });

  it("SPACING is 8 px-base", () => {
    expect(SPACING.sm).toBe(8);
    expect(SPACING.lg).toBe(16);
    expect(SPACING.xxl).toBe(32);
  });

  it("MOTION caps animation durations to design spec", () => {
    expect(MOTION.flashChipMs).toBeLessThanOrEqual(1200);
    expect(MOTION.criticalLifeMs).toBeLessThanOrEqual(1200);
  });

  it("actLightFor: per-act streetlight shift", () => {
    expect(actLightFor("streets")).toEqual({
      core: COLOR.sodium,
      rim: COLOR.sodium,
      underglow: null,
    });
    expect(actLightFor("underworld")).toMatchObject({
      core: COLOR.sodiumCool,
      underglow: COLOR.eliteGreen,
    });
    expect(actLightFor("above")).toMatchObject({
      core: COLOR.sodium,
      rim: COLOR.cream,
    });
  });
});
