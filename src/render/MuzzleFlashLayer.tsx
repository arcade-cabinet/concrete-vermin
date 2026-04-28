import type { Graphics as PixiGraphics } from "pixi.js";
import { useCallback } from "react";
import { useGameStore } from "../runtime/store";
import { COLOR, pixi } from "../theme/colors";

const SODIUM = pixi(COLOR.sodium);
// Renderer-internal hot-core highlight — sodium-cream, not a brand token.
const FLASH_CORE = 0xfff0c8;

export function MuzzleFlashLayer() {
  const flashes = useGameStore((s) => s.muzzleFlashes);
  const now = useGameStore((s) => s.now);

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      for (const m of flashes) {
        const age = now - m.firedAt;
        if (age < 0 || age >= m.ttlS) continue;
        const t = age / m.ttlS;
        const alpha = 1 - t;
        // Direction unit vector — flash is a triangular cone pointing
        // toward the reticle, scaled down as it fades.
        const dx = m.targetX - m.x;
        const dy = m.targetY - m.y;
        const d = Math.hypot(dx, dy) || 1;
        const ux = dx / d;
        const uy = dy / d;
        // Perpendicular for the cone width.
        const px = -uy;
        const py = ux;
        const len = 28 * (1 - t * 0.4);
        const half = 8 * (1 - t * 0.4);
        const tipX = m.x + ux * len;
        const tipY = m.y + uy * len;
        const baseLX = m.x + px * half;
        const baseLY = m.y + py * half;
        const baseRX = m.x - px * half;
        const baseRY = m.y - py * half;
        // Outer cone (sodium amber)
        g.moveTo(baseLX, baseLY)
          .lineTo(tipX, tipY)
          .lineTo(baseRX, baseRY)
          .closePath()
          .fill({ color: SODIUM, alpha: alpha * 0.85 });
        // Inner hot core
        const coreLen = len * 0.55;
        const coreHalf = half * 0.4;
        g.moveTo(m.x + px * coreHalf, m.y + py * coreHalf)
          .lineTo(m.x + ux * coreLen, m.y + uy * coreLen)
          .lineTo(m.x - px * coreHalf, m.y - py * coreHalf)
          .closePath()
          .fill({ color: FLASH_CORE, alpha });
        // Spark dot at the muzzle origin
        g.circle(m.x, m.y, 3 * (1 - t)).fill({ color: FLASH_CORE, alpha });
      }
    },
    [flashes, now],
  );

  return <pixiGraphics draw={draw} />;
}
