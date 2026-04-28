import type { Graphics as PixiGraphics } from "pixi.js";
import { useCallback } from "react";
import { useGameStore } from "../runtime/store";
import { COLOR, pixi } from "../theme/colors";
import { actLightFor } from "./effects/actLighting";
import { allParallaxOffsets } from "./effects/parallax";

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
  const now = useGameStore((s) => s.now);
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion);
  const palette = actLightFor(act);
  const par = allParallaxOffsets(now, reducedMotion);

  // Far layer: brick wall + asphalt + sidewalk lip.
  const drawFar = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.rect(0, 0, stageW, stageH).fill(ASPHALT);
      const wallH = stageH * 0.55;
      g.rect(0, wallH, stageW, stageH * 0.15).fill({ color: ASPHALT_LIGHT, alpha: 0.4 });
      const brickBase = palette.brickTint ?? BRICK;
      g.rect(0, 0, stageW, wallH).fill(brickBase);
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
    },
    [stageW, stageH, palette],
  );

  // Mid layer: streetlight pool + ground pool. Drifts on its own
  // parallax track so the bulb sweeps slightly relative to the wall.
  const drawMid = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      const wallH = stageH * 0.55;
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
    },
    [stageW, stageH, palette],
  );

  // Overlay (no parallax): wash tint + halftone grain. Both are
  // screen-space — they should not move with the camera or the
  // dot-grid would crawl.
  const drawOverlay = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      if (palette.washAlpha > 0) {
        g.rect(0, 0, stageW, stageH).fill({ color: palette.wash, alpha: palette.washAlpha });
      }
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

  return (
    <pixiContainer>
      <pixiContainer x={par.far.dx} y={par.far.dy}>
        <pixiGraphics draw={drawFar} />
      </pixiContainer>
      <pixiContainer x={par.mid.dx} y={par.mid.dy}>
        <pixiGraphics draw={drawMid} />
      </pixiContainer>
      <pixiGraphics draw={drawOverlay} />
    </pixiContainer>
  );
}
