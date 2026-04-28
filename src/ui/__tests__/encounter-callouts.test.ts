import { describe, expect, it } from "vitest";
import { calloutFor } from "../copy/encounter-callouts";

describe("calloutFor", () => {
  it("kill-streak: returns highest milestone <= count", () => {
    expect(calloutFor({ kind: "kill-streak", count: 3 })).toBeNull();
    expect(calloutFor({ kind: "kill-streak", count: 5 })).toBe("ON THE BOARD");
    expect(calloutFor({ kind: "kill-streak", count: 12 })).toBe("ROLLING");
    expect(calloutFor({ kind: "kill-streak", count: 100 })).toBe("WHOLE BOROUGH");
  });

  it("headshot-streak honors the 3 / 5 / 10 ladder", () => {
    expect(calloutFor({ kind: "headshot-streak", count: 2 })).toBeNull();
    expect(calloutFor({ kind: "headshot-streak", count: 3 })).toBe("EYE FOR IT");
    expect(calloutFor({ kind: "headshot-streak", count: 7 })).toBe("SURGEON");
    expect(calloutFor({ kind: "headshot-streak", count: 10 })).toBe("PAWNBROKER WOULD APPROVE");
  });

  it("scalar callouts return their literal", () => {
    expect(calloutFor({ kind: "two-for-one" })).toBe("TWO-FOR-ONE");
    expect(calloutFor({ kind: "boss-down" })).toBe("DOWN. STAY DOWN.");
  });
});
