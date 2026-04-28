import type { Graphics as PixiGraphics } from "pixi.js";
import { useCallback } from "react";
import { useGameStore } from "../runtime/store";

/**
 * Napalm pool renderer — pulsing sodium-amber splats on the ground plane.
 *
 * Each pool fades from opaque to transparent as `ageFrac` approaches 1.
 * A sin-wave pulse on the alpha gives the "burning" impression without
 * any frame-time state. Brand gate: only sodium-amber + brick, no neon.
 */
export function NapalmPoolLayer() {
  const napalmPools = useGameStore((s) => s.napalmPools);
  const now = useGameStore((s) => s.now);

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      for (const pool of napalmPools) {
        // Base alpha fades out over pool lifetime; pulse adds 0–0.2 throb.
        const baseAlpha = Math.max(0, 0.85 * (1 - pool.ageFrac));
        const pulse = 0.15 * Math.sin(now * 4 + pool.id * 1.3);
        const alpha = Math.max(0, Math.min(1, baseAlpha + pulse));

        // Outer halo — transparent sodium amber ring.
        g.circle(pool.x, pool.y, pool.radius)
          .fill({ color: 0xd4943a, alpha: alpha * 0.25 });

        // Core — brighter amber, smaller radius.
        g.circle(pool.x, pool.y, pool.radius * 0.55)
          .fill({ color: 0xf0a830, alpha: alpha * 0.55 });

        // Hot center pip — near-white, tightest.
        g.circle(pool.x, pool.y, pool.radius * 0.2)
          .fill({ color: 0xfff0c8, alpha: alpha * 0.7 });

        // Brick-red ember ring stroke.
        g.circle(pool.x, pool.y, pool.radius)
          .stroke({ color: 0x8a2810, width: 1.5, alpha: alpha * 0.6 });
      }
    },
    [napalmPools, now],
  );

  return <pixiGraphics draw={draw} />;
}
