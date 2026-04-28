/**
 * Three-layer parallax. The renderer asks for per-layer offsets at a
 * given sim time; layers drift on a slow lissajous so the scene
 * breathes without a fixed camera. Pure function — no rng, no DOM.
 *
 *   far    (brick wall band)   — drifts ±6 px on a 14 s cycle
 *   mid    (streetlight pool)  — drifts ±12 px on the same cycle
 *   near   (vermin / splash)   — drifts ±22 px (already at full speed)
 *
 * Amplitudes are sized so the motion reads on a 480×270 canvas without
 * being distracting — roughly 1.2 % / 2.5 % / 4.5 % of stage width.
 * Reduced-motion zeroes every layer.
 */

export type ParallaxLayer = "far" | "mid" | "near";

const PERIOD_S = 14;
const AMPLITUDE_PX: Readonly<Record<ParallaxLayer, number>> = Object.freeze({
  far: 6.0,
  mid: 12.0,
  near: 22.0,
});

export interface ParallaxOffset {
  dx: number;
  dy: number;
}

/**
 * Per-layer offset at sim time `nowS`. Reduced-motion zeroes the
 * result so reduced-motion players see a fixed camera.
 */
export function parallaxOffset(
  layer: ParallaxLayer,
  nowS: number,
  reduced: boolean,
): ParallaxOffset {
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
