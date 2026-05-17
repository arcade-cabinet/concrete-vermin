/**
 * HUD charge bar: appears under SHELLS while chargeProgress is non-null,
 * hidden when null, suppressed during reload, suppressed under reduced
 * motion. Mirrors the parallel reload bar pattern.
 */
import { render } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ArcadeFrame } from "../ArcadeFrame";
import { useGameStore } from "../../runtime/store";

function setHud(patch: Partial<ReturnType<typeof useGameStore.getState>>) {
  act(() => {
    useGameStore.setState(patch);
  });
}

beforeEach(() => {
  useGameStore.setState({
    phase: "playing",
    chargeProgress: null,
    reloadProgress: null,
    settings: { ...useGameStore.getState().settings, reducedMotion: false },
  });
});

afterEach(() => {
  useGameStore.setState({ chargeProgress: null, reloadProgress: null });
});

describe("HUD charge progress bar", () => {
  it("is hidden when chargeProgress is null", () => {
    const { container, unmount } = render(
      <ArcadeFrame>
        <div />
      </ArcadeFrame>,
    );
    expect(container.querySelector('[data-testid="hud-charge-bar"]')).toBeNull();
    unmount();
  });

  it("renders with role=progressbar when chargeProgress > 0", () => {
    const { container, unmount } = render(
      <ArcadeFrame>
        <div />
      </ArcadeFrame>,
    );
    setHud({ chargeProgress: 0.42 });
    const bar = container.querySelector('[data-testid="hud-charge-bar"]');
    expect(bar).not.toBeNull();
    expect(bar?.getAttribute("aria-valuenow")).toBe("42");
    expect(bar?.getAttribute("role")).toBe("progressbar");
    unmount();
  });

  it("is suppressed while reloadProgress is active (reload wins)", () => {
    const { container, unmount } = render(
      <ArcadeFrame>
        <div />
      </ArcadeFrame>,
    );
    setHud({ chargeProgress: 0.5, reloadProgress: 0.3 });
    expect(container.querySelector('[data-testid="hud-charge-bar"]')).toBeNull();
    unmount();
  });

  it("is suppressed under reduced motion", () => {
    const { container, unmount } = render(
      <ArcadeFrame>
        <div />
      </ArcadeFrame>,
    );
    setHud({
      chargeProgress: 0.5,
      settings: { ...useGameStore.getState().settings, reducedMotion: true },
    });
    expect(container.querySelector('[data-testid="hud-charge-bar"]')).toBeNull();
    unmount();
  });
});
