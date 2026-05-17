import { describe, expect, it } from "vitest";
import { modBlurb } from "../PawnShop";

describe("modBlurb", () => {
  it("falls back to {slot}-class when no fields are populated", () => {
    expect(modBlurb({ slot: "reticle" })).toBe("reticle-class");
  });

  it("formats positive damageMod with plus sign", () => {
    expect(modBlurb({ slot: "barrel", damageMod: 1.2 })).toContain("+20% DMG");
  });

  it("formats sub-1 damageMod with minus sign (U+2212)", () => {
    expect(modBlurb({ slot: "barrel", damageMod: 0.8 })).toContain("−20% DMG");
  });

  it("emits 'tighter spread' / 'wider spread' tokens for spreadMul", () => {
    expect(modBlurb({ slot: "barrel", spreadMul: 0.7 })).toContain("tighter spread");
    expect(modBlurb({ slot: "barrel", spreadMul: 1.4 })).toContain("wider spread");
  });

  it("includes +N mag for magSizeAdd > 0", () => {
    expect(modBlurb({ slot: "mag", magSizeAdd: 2 })).toContain("+2 mag");
  });

  it("formats reloadMul with sign + percent", () => {
    expect(modBlurb({ slot: "mag", reloadMul: 0.8 })).toContain("−20% reload");
    expect(modBlurb({ slot: "mag", reloadMul: 1.25 })).toContain("+25% reload");
  });

  it("formats rangeMul with sign + percent", () => {
    expect(modBlurb({ slot: "barrel", rangeMul: 1.5 })).toContain("+50% range");
    expect(modBlurb({ slot: "barrel", rangeMul: 0.6 })).toContain("−40% range");
  });

  it("formats headshot + crit additive bonuses", () => {
    expect(modBlurb({ slot: "sight", headshotBonusAdd: 0.25 })).toContain("+25% headshot");
    expect(modBlurb({ slot: "sight", critChanceAdd: 0.1 })).toContain("+10% crit");
  });

  it("formats chargeTimeMul with sign + percent", () => {
    expect(modBlurb({ slot: "charge", chargeTimeMul: 0.5 })).toContain("−50% charge time");
    expect(modBlurb({ slot: "charge", chargeTimeMul: 1.5 })).toContain("+50% charge time");
  });

  it("formats chargeShellsDelta with sign + count", () => {
    expect(modBlurb({ slot: "charge", chargeShellsDelta: 1 })).toContain("+1 charge cost");
    expect(modBlurb({ slot: "charge", chargeShellsDelta: -2 })).toContain("−2 charge cost");
  });

  it("formats chargeEffectMul with sign + percent", () => {
    expect(modBlurb({ slot: "charge", chargeEffectMul: 1.5 })).toContain("+50% charge effect");
    expect(modBlurb({ slot: "charge", chargeEffectMul: 0.7 })).toContain("−30% charge effect");
  });

  it("emits {N} arcs token for chargeArcCount", () => {
    expect(modBlurb({ slot: "charge", chargeArcCount: 5 })).toContain("5 arcs");
  });

  it("joins multiple populated fields with the bullet separator", () => {
    const out = modBlurb({
      slot: "barrel",
      damageMod: 1.1,
      rangeMul: 1.2,
      spreadMul: 0.9,
    });
    expect(out.split(" · ").length).toBeGreaterThanOrEqual(3);
    expect(out).toContain("+10% DMG");
    expect(out).toContain("+20% range");
    expect(out).toContain("tighter spread");
  });
});
