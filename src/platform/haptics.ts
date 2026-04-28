/**
 * Haptic feedback. Wraps @capacitor/haptics so the rest of the app
 * doesn't have to care about platform availability — on web (no
 * Capacitor bridge) every call is a no-op.
 *
 * Three intensities map to the design's hit / kill / boss-damage
 * tiers. Capacitor doesn't ship distinct durations, so we map onto
 * the platform's three preset weights (Light, Medium, Heavy) and
 * ignore web's experimental Vibration API — its UX is inconsistent
 * and reduced-motion / settings.muted should disable it anyway.
 */

import { Haptics, ImpactStyle } from "@capacitor/haptics";

let enabled = true;

/**
 * Disable / re-enable haptics globally. Intended to be wired to a
 * settings toggle. Defaults enabled; the actual platform call is
 * guarded by Capacitor availability internally.
 */
export function setHapticsEnabled(on: boolean): void {
  enabled = on;
}

export function hapticsEnabled(): boolean {
  return enabled;
}

async function impact(style: ImpactStyle): Promise<void> {
  if (!enabled) return;
  try {
    await Haptics.impact({ style });
  } catch {
    // Capacitor not available (web) or platform refused. No-op — the
    // game continues without tactile feedback.
  }
}

/** Light pulse — vermin hit (didn't die). */
export function hitHaptic(): Promise<void> {
  return impact(ImpactStyle.Light);
}

/** Medium pulse — vermin killed. */
export function killHaptic(): Promise<void> {
  return impact(ImpactStyle.Medium);
}

/** Heavy pulse — boss took damage. Use sparingly. */
export function bossDamageHaptic(): Promise<void> {
  return impact(ImpactStyle.Heavy);
}
