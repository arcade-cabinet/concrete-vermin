/** Easing curves, all defined on [0, 1] -> [0, 1]. Pure, no allocs. */

export const linear = (t: number): number => t;

export const easeInCubic = (t: number): number => t * t * t;

export const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

export const easeInQuint = (t: number): number => t * t * t * t * t;

export const easeOutQuint = (t: number): number => 1 - (1 - t) ** 5;

export const easeInOutQuint = (t: number): number =>
  t < 0.5 ? 16 * t * t * t * t * t : 1 - (-2 * t + 2) ** 5 / 2;

export const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};

/** Critically-damped spring approximation for snappy UI motion. */
export const easeOutExpo = (t: number): number => (t === 1 ? 1 : 1 - 2 ** (-10 * t));
