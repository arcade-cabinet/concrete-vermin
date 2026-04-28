/**
 * DOM tests for GameStage charge-shot input wiring (Phase 2.6).
 *
 * Tests pointer (tap vs hold) and keyboard (Space short vs long) dispatch.
 * The GameRunner is mocked so no real simulation runs.
 */
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks — vi.hoisted runs before module resolution so that the
// mockRunner object is available inside the vi.mock factory below.
// ---------------------------------------------------------------------------

const { mockRunner } = vi.hoisted(() => {
  const mockRunner = {
    queueShot: vi.fn(),
    queueChargeStart: vi.fn(),
    queueChargeRelease: vi.fn(),
    queueReload: vi.fn(),
    step: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    isPaused: vi.fn(() => false),
  };
  return { mockRunner };
});

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@pixi/react", () => ({
  Application: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pixi-app">{children}</div>
  ),
  useTick: (_cb: () => void) => {},
}));

vi.mock("../../render/extend", () => ({}));
vi.mock("../../render/Stage", () => ({ Stage: () => null }));
vi.mock("../../render/VerminLayer", () => ({ VerminLayer: () => null }));
vi.mock("../../render/ProjectileLayer", () => ({ ProjectileLayer: () => null }));
vi.mock("../../render/MuzzleFlashLayer", () => ({ MuzzleFlashLayer: () => null }));
vi.mock("../../render/NapalmPoolLayer", () => ({ NapalmPoolLayer: () => null }));
vi.mock("../../render/SplashLayer", () => ({ SplashLayer: () => null }));
vi.mock("../../render/HudOverlay", () => ({ HudOverlay: () => null }));
vi.mock("../../render/ReticleLayer", () => ({ ReticleLayer: () => null }));
vi.mock("../../render/CRTOverlay", () => ({ CRTOverlay: () => null }));
vi.mock("../hooks/useScreenShake", () => ({
  useScreenShake: () => ({ dx: 0, dy: 0 }),
}));
vi.mock("../LoadingSplash", () => ({ LoadingSplash: () => null }));
vi.mock("../PlayerProgress", () => ({
  usePlayerProgress: Object.assign(() => ({ activeMods: [] }), {
    getState: () => ({ activeMods: [] }),
  }),
}));
vi.mock("../../platform/lifecycle", () => ({
  installAppLifecycle: () => () => {},
}));
vi.mock("../../input/aimAssist", () => ({
  applyAimAssist: (x: number, y: number) => ({ x, y }),
}));
vi.mock("../../input/gamepad", () => ({
  installGamepad: (_handler: unknown) => () => {},
}));
vi.mock("../../sim/content/missions", () => ({
  getMission: () => ({
    id: "streets-01-bodega",
    act: "streets",
    waves: [],
    duration: 60,
    par: { killTarget: 5, timeLimit: 60 },
  }),
}));
vi.mock("../../runtime/runner", () => ({
  GameRunner: class {
    queueShot = mockRunner.queueShot;
    queueChargeStart = mockRunner.queueChargeStart;
    queueChargeRelease = mockRunner.queueChargeRelease;
    queueReload = mockRunner.queueReload;
    step = mockRunner.step;
    pause = mockRunner.pause;
    resume = mockRunner.resume;
    isPaused = mockRunner.isPaused;
  },
}));

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import { useGameStore } from "../../runtime/store";
import { GameStage } from "../GameStage";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PLAYING_STATE = {
  phase: "playing" as const,
  missionId: "streets-01-bodega",
  missionAct: "streets" as const,
  reticle: { x: 240, y: 135 },
  reticleRadius: 20,
  reticleShape: "cross" as const,
  chargeProgress: null as number | null,
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
};

function renderPlaying() {
  useGameStore.setState(PLAYING_STATE);
  return render(<GameStage />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GameStage pointer charge input", () => {
  it("short tap (< 80ms): calls queueChargeStart on down, queueShot on up (not queueChargeRelease)", () => {
    const { unmount, getByTestId } = renderPlaying();
    const stage = getByTestId("game-stage");

    act(() => {
      fireEvent.pointerDown(stage, {
        clientX: 240,
        clientY: 135,
        button: 0,
        pointerType: "mouse",
      });
    });
    vi.advanceTimersByTime(40);
    act(() => {
      fireEvent.pointerUp(stage, {
        clientX: 240,
        clientY: 135,
        button: 0,
        pointerType: "mouse",
      });
    });

    expect(mockRunner.queueChargeStart).toHaveBeenCalledOnce();
    expect(mockRunner.queueShot).toHaveBeenCalledOnce();
    expect(mockRunner.queueChargeRelease).not.toHaveBeenCalled();
    unmount();
  });

  it("long hold (>= 80ms): calls queueChargeStart on down, queueChargeRelease on up", () => {
    const { unmount, getByTestId } = renderPlaying();
    const stage = getByTestId("game-stage");

    act(() => {
      fireEvent.pointerDown(stage, {
        clientX: 240,
        clientY: 135,
        button: 0,
        pointerType: "mouse",
      });
    });
    vi.advanceTimersByTime(100);
    act(() => {
      fireEvent.pointerUp(stage, {
        clientX: 240,
        clientY: 135,
        button: 0,
        pointerType: "mouse",
      });
    });

    expect(mockRunner.queueChargeStart).toHaveBeenCalledOnce();
    expect(mockRunner.queueChargeRelease).toHaveBeenCalledOnce();
    expect(mockRunner.queueShot).not.toHaveBeenCalled();
    unmount();
  });
});

describe("GameStage keyboard Space charge input", () => {
  it("Space keydown+keyup short (< 80ms): calls queueChargeStart + queueShot", () => {
    const { unmount } = renderPlaying();

    act(() => {
      fireEvent.keyDown(window, { key: " " });
    });
    vi.advanceTimersByTime(40);
    act(() => {
      fireEvent.keyUp(window, { key: " " });
    });

    expect(mockRunner.queueChargeStart).toHaveBeenCalledOnce();
    expect(mockRunner.queueShot).toHaveBeenCalledOnce();
    expect(mockRunner.queueChargeRelease).not.toHaveBeenCalled();
    unmount();
  });

  it("Space keydown+keyup long (>= 80ms): calls queueChargeStart + queueChargeRelease", () => {
    const { unmount } = renderPlaying();

    act(() => {
      fireEvent.keyDown(window, { key: " " });
    });
    vi.advanceTimersByTime(100);
    act(() => {
      fireEvent.keyUp(window, { key: " " });
    });

    expect(mockRunner.queueChargeStart).toHaveBeenCalledOnce();
    expect(mockRunner.queueChargeRelease).toHaveBeenCalledOnce();
    expect(mockRunner.queueShot).not.toHaveBeenCalled();
    unmount();
  });
});
