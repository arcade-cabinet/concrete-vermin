import { describe, expect, it } from "vitest";
import { MISSIONS } from "../../missions";
import {
  ALL_MISSION_LORE,
  barks,
  callouts,
  characters,
  deathLineFor,
  deathLines,
  endings,
  frame,
  getMissionLore,
  loadingTips,
  pawnbrokerDebriefFor,
  pickBark,
  pickLoadingTip,
  pickRumor,
  setting,
  talismans,
} from "../index";
import { ARCHETYPE_IDS } from "../../../archetypes/vermin";

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

  it("every mission has a bespoke Pawnbroker debrief for win / loss / sGrade", () => {
    const seen = new Set<string>();
    for (const m of MISSIONS) {
      const lore = getMissionLore(m.id);
      expect(lore.debrief.win.length).toBeGreaterThan(20);
      expect(lore.debrief.loss.length).toBeGreaterThan(20);
      expect(lore.debrief.sGrade.length).toBeGreaterThan(20);
      expect(lore.debrief.win).not.toBe(lore.debrief.loss);
      expect(lore.debrief.win).not.toBe(lore.debrief.sGrade);
      expect(lore.debrief.loss).not.toBe(lore.debrief.sGrade);
      for (const line of [lore.debrief.win, lore.debrief.loss, lore.debrief.sGrade]) {
        expect(seen.has(line)).toBe(false);
        seen.add(line);
      }
    }
  });

  it("pawnbrokerDebriefFor selects the right outcome", () => {
    const m = MISSIONS[0]!;
    const lore = getMissionLore(m.id);
    expect(pawnbrokerDebriefFor(m.id, "win")).toBe(lore.debrief.win);
    expect(pawnbrokerDebriefFor(m.id, "loss")).toBe(lore.debrief.loss);
    expect(pawnbrokerDebriefFor(m.id, "sGrade")).toBe(lore.debrief.sGrade);
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

  it("loadingTips: 30+ entries, picker clamps", () => {
    expect(loadingTips.length).toBeGreaterThanOrEqual(30);
    expect(pickLoadingTip(0)).toBe(loadingTips[0]);
    expect(pickLoadingTip(1.5)).toBe(loadingTips[loadingTips.length - 1]);
  });

  it("deathLines: every archetype has a kill flavor + wipe fallback", () => {
    for (const id of ARCHETYPE_IDS) {
      expect(deathLineFor(id)).not.toBe("He'll find another kid.");
      expect(deathLineFor(id).length).toBeGreaterThan(4);
    }
    expect(deathLines.wipe).toBeTruthy();
    expect(deathLineFor("nonsense-id")).toBe(deathLines.wipe);
  });

  it("callouts: streak tables present + scalar callouts present", () => {
    expect(Object.keys(callouts.killStreak).length).toBeGreaterThanOrEqual(3);
    expect(Object.keys(callouts.headshotStreak).length).toBeGreaterThanOrEqual(2);
    expect(Object.keys(callouts.noReloadStreak).length).toBeGreaterThanOrEqual(2);
    expect(callouts.twoForOne).toBeTruthy();
    expect(callouts.midAir).toBeTruthy();
    expect(callouts.bossDown).toBeTruthy();
  });
});
