import type { Graphics as PixiGraphics } from "pixi.js";
import { useCallback } from "react";
import { useGameStore } from "../runtime/store";
import {
  CRT_FRINGE_ALPHA,
  CRT_FRINGE_CYAN,
  CRT_PHOSPHOR_ALPHA,
  CRT_PHOSPHOR_GLOW,
  CRT_SCANLINE_ALPHA,
  CRT_SCANLINE_DARK,
  CRT_SCANLINE_HEIGHT,
  CRT_VIGNETTE_ALPHA,
} from "./effects/crt";

export function CRTOverlay() {
  const stageW = useGameStore((s) => s.viewport.width);
  const stageH = useGameStore((s) => s.viewport.height);

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      // Horizontal scanlines (every other 2-px row dim)
      for (let y = 0; y < stageH; y += CRT_SCANLINE_HEIGHT * 2) {
        g.rect(0, y, stageW, CRT_SCANLINE_HEIGHT).fill({
          color: CRT_SCANLINE_DARK,
          alpha: CRT_SCANLINE_ALPHA,
        });
      }
      // Vignette: corner shadows via four ellipse darkenings
      const vw = stageW * 0.85;
      const vh = stageH * 0.85;
      // Top-left → bottom-right corner sweeps, faded
      g.ellipse(0, 0, vw * 0.6, vh * 0.6).fill({
        color: 0x000000,
        alpha: CRT_VIGNETTE_ALPHA * 0.4,
      });
      g.ellipse(stageW, 0, vw * 0.6, vh * 0.6).fill({
        color: 0x000000,
        alpha: CRT_VIGNETTE_ALPHA * 0.4,
      });
      g.ellipse(0, stageH, vw * 0.6, vh * 0.6).fill({
        color: 0x000000,
        alpha: CRT_VIGNETTE_ALPHA * 0.4,
      });
      g.ellipse(stageW, stageH, vw * 0.6, vh * 0.6).fill({
        color: 0x000000,
        alpha: CRT_VIGNETTE_ALPHA * 0.4,
      });
      // Chroma-fringe rectangles at the left/right edges (2px inner glow)
      g.rect(0, 0, 2, stageH).fill({ color: CRT_FRINGE_CYAN, alpha: CRT_FRINGE_ALPHA });
      g.rect(stageW - 2, 0, 2, stageH).fill({
        color: CRT_PHOSPHOR_GLOW,
        alpha: CRT_PHOSPHOR_ALPHA,
      });
    },
    [stageW, stageH],
  );

  return <pixiGraphics draw={draw} />;
}
