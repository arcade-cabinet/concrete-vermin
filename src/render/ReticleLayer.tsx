import type { Graphics as PixiGraphics } from "pixi.js";
import { useCallback } from "react";
import { useGameStore } from "../runtime/store";

const SODIUM = 0xd4943a;

export function ReticleLayer() {
  const reticle = useGameStore((s) => s.reticle);

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      const r = 8;
      g.circle(reticle.x, reticle.y, r).stroke({ color: SODIUM, width: 1.5 });
      g.moveTo(reticle.x - r - 4, reticle.y)
        .lineTo(reticle.x - r + 1, reticle.y)
        .stroke({ color: SODIUM, width: 1 });
      g.moveTo(reticle.x + r - 1, reticle.y)
        .lineTo(reticle.x + r + 4, reticle.y)
        .stroke({ color: SODIUM, width: 1 });
      g.moveTo(reticle.x, reticle.y - r - 4)
        .lineTo(reticle.x, reticle.y - r + 1)
        .stroke({ color: SODIUM, width: 1 });
      g.moveTo(reticle.x, reticle.y + r - 1)
        .lineTo(reticle.x, reticle.y + r + 4)
        .stroke({ color: SODIUM, width: 1 });
    },
    [reticle],
  );

  return <pixiGraphics draw={draw} />;
}
