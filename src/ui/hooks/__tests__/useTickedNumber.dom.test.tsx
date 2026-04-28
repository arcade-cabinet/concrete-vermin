import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTickedNumber } from "../useTickedNumber";

describe("useTickedNumber", () => {
  it("returns the target immediately when instant=true", () => {
    const { result, rerender } = renderHook(
      ({ t }: { t: number }) => useTickedNumber(t, { instant: true }),
      { initialProps: { t: 0 } },
    );
    expect(result.current).toBe(0);
    rerender({ t: 1000 });
    expect(result.current).toBe(1000);
  });

  it("starts at the previous target before the first frame", () => {
    const { result, rerender } = renderHook(({ t }: { t: number }) => useTickedNumber(t), {
      initialProps: { t: 0 },
    });
    rerender({ t: 100 });
    // No rAF tick yet — still showing the old value.
    expect(result.current).toBe(0);
  });

  it("animation snaps to instant when reduced-motion flips on mid-flight", () => {
    const { result, rerender } = renderHook(
      ({ t, instant }: { t: number; instant: boolean }) => useTickedNumber(t, { instant }),
      { initialProps: { t: 0, instant: false } },
    );
    rerender({ t: 500, instant: false });
    expect(result.current).toBe(0);
    // Caller flips to instant — value jumps.
    rerender({ t: 500, instant: true });
    expect(result.current).toBe(500);
  });

  it("does not throw when target equals current", () => {
    const { result, rerender } = renderHook(({ t }: { t: number }) => useTickedNumber(t), {
      initialProps: { t: 42 },
    });
    expect(result.current).toBe(42);
    rerender({ t: 42 });
    expect(result.current).toBe(42);
  });

  // Sanity: vi.fn exists (the import isn't dead).
  it("vi mock available (sanity)", () => {
    expect(typeof vi.fn).toBe("function");
  });
});
