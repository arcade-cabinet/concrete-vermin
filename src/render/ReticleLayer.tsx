import type { Graphics as PixiGraphics } from "pixi.js";
import { useCallback, useEffect, useState } from "react";
import { useGameStore } from "../runtime/store";
import { COLOR, pixi } from "../theme/colors";

const SODIUM = pixi(COLOR.sodium);

/**
 * Stage-space reticle. The reticle's radius and shape come from the
 * tuned weapon (`reticleRadius`, `reticleShape` published into the
 * store). The shape is the visual; the radius doubles as the tap-to-
 * fire hit-box (see GameStage.fireWithAssist).
 *
 * Pixi handles canvas DPR automatically, but the stage logical width
 * (480 sim units) gets stretched into the viewport — so a 1-unit stroke
 * can fall below 1 CSS px on a 320 px portrait phone. We scale the
 * stroke width by an inverse-of-canvas-scale factor derived from
 * `window.devicePixelRatio`, with a clamped floor so the reticle never
 * falls below ~1.25 CSS px on any display.
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
  return Math.min(1.6, Math.max(1.0, 0.6 + dpr * 0.4));
}

export function ReticleLayer() {
  const reticle = useGameStore((s) => s.reticle);
  const radius = useGameStore((s) => s.reticleRadius);
  const shape = useGameStore((s) => s.reticleShape);
  const k = useReticleScale();

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      const ringW = 1.5 * k;
      const tickW = 1.0 * k;
      const x = reticle.x;
      const y = reticle.y;

      switch (shape) {
        case "cross": {
          const r = radius;
          g.circle(x, y, r).stroke({ color: SODIUM, width: ringW });
          drawTicks(g, x, y, r, tickW);
          break;
        }
        case "ring": {
          const r = radius;
          g.circle(x, y, r).stroke({ color: SODIUM, width: ringW });
          g.circle(x, y, r * 0.4).stroke({ color: SODIUM, width: tickW });
          break;
        }
        case "wide": {
          const r = radius;
          // Open brackets at NSEW, no full ring — feels like a shotgun spread guide.
          const len = r * 0.5;
          const arms: ReadonlyArray<[number, number, number, number]> = [
            [x - r, y, x - r + len, y],
            [x + r - len, y, x + r, y],
            [x, y - r, x, y - r + len],
            [x, y + r - len, x, y + r],
          ];
          for (const [x0, y0, x1, y1] of arms) {
            g.moveTo(x0, y0).lineTo(x1, y1).stroke({ color: SODIUM, width: ringW });
          }
          // Center pip.
          g.circle(x, y, 1.5 * k).fill(SODIUM);
          break;
        }
        case "diamond": {
          const r = radius;
          g.moveTo(x, y - r)
            .lineTo(x + r, y)
            .lineTo(x, y + r)
            .lineTo(x - r, y)
            .lineTo(x, y - r)
            .stroke({ color: SODIUM, width: ringW });
          g.circle(x, y, 1 * k).fill(SODIUM);
          break;
        }
        case "double": {
          // Twin pips offset on the X axis — dual-laser look.
          const offset = radius * 0.9;
          const r = radius * 0.55;
          for (const dx of [-offset, offset]) {
            g.circle(x + dx, y, r).stroke({ color: SODIUM, width: ringW });
            g.circle(x + dx, y, 1 * k).fill(SODIUM);
          }
          break;
        }
      }
    },
    [reticle, radius, shape, k],
  );

  return <pixiGraphics draw={draw} />;
}

function drawTicks(g: PixiGraphics, x: number, y: number, r: number, tickW: number) {
  g.moveTo(x - r - 4, y)
    .lineTo(x - r + 1, y)
    .stroke({ color: SODIUM, width: tickW });
  g.moveTo(x + r - 1, y)
    .lineTo(x + r + 4, y)
    .stroke({ color: SODIUM, width: tickW });
  g.moveTo(x, y - r - 4)
    .lineTo(x, y - r + 1)
    .stroke({ color: SODIUM, width: tickW });
  g.moveTo(x, y + r - 1)
    .lineTo(x, y + r + 4)
    .stroke({ color: SODIUM, width: tickW });
}
