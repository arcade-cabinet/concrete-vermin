/**
 * Gamepad bridge. Polls navigator.getGamepads() each frame, maps the
 * standard layout to game actions, and dispatches to a handler. Pure
 * polling — no event listeners, since the Gamepad API only fires
 * connect/disconnect events, not button changes.
 *
 * Layout (standard mapping):
 *   leftStick (axes 0, 1) → reticle aim (relative)
 *   rightTrigger (button 7) → fire (edge-triggered)
 *   leftBumper (button 4) → reload (edge-triggered)
 *   options/start (button 9) → pause (edge-triggered)
 *
 * The button-edge bookkeeping is held inside the bridge so callers
 * just install `installGamepad(handler)` and forget.
 */

export interface GamepadHandler {
  /** Called per polled frame with the current stick deflection (-1..1). */
  onAim(dx: number, dy: number): void;
  /** Edge-triggered: rising edge of the right trigger. */
  onFire(): void;
  /** Edge-triggered: rising edge of the left bumper. */
  onReload(): void;
  /** Edge-triggered: rising edge of the start button. */
  onPause(): void;
}

export interface GamepadOptions {
  /** Stick deadzone fraction (0..1). Defaults to 0.18. */
  deadzone?: number;
  /** Trigger threshold (0..1). Defaults to 0.5. */
  triggerThreshold?: number;
  /** Invert Y axis (settings.invertY). */
  invertY?: boolean;
}

const DEFAULTS: Required<Pick<GamepadOptions, "deadzone" | "triggerThreshold" | "invertY">> = {
  deadzone: 0.18,
  triggerThreshold: 0.5,
  invertY: false,
};

interface ButtonEdge {
  fire: boolean;
  reload: boolean;
  pause: boolean;
}

const initialEdge: ButtonEdge = { fire: false, reload: false, pause: false };

/** Minimum-shape gamepad snapshot — easier to construct in tests than the DOM Gamepad type. */
export interface PadSnapshot {
  axes: ReadonlyArray<number>;
  buttons: ReadonlyArray<{ pressed: boolean; value: number }>;
}

/**
 * Single-frame poll: given a Gamepad snapshot + previous-frame edge
 * state, dispatch actions and return the new edge state. Exported
 * separately so tests can drive a virtual gamepad without touching
 * navigator.
 */
export function pollGamepadFrame(
  gamepad: PadSnapshot,
  prev: ButtonEdge,
  handler: GamepadHandler,
  opts: GamepadOptions = {},
): ButtonEdge {
  const { deadzone, triggerThreshold, invertY } = { ...DEFAULTS, ...opts };
  // Aim — apply radial deadzone (avoids drift on resting sticks) +
  // optional Y inversion.
  const ax = gamepad.axes[0] ?? 0;
  const ayRaw = gamepad.axes[1] ?? 0;
  const ay = invertY ? -ayRaw : ayRaw;
  const mag = Math.hypot(ax, ay);
  if (mag > deadzone) {
    // Re-normalize past the deadzone so 100 % stick = 1.0 magnitude.
    const scale = (mag - deadzone) / (1 - deadzone) / mag;
    handler.onAim(ax * scale, ay * scale);
  } else {
    handler.onAim(0, 0);
  }

  const fireNow = (gamepad.buttons[7]?.value ?? 0) > triggerThreshold;
  const reloadNow = !!(gamepad.buttons[4]?.pressed);
  const pauseNow = !!(gamepad.buttons[9]?.pressed);

  if (fireNow && !prev.fire) handler.onFire();
  if (reloadNow && !prev.reload) handler.onReload();
  if (pauseNow && !prev.pause) handler.onPause();

  return { fire: fireNow, reload: reloadNow, pause: pauseNow };
}

/**
 * Install a rAF-driven gamepad poller. Returns an `uninstall()`
 * function. Safe in node/SSR (no-op if navigator.getGamepads is
 * missing).
 */
export function installGamepad(
  handler: GamepadHandler,
  opts: GamepadOptions = {},
): () => void {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.getGamepads !== "function" ||
    typeof requestAnimationFrame === "undefined"
  ) {
    return () => {};
  }
  let raf = 0;
  let edge: ButtonEdge = { ...initialEdge };
  const tick = () => {
    const pads = navigator.getGamepads();
    for (const pad of pads) {
      if (!pad) continue;
      edge = pollGamepadFrame(pad, edge, handler, opts);
      break; // first connected pad wins
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => {
    if (raf) cancelAnimationFrame(raf);
  };
}
