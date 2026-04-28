import { afterEach, describe, expect, it, vi } from "vitest";

// Mock @capacitor/app before importing the module under test so the
// mock takes effect on first import.
const addListener = vi.fn();
vi.mock("@capacitor/app", () => ({
  App: {
    addListener: (...args: unknown[]) => addListener(...args),
  },
}));

import { installAppLifecycle } from "../lifecycle";

afterEach(() => {
  addListener.mockReset();
  // Reset jsdom visibility state by mocking the property between tests.
});

describe("installAppLifecycle", () => {
  it("invokes onPause when document.visibilityState becomes hidden", async () => {
    addListener.mockResolvedValue({ remove: () => {} });
    const onPause = vi.fn();
    const onResume = vi.fn();
    const teardown = installAppLifecycle({ onPause, onResume });
    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(onPause).toHaveBeenCalledTimes(1);
    expect(onResume).not.toHaveBeenCalled();
    teardown();
  });

  it("invokes onResume when visibility becomes visible", () => {
    addListener.mockResolvedValue({ remove: () => {} });
    const onPause = vi.fn();
    const onResume = vi.fn();
    const teardown = installAppLifecycle({ onPause, onResume });
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(onResume).toHaveBeenCalledTimes(1);
    expect(onPause).not.toHaveBeenCalled();
    teardown();
  });

  it("registers a Capacitor App.appStateChange listener", () => {
    addListener.mockResolvedValue({ remove: () => {} });
    installAppLifecycle({ onPause: () => {}, onResume: () => {} });
    expect(addListener).toHaveBeenCalledWith("appStateChange", expect.any(Function));
  });

  it("teardown removes the visibility listener", () => {
    addListener.mockResolvedValue({ remove: () => {} });
    const onPause = vi.fn();
    const teardown = installAppLifecycle({ onPause, onResume: () => {} });
    teardown();
    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(onPause).not.toHaveBeenCalled();
  });

  it("survives Capacitor App rejection (web-only build)", async () => {
    addListener.mockRejectedValue(new Error("not registered"));
    const onPause = vi.fn();
    const onResume = vi.fn();
    expect(() => installAppLifecycle({ onPause, onResume })).not.toThrow();
    // Give the rejected promise a tick to flush.
    await new Promise((r) => setTimeout(r, 0));
    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      configurable: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(onPause).toHaveBeenCalledTimes(1);
  });
});
