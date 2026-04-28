import type { Graphics as PixiGraphics } from "pixi.js";
import { useCallback } from "react";
import { useGameStore } from "../runtime/store";

const ASPHALT = 0x1a1714;
const ASPHALT_LIGHT = 0x252018;
const BRICK = 0x7a2818;
const BRICK_DARK = 0x4a1810;
const BRICK_MORTAR = 0x2a1208;
const BRICK_HIGHLIGHT = 0x9a3820;
const SODIUM = 0xd4943a;
const SHADOW = 0x0d0c0a;

const BRICK_W = 24;
const BRICK_H = 8;

export function Stage() {
  const stageW = useGameStore((s) => s.viewport.width);
  const stageH = useGameStore((s) => s.viewport.height);

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      // Asphalt ground
      g.rect(0, 0, stageW, stageH).fill(ASPHALT);
      // Asphalt subtle highlight stripe (where the streetlight pool reaches)
      const wallH = stageH * 0.55;
      g.rect(0, wallH, stageW, stageH * 0.15).fill({ color: ASPHALT_LIGHT, alpha: 0.4 });
      // Brick wall band, top half — base color
      g.rect(0, 0, stageW, wallH).fill(BRICK);
      // Brick hatch: alternate offset rows of bricks with mortar gaps
      for (let y = 0; y < wallH; y += BRICK_H) {
        const rowOffset = (Math.floor(y / BRICK_H) % 2) * (BRICK_W / 2);
        for (let x = -BRICK_W; x < stageW + BRICK_W; x += BRICK_W) {
          const bx = x + rowOffset;
          // Mortar between bricks (vertical dark line)
          g.rect(bx + BRICK_W - 1, y, 1, BRICK_H).fill(BRICK_MORTAR);
          // Top-edge highlight
          g.rect(bx, y, BRICK_W - 1, 1).fill({ color: BRICK_HIGHLIGHT, alpha: 0.4 });
          // Bottom-edge shadow
          g.rect(bx, y + BRICK_H - 1, BRICK_W - 1, 1).fill({ color: BRICK_DARK, alpha: 0.5 });
        }
        // Mortar between rows (horizontal dark line)
        g.rect(0, y + BRICK_H - 1, stageW, 1).fill(BRICK_MORTAR);
      }
      // Sidewalk lip
      g.rect(0, wallH - 1, stageW, 1).fill(SHADOW);
      g.rect(0, wallH, stageW, 2).fill(0x141008);
      // Streetlight pool — concentric rings with falloff
      const lightX = stageW / 2;
      const lightY = wallH * 0.25;
      for (let i = 6; i >= 0; i--) {
        const r = 22 + i * 14;
        const alpha = 0.05 + (1 - i / 6) * 0.18;
        g.circle(lightX, lightY, r).fill({ color: SODIUM, alpha });
      }
      // Sodium ground pool (the cone of light hitting the asphalt)
      const poolY = wallH + 8;
      for (let i = 5; i >= 0; i--) {
        const r = 28 + i * 18;
        const alpha = 0.04 + (1 - i / 5) * 0.12;
        g.ellipse(lightX, poolY, r, r * 0.32).fill({ color: SODIUM, alpha });
      }
    },
    [stageW, stageH],
  );

  return <pixiGraphics draw={draw} />;
}
