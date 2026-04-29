import { describe, expect, it } from "vitest";
import { WEAPON_REGISTRY, WEAPON_IDS } from "../index";

const VALID_EFFECTS = new Set([
  "wide-spray",
  "auto-burst",
  "double-barrel",
  "mag-dump-cone",
  "arc-repeater",
  "napalm-pool",
]);

describe("chargeProfile — every weapon", () => {
  it("has a chargeProfile defined", () => {
    for (const id of WEAPON_IDS) {
      const w = WEAPON_REGISTRY[id];
      expect(w.chargeProfile, `${id} missing chargeProfile`).toBeDefined();
    }
  });

  it("shellsConsumed <= magSize for every weapon", () => {
    for (const id of WEAPON_IDS) {
      const w = WEAPON_REGISTRY[id];
      expect(
        w.chargeProfile!.shellsConsumed,
        `${id}: shellsConsumed (${w.chargeProfile!.shellsConsumed}) exceeds magSize (${w.magSize})`,
      ).toBeLessThanOrEqual(w.magSize);
    }
  });

  it("maxChargeMs is between 500 and 2000 for every weapon", () => {
    for (const id of WEAPON_IDS) {
      const w = WEAPON_REGISTRY[id];
      const ms = w.chargeProfile!.maxChargeMs;
      expect(ms, `${id}: maxChargeMs ${ms} < 500`).toBeGreaterThanOrEqual(500);
      expect(ms, `${id}: maxChargeMs ${ms} > 2000`).toBeLessThanOrEqual(2000);
    }
  });

  it("effect string is one of the valid enum values", () => {
    for (const id of WEAPON_IDS) {
      const w = WEAPON_REGISTRY[id];
      expect(
        VALID_EFFECTS.has(w.chargeProfile!.effect),
        `${id}: unknown effect "${w.chargeProfile!.effect}"`,
      ).toBe(true);
    }
  });
});
