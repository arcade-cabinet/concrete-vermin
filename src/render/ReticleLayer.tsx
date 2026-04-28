import type { Graphics as PixiGraphics } from "pixi.js";
import { useCallback, useEffect, useState } from "react";
import { useGameStore } from "../runtime/store";
import { COLOR, pixi } from "../theme/colors";

const SODIUM = pixi(COLOR.sodium);

/**
 * Stage-space reticle. Pixi handles canvas DPR automatically, but the
 * stage logical width (480 sim units) gets stretched into the viewport
 * — so a 1-unit stroke can fall below 1 CSS px on a 320 px portrait
 * phone. We scale the stroke width by an inverse-of-canvas-scale factor
 * derived from `window.devicePixelRatio`, with a clamped floor so the
 * reticle never falls below ~1.25 CSS px on any display.
 */
function useReticleScale(): number {
  const [dpr, setDpr] = useState(() =>
    typeof window === "undefined" ? 1 : window.devicePixelRatio || 1,
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setDpr(window.devicePixelRatio || 1);
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  // High-DPR phones: thicken slightly so the cross stays legible.
  // Range 1.0 .. 1.6.
  return Math.min(1.6, Math.max(1.0, 0.6 + dpr * 0.4));
}

export function ReticleLayer() {
  const reticle = useGameStore((s) => s.reticle);
  const k = useReticleScale();

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      const r = 8;
      const ringW = 1.5 * k;
      const tickW = 1.0 * k;
      g.circle(reticle.x, reticle.y, r).stroke({ color: SODIUM, width: ringW });
      g.moveTo(reticle.x - r - 4, reticle.y)
        .lineTo(reticle.x - r + 1, reticle.y)
        .stroke({ color: SODIUM, width: tickW });
      g.moveTo(reticle.x + r - 1, reticle.y)
        .lineTo(reticle.x + r + 4, reticle.y)
        .stroke({ color: SODIUM, width: tickW });
      g.moveTo(reticle.x, reticle.y - r - 4)
        .lineTo(reticle.x, reticle.y - r + 1)
        .stroke({ color: SODIUM, width: tickW });
      g.moveTo(reticle.x, reticle.y + r - 1)
        .lineTo(reticle.x, reticle.y + r + 4)
        .stroke({ color: SODIUM, width: tickW });
    },
    [reticle, k],
  );

  return <pixiGraphics draw={draw} />;
}
