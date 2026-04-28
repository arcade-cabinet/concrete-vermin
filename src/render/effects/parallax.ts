/**
 * Three-layer parallax. The renderer asks for per-layer offsets at a
 * given sim time; layers drift on a slow lissajous so the scene
 * breathes without a fixed camera. Pure function — no rng, no DOM.
 *
 *   far    (brick wall band)   — 0.20× drift, x: ±2.5 px
 *   mid    (streetlight pool)  — 0.45× drift, x: ±5.0 px
 *   near   (vermin / splash)   — 1.00× drift, x: ±10.0 px
 *
 * Cycle period is long (~24 s) so the eye reads it as ambience, not
 * motion. Reduced-motion zeroes every layer.
 */

export type ParallaxLayer = "far" | "mid" | "near";

const PERIOD_S = 24;
const AMPLITUDE_PX: Readonly<Record<ParallaxLayer, number>> = Object.freeze({
  far: 2.5,
  mid: 5.0,
  near: 10.0,
});

export interface ParallaxOffset {
  dx: number;
  dy: number;
}

/**
 * Per-layer offset at sim time `nowS`. Reduced-motion zeroes the
 * result so reduced-motion players see a fixed camera.
 */
export function parallaxOffset(layer: ParallaxLayer, nowS: number, reduced: boolean): ParallaxOffset {
  if (reduced) return { dx: 0, dy: 0 };
  const amp = AMPLITUDE_PX[layer];
  const phase = (nowS / PERIOD_S) * Math.PI * 2;
  // Layers ride the same primary phase but the y-component runs at a
  // different multiple per layer so they don't all bob in lockstep.
  const yMul = layer === "far" ? 0.6 : layer === "mid" ? 0.9 : 1.3;
  return {
    dx: Math.sin(phase) * amp,
    dy: Math.sin(phase * yMul) * amp * 0.4,
  };
}

/**
 * Convenience: all three layers at once. Avoids three individual
 * function calls + one shared phase computation per frame.
 */
export function allParallaxOffsets(
  nowS: number,
  reduced: boolean,
): Readonly<Record<ParallaxLayer, ParallaxOffset>> {
  return Object.freeze({
    far: parallaxOffset("far", nowS, reduced),
    mid: parallaxOffset("mid", nowS, reduced),
    near: parallaxOffset("near", nowS, reduced),
  });
}
