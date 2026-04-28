import { describe, expect, it } from "vitest";
import { calloutFor, totalCalloutCount } from "../copy/encounter-callouts";

describe("calloutFor — milestone ladders", () => {
  it("kill-streak: returns highest milestone <= count", () => {
    expect(calloutFor({ kind: "kill-streak", count: 3 })).toBeNull();
    expect(calloutFor({ kind: "kill-streak", count: 5 })).toBe("ON THE BOARD");
    expect(calloutFor({ kind: "kill-streak", count: 12 })).toBe("ROLLING");
    expect(calloutFor({ kind: "kill-streak", count: 100 })).toBe("WHOLE BOROUGH");
  });

  it("headshot-streak honors the 3 / 5 / 10 / 20 ladder", () => {
    expect(calloutFor({ kind: "headshot-streak", count: 2 })).toBeNull();
    expect(calloutFor({ kind: "headshot-streak", count: 3 })).toBe("EYE FOR IT");
    expect(calloutFor({ kind: "headshot-streak", count: 7 })).toBe("SURGEON");
    expect(calloutFor({ kind: "headshot-streak", count: 10 })).toBe("PAWNBROKER WOULD APPROVE");
    expect(calloutFor({ kind: "headshot-streak", count: 25 })).toBe("BOTH EYES OPEN");
  });

  it("no-reload-streak ladder", () => {
    expect(calloutFor({ kind: "no-reload-streak", count: 7 })).toBeNull();
    expect(calloutFor({ kind: "no-reload-streak", count: 8 })).toBe("RHYTHM");
    expect(calloutFor({ kind: "no-reload-streak", count: 64 })).toBe("POSSESSED");
  });

  it("chain-kill ladder", () => {
    expect(calloutFor({ kind: "chain-kill", count: 2 })).toBeNull();
    expect(calloutFor({ kind: "chain-kill", count: 3 })).toBe("THREE IN ONE");
    expect(calloutFor({ kind: "chain-kill", count: 5 })).toBe("FIVE BREATHS");
    expect(calloutFor({ kind: "chain-kill", count: 99 })).toBe("WHOLE FLOCK");
  });
});

describe("calloutFor — keyed events", () => {
  it("boss-phase looks up the phase string", () => {
    expect(calloutFor({ kind: "boss-phase", phase: "phase-2" })).toBe("HE'S NOT HAPPY");
    expect(calloutFor({ kind: "boss-phase", phase: "low-hp" })).toBe("ONE MORE PUSH");
    expect(calloutFor({ kind: "boss-phase", phase: "unknown" })).toBeNull();
  });

  it("no-damage tier maps to its variant", () => {
    expect(calloutFor({ kind: "no-damage", tier: "easy" })).toBe("CLEAN SHAVE");
    expect(calloutFor({ kind: "no-damage", tier: "hard" })).toBe("GHOST");
  });
});

describe("calloutFor — single-string events", () => {
  it("two-for-one + boss-down", () => {
    expect(calloutFor({ kind: "two-for-one" })).toBe("TWO-FOR-ONE");
    expect(calloutFor({ kind: "boss-down" })).toBe("DOWN. STAY DOWN.");
  });

  it("low-life-kill + last-second-clear + last-shell-kill", () => {
    expect(calloutFor({ kind: "low-life-kill" })).toBe("ONE LIFE LEFT");
    expect(calloutFor({ kind: "last-second-clear" })).toBe("JUST IN TIME");
    expect(calloutFor({ kind: "last-shell-kill" })).toBe("ONE LEFT IN THE TUBE");
  });

  it("no-mods-run + perfect-accuracy + no-waste-shells", () => {
    expect(calloutFor({ kind: "no-mods-run" })).toBe("BARE-KNUCKLE WIN");
    expect(calloutFor({ kind: "perfect-accuracy" })).toBe("EVERY SHOT TOLD");
    expect(calloutFor({ kind: "no-waste-shells" })).toBe("NOT ONE WASTED");
  });

  it("clear-pace flavor: rapid + marathon + boss-only", () => {
    expect(calloutFor({ kind: "rapid-clear" })).toBe("BLOCK CLEARED IN A MINUTE");
    expect(calloutFor({ kind: "marathon-clear" })).toBe("LONG NIGHT, GOOD WORK");
    expect(calloutFor({ kind: "boss-only" })).toBe("STRAIGHT TO THE TOP");
  });

  it("vermin lifetime totals", () => {
    expect(calloutFor({ kind: "vermin-50" })).toBe("FIFTY IN THE BOOK");
    expect(calloutFor({ kind: "vermin-100" })).toBe("A HUNDRED ON THE LEDGER");
    expect(calloutFor({ kind: "vermin-500" })).toBe("FIVE HUNDRED. THE BLOCK SLEEPS BETTER.");
  });
});

describe("calloutFor — corpus floor", () => {
  it("registry holds at least 30 distinct callouts (per directive)", () => {
    expect(totalCalloutCount()).toBeGreaterThanOrEqual(30);
  });
});
