import { useEffect, useRef, useState } from "react";
import { sampleShake } from "../../runtime/screenShake";
import { useGameStore } from "../../runtime/store";
import { usePrefersReducedMotion } from "./useViewport";

interface ShakeState {
  dx: number;
  dy: number;
}

/**
 * Drains src/runtime/screenShake's event registry into a decaying
 * transform offset. The runner pushes per-event shakes (kill 4 px,
 * bossHit 8 px, bossDeath 16 px); this hook samples cumulative
 * amplitude per frame.
 *
 * Honors reduced-motion (settings flag OR OS) by clamping to (0, 0).
 */
export function useScreenShake(): ShakeState {
  const reducedFromOs = usePrefersReducedMotion();
  const reducedFromSettings = useGameStore((s) => s.settings.reducedMotion);
  const reduced = reducedFromOs || reducedFromSettings;

  const [shake, setShake] = useState<ShakeState>({ dx: 0, dy: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) {
      setShake({ dx: 0, dy: 0 });
      return;
    }
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      setShake(sampleShake(performance.now(), false));
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
