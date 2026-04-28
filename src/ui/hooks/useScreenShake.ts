import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../../runtime/store";
import { usePrefersReducedMotion } from "./useViewport";

const SHAKE_DURATION_MS = 80;
const SHAKE_AMPLITUDE_PX = 4;

interface ShakeState {
  /** Pixel offset to apply to the stage container (transform: translate). */
  dx: number;
  dy: number;
}

/**
 * Trigger a small, brief screen-shake whenever the player's killCount
 * increases. ~80 ms decay; amplitude scales linearly with remaining
 * lifetime. Honors reduced-motion (settings flag OR OS) by short-
 * circuiting to a no-op (always returns {dx:0,dy:0}).
 *
 * Stays a UI-layer concern: the renderer is unaware of shake; only the
 * containing div translates so the Pixi canvas moves with it.
 */
export function useScreenShake(): ShakeState {
  const killCount = useGameStore((s) => s.killCount);
  const reducedFromOs = usePrefersReducedMotion();
  const reducedFromSettings = useGameStore((s) => s.settings.reducedMotion);
  const reduced = reducedFromOs || reducedFromSettings;

  const [shake, setShake] = useState<ShakeState>({ dx: 0, dy: 0 });
  const prevKillsRef = useRef(killCount);
  const startedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Trigger on kill count rising. Reset baseline when it drops (mission
  // restart sets killCount back to 0).
  useEffect(() => {
    if (killCount <= prevKillsRef.current) {
      prevKillsRef.current = killCount;
      return;
    }
    prevKillsRef.current = killCount;
    if (reduced) return;
    startedAtRef.current = performance.now();
  }, [killCount, reduced]);

  useEffect(() => {
    if (reduced) {
      setShake({ dx: 0, dy: 0 });
      return;
    }
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      const startedAt = startedAtRef.current;
      if (startedAt === null) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const t = (performance.now() - startedAt) / SHAKE_DURATION_MS;
      if (t >= 1) {
        startedAtRef.current = null;
        setShake({ dx: 0, dy: 0 });
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      // Decaying random offset. Math.random is fine here — visual jitter
      // doesn't need to be deterministic and isn't sim-reachable.
      const decay = 1 - t;
      const a = SHAKE_AMPLITUDE_PX * decay;
      setShake({
        dx: (Math.random() * 2 - 1) * a,
        dy: (Math.random() * 2 - 1) * a,
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [reduced]);

  return shake;
}
