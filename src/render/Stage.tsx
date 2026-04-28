import type { Graphics as PixiGraphics } from "pixi.js";
import { useCallback } from "react";
import { useGameStore } from "../runtime/store";
import { COLOR, pixi } from "../theme/colors";
import { actLightFor } from "./effects/actLighting";

const ASPHALT = pixi(COLOR.bgConcreteDark);
const BRICK = pixi(COLOR.brick);
const BRICK_HIGHLIGHT = pixi(COLOR.brickHighlight);
const SHADOW = pixi(COLOR.bgAsphalt);

const ASPHALT_LIGHT = 0x252018;
const BRICK_DARK = 0x4a1810;
const BRICK_MORTAR = 0x2a1208;
const SIDEWALK_SHADOW = 0x141008;

const BRICK_W = 24;
const BRICK_H = 8;

export function Stage() {
  const stageW = useGameStore((s) => s.viewport.width);
  const stageH = useGameStore((s) => s.viewport.height);
  const act = useGameStore((s) => s.missionAct);
  const palette = actLightFor(act);

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      // Asphalt ground.
      g.rect(0, 0, stageW, stageH).fill(ASPHALT);
      const wallH = stageH * 0.55;
      g.rect(0, wallH, stageW, stageH * 0.15).fill({ color: ASPHALT_LIGHT, alpha: 0.4 });
      // Brick wall band — base color (act may tint it cooler/sicker).
      const brickBase = palette.brickTint ?? BRICK;
      g.rect(0, 0, stageW, wallH).fill(brickBase);
      // Brick hatch pattern.
      for (let y = 0; y < wallH; y += BRICK_H) {
        const rowOffset = (Math.floor(y / BRICK_H) % 2) * (BRICK_W / 2);
        for (let x = -BRICK_W; x < stageW + BRICK_W; x += BRICK_W) {
          const bx = x + rowOffset;
          g.rect(bx + BRICK_W - 1, y, 1, BRICK_H).fill(BRICK_MORTAR);
          g.rect(bx, y, BRICK_W - 1, 1).fill({ color: BRICK_HIGHLIGHT, alpha: 0.4 });
          g.rect(bx, y + BRICK_H - 1, BRICK_W - 1, 1).fill({ color: BRICK_DARK, alpha: 0.5 });
        }
        g.rect(0, y + BRICK_H - 1, stageW, 1).fill(BRICK_MORTAR);
      }
      g.rect(0, wallH - 1, stageW, 1).fill(SHADOW);
      g.rect(0, wallH, stageW, 2).fill(SIDEWALK_SHADOW);
      // Streetlight pool — color from per-act palette.
      const lightX = stageW / 2;
      const lightY = wallH * 0.25;
      for (let i = 6; i >= 0; i--) {
        const r = 22 + i * 14;
        const alpha = 0.05 + (1 - i / 6) * 0.18;
        g.circle(lightX, lightY, r).fill({ color: palette.light, alpha });
      }
      const poolY = wallH + 8;
      for (let i = 5; i >= 0; i--) {
        const r = 28 + i * 18;
        const alpha = 0.04 + (1 - i / 5) * 0.12;
        g.ellipse(lightX, poolY, r, r * 0.32).fill({ color: palette.light, alpha });
      }
      // Per-act color wash overlay (darker, atmospheric tint).
      if (palette.washAlpha > 0) {
        g.rect(0, 0, stageW, stageH).fill({ color: palette.wash, alpha: palette.washAlpha });
      }
      // Halftone grain — sparse 1-px dot grid at 4% alpha gives EC-Comics
      // texture without visible regularity. Even spacing, alternating
      // offset rows so the eye reads it as noise.
      const HG = 6;
      const grainAlpha = 0.04;
      for (let gy = 0; gy < stageH; gy += HG) {
        const off = (Math.floor(gy / HG) % 2) * (HG / 2);
        for (let gx = off; gx < stageW; gx += HG) {
          g.rect(gx, gy, 1, 1).fill({ color: 0x000000, alpha: grainAlpha });
        }
      }
    },
    [stageW, stageH, palette],
  );

  return <pixiGraphics draw={draw} />;
}
