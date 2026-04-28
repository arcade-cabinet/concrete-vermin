import type { Graphics as PixiGraphics } from "pixi.js";
import { useCallback } from "react";
import { useGameStore } from "../runtime/store";

const TRACER = 0xfff0c8;

export function ProjectileLayer() {
  const projectiles = useGameStore((s) => s.projectiles);

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      for (const p of projectiles) {
        g.circle(p.x, p.y, 1.5).fill(TRACER);
        // Trailing line (1-frame estimate)
        const tx = p.x - p.vx * 0.02;
        const ty = p.y - p.vy * 0.02;
        g.moveTo(tx, ty).lineTo(p.x, p.y).stroke({ color: TRACER, width: 1, alpha: 0.6 });
      }
    },
    [projectiles],
  );

  return <pixiGraphics draw={draw} />;
}
