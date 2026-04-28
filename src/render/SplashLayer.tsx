import type { Graphics as PixiGraphics } from "pixi.js";
import { useCallback } from "react";
import { useGameStore } from "../runtime/store";

/**
 * Splash burst for kills. Bright cyan-white flash that fades over
 * ttlS — pulpy not gory.
 */
const SPLASH_CORE = 0xfff0c8;
const SPLASH_RING = 0xd4943a;

export function SplashLayer() {
  const splashes = useGameStore((s) => s.splashes);

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      for (const s of splashes) {
        const t = Math.min(1, s.ageS / Math.max(0.001, s.ttlS));
        const r = 4 + 16 * t;
        const alpha = 1 - t;
        g.circle(s.x, s.y, r).stroke({ color: SPLASH_RING, width: 2, alpha });
        g.circle(s.x, s.y, r * 0.4).fill({ color: SPLASH_CORE, alpha: alpha * 0.8 });
      }
    },
    [splashes],
  );

  return <pixiGraphics draw={draw} />;
}
