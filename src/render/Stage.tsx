import type { Graphics as PixiGraphics } from "pixi.js";
import { useCallback } from "react";
import { useGameStore } from "../runtime/store";

/**
 * Stage backdrop: solid asphalt + a brick-tile horizon. Drawn once
 * per render via Graphics.draw callback. Brand palette from STANDARDS:
 * sodium amber + brick + asphalt + subway tile.
 */
const ASPHALT = 0x1a1714;
const BRICK = 0x7a2818;
const SODIUM = 0xd4943a;

export function Stage() {
  const stageW = useGameStore((s) => s.viewport.width);
  const stageH = useGameStore((s) => s.viewport.height);

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      // Asphalt ground
      g.rect(0, 0, stageW, stageH).fill(ASPHALT);
      // Brick wall band, top half
      const wallH = stageH * 0.55;
      g.rect(0, 0, stageW, wallH).fill(BRICK);
      // Sodium streetlight glow at top-center
      g.circle(stageW / 2, wallH * 0.3, 60).fill({ color: SODIUM, alpha: 0.18 });
      // Sidewalk line
      g.rect(0, wallH, stageW, 2).fill(0x0d0c0a);
    },
    [stageW, stageH],
  );

  return <pixiGraphics draw={draw} />;
}
