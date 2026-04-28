import { describe, expect, it } from "vitest";
import { MISSIONS } from "../../missions";
import {
  ALL_MISSION_LORE,
  barks,
  characters,
  endings,
  frame,
  getMissionLore,
  pickBark,
  pickRumor,
  setting,
  talismans,
} from "../index";

describe("lore registry", () => {
  it("setting exposes all three acts", () => {
    expect(Object.keys(setting.acts).sort()).toEqual(["above", "streets", "underworld"]);
  });

  it("characters has pawnbroker + player blocks", () => {
    expect(characters.pawnbroker.fullName).toMatch(/Pellegrino/);
    expect(characters.player.frame).toMatch(/2026|kid/);
  });

  it("endings include good + bad vignettes and grade tables", () => {
    expect(endings.goodEnd.title).toBe("CLEARED");
    expect(endings.badEnd.title).toBe("WIPED OUT");
    expect(Object.keys(endings.victoryByGrade)).toContain("S+");
  });

  it("six talismans, each with story", () => {
    expect(Object.keys(talismans)).toHaveLength(6);
    for (const t of Object.values(talismans)) {
      expect(t.story.length).toBeGreaterThan(40);
    }
  });

  it("twenty-plus pawnbroker barks; ten-plus rumors", () => {
    expect(barks.pawnbroker.length).toBeGreaterThanOrEqual(20);
    expect(barks.rumorMill).toHaveLength(10);
  });

  it("frame names the cabinet plaque", () => {
    expect(frame.cabinetPlaque.join(" ")).toMatch(/Pellegrino/);
  });

  it("every mission in MISSIONS has matching lore", () => {
    for (const m of MISSIONS) {
      const lore = getMissionLore(m.id);
      expect(lore.id).toBe(m.id);
      expect(lore.briefing.length).toBeGreaterThan(40);
    }
    expect(ALL_MISSION_LORE).toHaveLength(MISSIONS.length);
  });

  it("getMissionLore throws on unknown id", () => {
    expect(() => getMissionLore("nope")).toThrow(/unknown mission/);
  });

  it("pickBark / pickRumor clamp uniform input safely", () => {
    expect(pickBark(0)).toBe(barks.pawnbroker[0]);
    expect(pickBark(0.999)).toBe(barks.pawnbroker[barks.pawnbroker.length - 1]);
    expect(pickRumor(-1)).toBe(barks.rumorMill[0]);
    expect(pickRumor(2)).toBe(barks.rumorMill[barks.rumorMill.length - 1]);
  });
});
