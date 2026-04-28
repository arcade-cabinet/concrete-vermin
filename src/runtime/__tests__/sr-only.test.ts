import { describe, expect, it } from "vitest";
import {
  bossDisplayName,
  srBossSpawn,
  srEncounterCheckpoint,
  srMissionComplete,
  srMissionFailed,
  srMissionStart,
} from "../sr-only";

describe("runtime/sr-only narrations", () => {
  it("srMissionStart includes title + weapon, polite urgency", () => {
    const n = srMissionStart("BODEGA BACKROOM", "shotgun");
    expect(n.text).toContain("BODEGA BACKROOM");
    expect(n.text).toContain("Shotgun");
    expect(n.urgency).toBe("polite");
  });

  it("srBossSpawn is assertive + names the boss", () => {
    const n = srBossSpawn("The Pigeon King");
    expect(n.text).toContain("The Pigeon King");
    expect(n.urgency).toBe("assertive");
  });

  it("srMissionComplete includes grade + score (formatted)", () => {
    const n = srMissionComplete("S", 12345);
    expect(n.text).toContain("S");
    expect(n.text).toContain("12,345");
    expect(n.urgency).toBe("assertive");
  });

  it("srMissionFailed is assertive", () => {
    expect(srMissionFailed().urgency).toBe("assertive");
  });

  it("srEncounterCheckpoint reports wave progress", () => {
    const n = srEncounterCheckpoint(2, 3);
    expect(n.text).toContain("2");
    expect(n.text).toContain("3");
  });

  it("bossDisplayName maps every v1 boss + falls back for unknowns", () => {
    expect(bossDisplayName("boss-dumpster-bear")).toBe("The Dumpster Bear");
    expect(bossDisplayName("boss-river-mutant")).toBe("The River Mutant");
    expect(bossDisplayName("boss-pigeon-king")).toBe("The Pigeon King");
    expect(bossDisplayName("boss-mystery")).toBe("boss-mystery");
  });
});
