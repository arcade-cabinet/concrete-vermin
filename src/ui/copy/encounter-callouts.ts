import { callouts } from "../../sim/content/lore";

export type CalloutEvent =
  | { kind: "kill-streak"; count: number }
  | { kind: "headshot-streak"; count: number }
  | { kind: "no-reload-streak"; count: number }
  | { kind: "two-for-one" }
  | { kind: "mid-air" }
  | { kind: "variety" }
  | { kind: "perfect-mission" }
  | { kind: "last-shell-kill" }
  | { kind: "comeback" }
  | { kind: "boss-open" }
  | { kind: "boss-down" };

/**
 * Pick the highest milestone string for a numeric streak. The keys in
 * the JSON tables are sorted numerically; the largest key not exceeding
 * `n` wins. Returns null if no milestone hit yet.
 */
function milestoneFor(table: Readonly<Record<string, string>>, n: number): string | null {
  let best: { k: number; v: string } | null = null;
  for (const [keyStr, line] of Object.entries(table)) {
    const k = Number(keyStr);
    if (Number.isFinite(k) && k <= n && (best === null || k > best.k)) {
      best = { k, v: line };
    }
  }
  return best?.v ?? null;
}

/** Resolve a callout event to a HUD string, or null if no callout. */
export function calloutFor(evt: CalloutEvent): string | null {
  switch (evt.kind) {
    case "kill-streak":
      return milestoneFor(callouts.killStreak, evt.count);
    case "headshot-streak":
      return milestoneFor(callouts.headshotStreak, evt.count);
    case "no-reload-streak":
      return milestoneFor(callouts.noReloadStreak, evt.count);
    case "two-for-one":
      return callouts.twoForOne;
    case "mid-air":
      return callouts.midAir;
    case "variety":
      return callouts.variety;
    case "perfect-mission":
      return callouts.perfectMission;
    case "last-shell-kill":
      return callouts.lastShellKill;
    case "comeback":
      return callouts.comeback;
    case "boss-open":
      return callouts.bossOpen;
    case "boss-down":
      return callouts.bossDown;
  }
}
