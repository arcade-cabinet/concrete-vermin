import type { Graphics as PixiGraphics } from "pixi.js";
import { useCallback } from "react";
import { useGameStore } from "../runtime/store";

const RAT_BODY = 0x3a2e22;
const RAT_EYE = 0xff5b3c;
const ROACH_BODY = 0x1a0f08;
const PIGEON_BODY = 0x6b6b6b;
const VERMIN_DEFAULT = 0x2c1f15;

function colorFor(arche: string): number {
  if (arche === "rat") return RAT_BODY;
  if (arche === "roach") return ROACH_BODY;
  if (arche === "pigeon") return PIGEON_BODY;
  return VERMIN_DEFAULT;
}

export function VerminLayer() {
  const vermin = useGameStore((s) => s.vermin);

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      for (const v of vermin) {
        const c = colorFor(v.archetypeId);
        const w = v.width;
        const h = v.height;
        // Body: rounded ellipse
        g.ellipse(v.x, v.y, w / 2, h / 2).fill(c);
        // Eye glint
        g.circle(v.x + w * 0.18, v.y - h * 0.15, 1.5).fill(RAT_EYE);
      }
    },
    [vermin],
  );

  return <pixiGraphics draw={draw} />;
}
