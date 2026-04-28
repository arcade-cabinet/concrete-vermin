import type { Rng } from "../rng";

export interface Range {
  readonly min: number;
  readonly max: number;
}

export const sampleRange = (rng: Rng, range: Range): number => {
  if (range.max <= range.min) return range.min;
  return rng.range(range.min, range.max);
};

export const sampleGaussian = (
  rng: Rng,
  mean: number,
  stddev: number,
  min: number,
  max: number,
): number => {
  const raw = mean + rng.gaussian() * stddev;
  return raw < min ? min : raw > max ? max : raw;
};

export const sampleWithFallback = <T>(
  rng: Rng,
  generate: (rng: Rng) => T,
  predicate: (value: T) => boolean,
  attempts = 8,
): T => {
  let last = generate(rng);
  for (let i = 1; i < attempts; i++) {
    if (predicate(last)) return last;
    last = generate(rng);
  }
  return last;
};

export interface SampleStats {
  readonly mean: number;
  readonly stddev: number;
  readonly min: number;
  readonly max: number;
  readonly count: number;
}

export const computeStats = (values: readonly number[]): SampleStats => {
  if (values.length === 0) return { mean: 0, stddev: 0, min: 0, max: 0, count: 0 };
  let min = values[0] as number;
  let max = values[0] as number;
  let sum = 0;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }
  const mean = sum / values.length;
  let variance = 0;
  for (const v of values) variance += (v - mean) * (v - mean);
  variance /= values.length;
  return {
    mean,
    stddev: Math.sqrt(variance),
    min,
    max,
    count: values.length,
  };
};
