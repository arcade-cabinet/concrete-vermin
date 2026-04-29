/**
 * Axe-core a11y smoke for each player-facing screen. Renders the
 * component into jsdom, runs axe with WCAG 2.1 AA rules enabled,
 * and asserts no violations.
 *
 * The DOM environment doesn't paint, so axe's color-contrast rule is
 * skipped (it needs a real renderer). Real-pixel contrast is covered
 * by the lighthouse audit on the Pages preview in CI.
 */
import { render } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { useGameStore } from "../../runtime/store";
import { Briefing } from "../Briefing";
import { Credits } from "../Credits";
import { MainMenu } from "../MainMenu";
import { MissionResult } from "../MissionResult";
import { MissionSelect } from "../MissionSelect";
import { PawnShop } from "../PawnShop";
import { SrLiveRegion } from "../SrLiveRegion";

async function runAxe(container: HTMLElement) {
  const result = await axe.run(container, {
    rules: {
      // Color contrast can't be evaluated without painting.
      "color-contrast": { enabled: false },
      // jsdom's offset measurements are zeroed → these false-positive.
      "scrollable-region-focusable": { enabled: false },
      region: { enabled: false },
    },
  });
  return result.violations;
}

afterEach(() => {
  useGameStore.setState({ phase: "main-menu", missionId: "", missionAct: "streets" });
});

describe("a11y axe smoke", () => {
  it("MainMenu has no axe violations", async () => {
    const { container, unmount } = render(<MainMenu />);
    const v = await runAxe(container);
    expect(v, JSON.stringify(v, null, 2)).toEqual([]);
    unmount();
  });

  it("Credits has no axe violations", async () => {
    const { container, unmount } = render(<Credits />);
    const v = await runAxe(container);
    expect(v, JSON.stringify(v, null, 2)).toEqual([]);
    unmount();
  });

  it("MissionSelect has no axe violations", async () => {
    const { container, unmount } = render(<MissionSelect onPickMission={() => {}} />);
    const v = await runAxe(container);
    expect(v, JSON.stringify(v, null, 2)).toEqual([]);
    unmount();
  });

  it("PawnShop has no axe violations", async () => {
    const { container, unmount } = render(<PawnShop onContinue={() => {}} onBack={() => {}} />);
    const v = await runAxe(container);
    expect(v, JSON.stringify(v, null, 2)).toEqual([]);
    unmount();
  });

  it("Briefing has no axe violations", async () => {
    const { container, unmount } = render(<Briefing />);
    const v = await runAxe(container);
    expect(v, JSON.stringify(v, null, 2)).toEqual([]);
    unmount();
  });

  it("MissionResult (won) has no axe violations", async () => {
    useGameStore.setState({ phase: "won", missionId: "streets-01-bodega" });
    const { container, unmount } = render(<MissionResult />);
    const v = await runAxe(container);
    expect(v, JSON.stringify(v, null, 2)).toEqual([]);
    unmount();
  });

  it("SrLiveRegion has no axe violations", async () => {
    const { container, unmount } = render(<SrLiveRegion />);
    const v = await runAxe(container);
    expect(v, JSON.stringify(v, null, 2)).toEqual([]);
    unmount();
  });
});
