/**
 * Screen-shake event registry. Pure data — the React hook
 * `useScreenShake` (src/ui/hooks/useScreenShake.ts) drains this and
 * decays it into a transform offset. Lives in src/runtime/ so both
 * the runner (push) and ui (sample) can import without crossing the
 * layering gate.
 *
 * Per-event amplitudes:
 *   kill         → 4 px
 *   bossHit      → 8 px
 *   bossDeath    → 16 px
 *   playerHit    → 6 px
 *
 * All shakes decay over 80 ms. Reduced-motion zeroes amplitude
 * upstream — the registry stays populated, but the hook clamps to
 * (0, 0).
 */

export type ShakeKind = "kill" | "bossHit" | "bossDeath" | "playerHit";

const AMPLITUDE: Readonly<Record<ShakeKind, number>> = Object.freeze({
  kill: 4,
  bossHit: 8,
  bossDeath: 16,
  playerHit: 6,
});

export interface ShakeEvent {
  amplitudePx: number;
  startedAtMs: number;
  durationMs: number;
}

const EVENTS: ShakeEvent[] = [];

/**
 * Push a shake event. Idempotent against rapid duplicates: collapses
 * any event of the same kind started within the last 30 ms into a
 * single event so 8 pellets don't queue 8 kill shakes.
 */
export function pushShake(kind: ShakeKind, nowMs: number = performance.now()): void {
  const amp = AMPLITUDE[kind];
  const last = EVENTS[EVENTS.length - 1];
  if (last && nowMs - last.startedAtMs < 30 && last.amplitudePx === amp) return;
  EVENTS.push({ amplitudePx: amp, startedAtMs: nowMs, durationMs: 80 });
  if (EVENTS.length > 16) EVENTS.shift();
}

/**
 * Compute the current cumulative offset from active events. Returns
 * (0, 0) when no events are active or reduced is true. The phase is a
 * deterministic function of clock time — no rng.
 */
export function sampleShake(nowMs: number, reduced: boolean): { dx: number; dy: number } {
  if (reduced) return { dx: 0, dy: 0 };
  let dx = 0;
  let dy = 0;
  for (let i = EVENTS.length - 1; i >= 0; i--) {
    const e = EVENTS[i];
    if (!e) continue;
    const age = nowMs - e.startedAtMs;
    if (age >= e.durationMs) {
      EVENTS.splice(i, 1);
      continue;
    }
    const decay = 1 - age / e.durationMs;
    const phase = (nowMs * 0.06 + i * 1.7) % (Math.PI * 2);
    dx += Math.cos(phase) * e.amplitudePx * decay;
    dy += Math.sin(phase * 1.3) * e.amplitudePx * decay;
  }
  return { dx, dy };
}

export function resetShakeForTest(): void {
  EVENTS.length = 0;
}

export function activeShakeCount(): number {
  return EVENTS.length;
}
