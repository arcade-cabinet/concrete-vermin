import { useEffect, useRef, useState } from "react";

const DEFAULT_DURATION_MS = 200;

/**
 * Animate a displayed integer from its previous value to `target` over
 * `durationMs`. Uses requestAnimationFrame; ease-out so the tick starts
 * fast and decelerates into place. When the caller passes `instant`
 * (e.g. honoring prefers-reduced-motion), the animation is short-
 * circuited and the displayed value snaps to `target`.
 *
 * Pure presentational: never updates the source of truth. Read it as
 * "what number should I draw on screen this frame." See docs/DESIGN.md
 * "HUD style guide → Score tick-up".
 */
export function useTickedNumber(
  target: number,
  options: { durationMs?: number; instant?: boolean } = {},
): number {
  const { durationMs = DEFAULT_DURATION_MS, instant = false } = options;
  const [displayed, setDisplayed] = useState(target);
  // Mirror `displayed` into a ref so the animation effect can read the
  // current value without depending on it (which would restart every
  // frame).
  const displayedRef = useRef(target);
  displayedRef.current = displayed;

  const fromRef = useRef(target);
  const startRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const current = displayedRef.current;
    if (instant || current === target) {
      if (current !== target) setDisplayed(target);
      return;
    }
    fromRef.current = current;
    startRef.current = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / durationMs);
      // Ease-out cubic. Starts fast, decelerates into place.
      const eased = 1 - (1 - t) * (1 - t) * (1 - t);
      const value = Math.round(fromRef.current + (target - fromRef.current) * eased);
      setDisplayed(value);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs, instant]);

  return displayed;
}
