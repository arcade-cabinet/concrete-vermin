import { describe, expect, it, vi } from "vitest";
import { pollGamepadFrame } from "../gamepad";

const makePad = (
  axes: number[],
  buttons: { pressed: boolean; value: number }[],
): { axes: readonly number[]; buttons: readonly { pressed: boolean; value: number }[] } =>
  Object.freeze({ axes, buttons });

const handler = () => ({
  onAim: vi.fn(),
  onFire: vi.fn(),
  onReload: vi.fn(),
  onPause: vi.fn(),
});

describe("input/gamepad pollGamepadFrame", () => {
  it("dispatches stick aim past the deadzone", () => {
    const h = handler();
    const buttons = Array.from({ length: 16 }, () => ({ pressed: false, value: 0 }));
    pollGamepadFrame(
      makePad([0.6, -0.4], buttons),
      { fire: false, reload: false, pause: false },
      h,
    );
    expect(h.onAim).toHaveBeenCalledOnce();
    const [dx, dy] = h.onAim.mock.calls[0]!;
    expect(Math.abs(dx)).toBeGreaterThan(0);
    expect(Math.abs(dy)).toBeGreaterThan(0);
  });

  it("zeros stick aim inside the deadzone", () => {
    const h = handler();
    const buttons = Array.from({ length: 16 }, () => ({ pressed: false, value: 0 }));
    pollGamepadFrame(
      makePad([0.05, 0.05], buttons),
      { fire: false, reload: false, pause: false },
      h,
    );
    expect(h.onAim).toHaveBeenCalledWith(0, 0);
  });

  it("invertY flips the Y axis when set", () => {
    const h1 = handler();
    const h2 = handler();
    const buttons = Array.from({ length: 16 }, () => ({ pressed: false, value: 0 }));
    pollGamepadFrame(makePad([0, 0.6], buttons), { fire: false, reload: false, pause: false }, h1, {
      invertY: false,
    });
    pollGamepadFrame(makePad([0, 0.6], buttons), { fire: false, reload: false, pause: false }, h2, {
      invertY: true,
    });
    const [, dy1] = h1.onAim.mock.calls[0]!;
    const [, dy2] = h2.onAim.mock.calls[0]!;
    expect(Math.sign(dy1)).toBe(-Math.sign(dy2));
  });

  it("fires onFire on the rising edge of the right trigger", () => {
    const h = handler();
    const buttons = Array.from({ length: 16 }, () => ({ pressed: false, value: 0 }));
    buttons[7] = { pressed: true, value: 0.9 };
    const e1 = pollGamepadFrame(
      makePad([0, 0], buttons),
      { fire: false, reload: false, pause: false },
      h,
    );
    expect(h.onFire).toHaveBeenCalledOnce();
    // Holding the trigger down should NOT fire again.
    pollGamepadFrame(makePad([0, 0], buttons), e1, h);
    expect(h.onFire).toHaveBeenCalledOnce();
  });

  it("fires onReload on the rising edge of the left bumper", () => {
    const h = handler();
    const buttons = Array.from({ length: 16 }, () => ({ pressed: false, value: 0 }));
    buttons[4] = { pressed: true, value: 1 };
    pollGamepadFrame(makePad([0, 0], buttons), { fire: false, reload: false, pause: false }, h);
    expect(h.onReload).toHaveBeenCalledOnce();
  });

  it("fires onPause on the rising edge of the start button", () => {
    const h = handler();
    const buttons = Array.from({ length: 16 }, () => ({ pressed: false, value: 0 }));
    buttons[9] = { pressed: true, value: 1 };
    pollGamepadFrame(makePad([0, 0], buttons), { fire: false, reload: false, pause: false }, h);
    expect(h.onPause).toHaveBeenCalledOnce();
  });

  it("returns updated edge state for the next frame", () => {
    const h = handler();
    const buttons = Array.from({ length: 16 }, () => ({ pressed: false, value: 0 }));
    buttons[4] = { pressed: true, value: 1 };
    const next = pollGamepadFrame(
      makePad([0, 0], buttons),
      { fire: false, reload: false, pause: false },
      h,
    );
    expect(next.reload).toBe(true);
    expect(next.fire).toBe(false);
  });
});
