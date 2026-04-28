/** 2D vector ops + scalar helpers. All pure, all branch-light. */

export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export const v2 = (x: number, y: number): Vec2 => ({ x, y });

export const v2add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });

export const v2sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });

export const v2scale = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s });

export const v2dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;

export const v2lenSq = (a: Vec2): number => a.x * a.x + a.y * a.y;

export const v2len = (a: Vec2): number => Math.sqrt(v2lenSq(a));

export const v2dist = (a: Vec2, b: Vec2): number => v2len(v2sub(a, b));

export const v2norm = (a: Vec2): Vec2 => {
  const l = v2len(a);
  return l === 0 ? { x: 0, y: 0 } : { x: a.x / l, y: a.y / l };
};

export const clamp = (value: number, min: number, max: number): number =>
  value < min ? min : value > max ? max : value;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const lerpV2 = (a: Vec2, b: Vec2, t: number): Vec2 => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
});

export const modWrap = (value: number, modulus: number): number => {
  const m = ((value % modulus) + modulus) % modulus;
  return m;
};

export const sign = (value: number): -1 | 0 | 1 => (value > 0 ? 1 : value < 0 ? -1 : 0);

export const approxEqual = (a: number, b: number, eps = 1e-6): boolean => Math.abs(a - b) < eps;

/** Smooth-damp a value toward a target, frame-rate independent. */
export const smoothDamp = (
  current: number,
  target: number,
  dt: number,
  halfLifeS: number,
): number => {
  if (halfLifeS <= 0) return target;
  const k = 1 - 0.5 ** (dt / halfLifeS);
  return lerp(current, target, k);
};
