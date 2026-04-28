/**
 * Render + interaction smokes for every redesigned UI surface.
 * Complements a11y.dom.test.tsx (axe-only) with: routing wires fire
 * correctly on click, dialogs open/close, settings mutate the store,
 * Toast dispatcher subscribes/unsubscribes cleanly.
 */
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useGameStore } from "../../runtime/store";
import { Briefing } from "../Briefing";
import { Credits } from "../Credits";
import { MainMenu } from "../MainMenu";
import { MissionResult } from "../MissionResult";
import { MissionSelect } from "../MissionSelect";
import { PawnShop } from "../PawnShop";
import { SettingsDialog } from "../SettingsDialog";
import { ToastHost, toast } from "../Toast";

beforeEach(() => {
  useGameStore.setState({ phase: "main-menu", missionId: "", missionAct: "streets" });
});

afterEach(() => {
  // Reset settings to defaults so cross-test mutations don't leak.
  useGameStore.setState({
    settings: {
      crtOverlay: false,
      masterVolumeDb: -6,
      musicVolumeDb: -12,
      sfxVolumeDb: -4,
      uiVolumeDb: -8,
      muted: false,
      reducedMotion: false,
      highContrast: false,
      haptics: true,
      aimAssist: false,
      invertY: false,
    },
  });
});

describe("MainMenu", () => {
  it("renders title + Press Start, routes to briefing for new players", () => {
    const { unmount } = render(<MainMenu />);
    expect(screen.getByTestId("main-menu")).toBeTruthy();
    const start = screen.getByTestId("main-menu-start");
    fireEvent.click(start);
    expect(useGameStore.getState().phase).toBe("briefing");
    unmount();
  });

  it("opens the Settings dialog when Settings is clicked", () => {
    const { unmount } = render(<MainMenu />);
    fireEvent.click(screen.getByRole("button", { name: /settings/i }));
    expect(screen.getByTestId("settings-dialog")).toBeTruthy();
    unmount();
  });

  it("routes to credits when Credits is clicked", () => {
    const { unmount } = render(<MainMenu />);
    fireEvent.click(screen.getByRole("button", { name: /credits/i }));
    expect(useGameStore.getState().phase).toBe("credits");
    unmount();
  });
});

describe("Briefing", () => {
  it("renders the newspaper headline + Begin auto-focused", () => {
    const { unmount } = render(<Briefing />);
    expect(screen.getByText(/bodega overrun/i)).toBeTruthy();
    const begin = screen.getByRole("button", { name: /begin/i });
    expect(document.activeElement).toBe(begin);
    unmount();
  });
});

describe("MissionSelect", () => {
  it("renders subway-map stops and fires onPickMission", () => {
    let picked: string | null = null;
    const { unmount } = render(<MissionSelect onPickMission={(id) => (picked = id)} />);
    const deploy = screen.getByRole("button", { name: /^deploy\b/i });
    fireEvent.click(deploy);
    expect(picked).not.toBeNull();
    unmount();
  });
});

describe("PawnShop", () => {
  it("renders the wood-counter UI with portrait and Deploy CTA", () => {
    let continued = false;
    const { unmount } = render(
      <PawnShop onContinue={() => (continued = true)} onBack={() => {}} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /^deploy\b/i }));
    expect(continued).toBe(true);
    unmount();
  });
});

describe("MissionResult (won)", () => {
  it("renders the tabloid headline 'Cleared' + Next Mission CTA", () => {
    useGameStore.setState({ phase: "won", missionId: "streets-01-bodega" });
    const { unmount } = render(<MissionResult />);
    expect(screen.getByRole("heading", { level: 1, name: /cleared/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /next mission/i })).toBeTruthy();
    unmount();
  });
});

describe("Credits", () => {
  it("renders role attribution and a back button that returns to main-menu", () => {
    useGameStore.setState({ phase: "credits" });
    const { unmount } = render(<Credits />);
    expect(screen.getByText(/credits/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(useGameStore.getState().phase).toBe("main-menu");
    unmount();
  });
});

describe("SettingsDialog", () => {
  it("renders categories and persists toggle changes to store", () => {
    const { unmount } = render(<SettingsDialog open={true} onOpenChange={() => {}} />);
    // Audio category opens by default — Mute switch visible.
    const muteSwitch = screen.getByLabelText(/mute audio/i);
    fireEvent.click(muteSwitch);
    expect(useGameStore.getState().settings.muted).toBe(true);
    unmount();
  });

  it("opens additional categories on click", () => {
    const { unmount } = render(<SettingsDialog open={true} onOpenChange={() => {}} />);
    const visualHeader = screen.getByRole("button", { name: /visual/i });
    fireEvent.click(visualHeader);
    // CRT toggle is in Visual category.
    expect(screen.getByLabelText(/crt overlay/i)).toBeTruthy();
    unmount();
  });

  it("toggles aim assist via Input category", () => {
    const { unmount } = render(<SettingsDialog open={true} onOpenChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /input/i }));
    fireEvent.click(screen.getByLabelText(/^aim assist$/i));
    expect(useGameStore.getState().settings.aimAssist).toBe(true);
    unmount();
  });
});

describe("Toast", () => {
  it("ToastHost renders dispatched toasts and subscribers receive events", async () => {
    const { unmount, container } = render(<ToastHost />);
    await act(async () => {
      toast("Mission cleared", { kind: "win" });
    });
    const items = await within(document.body).findAllByText(/mission cleared/i);
    expect(items.length).toBeGreaterThan(0);
    expect(container).toBeTruthy();
    unmount();
  });
});
