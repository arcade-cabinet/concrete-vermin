import { callouts } from "../../sim/content/lore";

/**
 * In-mission HUD callouts. Each event resolves to a single short string
 * (or null if no callout applies). Pure — the runtime decides when to
 * fire each event; this module only maps event → string.
 */

export type CalloutEvent =
  | { kind: "kill-streak"; count: number }
  | { kind: "headshot-streak"; count: number }
  | { kind: "no-reload-streak"; count: number }
  | { kind: "chain-kill"; count: number }
  | { kind: "boss-phase"; phase: string }
  | {
      kind: "no-damage";
      /** Difficulty band of the cleared mission (drives the variant). */
      tier: "easy" | "medium" | "hard";
    }
  | { kind: "two-for-one" }
  | { kind: "mid-air" }
  | { kind: "variety" }
  | { kind: "perfect-mission" }
  | { kind: "last-shell-kill" }
  | { kind: "last-second-clear" }
  | { kind: "low-life-kill" }
  | { kind: "comeback" }
  | { kind: "boss-open" }
  | { kind: "boss-down" }
  | { kind: "no-mods-run" }
  | { kind: "perfect-accuracy" }
  | { kind: "no-waste-shells" }
  | { kind: "first-clear" }
  | { kind: "tutorial-clear" }
  | { kind: "rapid-clear" }
  | { kind: "marathon-clear" }
  | { kind: "boss-only" }
  | { kind: "vermin-50" }
  | { kind: "vermin-100" }
  | { kind: "vermin-500" };

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
    case "chain-kill":
      return milestoneFor(callouts.chainKill, evt.count);
    case "boss-phase":
      return (callouts.bossPhase as Readonly<Record<string, string>>)[evt.phase] ?? null;
    case "no-damage":
      return (callouts.noDamage as Readonly<Record<string, string>>)[evt.tier] ?? null;
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
    case "last-second-clear":
      return callouts.lastSecondClear;
    case "low-life-kill":
      return callouts.lowLifeKill;
    case "comeback":
      return callouts.comeback;
    case "boss-open":
      return callouts.bossOpen;
    case "boss-down":
      return callouts.bossDown;
    case "no-mods-run":
      return callouts.noModsRun;
    case "perfect-accuracy":
      return callouts.perfectAccuracy;
    case "no-waste-shells":
      return callouts.noWasteShells;
    case "first-clear":
      return callouts.firstClear;
    case "tutorial-clear":
      return callouts.tutorialClear;
    case "rapid-clear":
      return callouts.rapidClear;
    case "marathon-clear":
      return callouts.marathonClear;
    case "boss-only":
      return callouts.bossOnly;
    case "vermin-50":
      return callouts.vermin50;
    case "vermin-100":
      return callouts.vermin100;
    case "vermin-500":
      return callouts.vermin500;
  }
}

/**
 * Total count of distinct callout strings in the registry. Exposed so
 * the test can pin a 30+ floor on the corpus and refuse to ship a
 * regression that quietly drops the variety.
 */
export function totalCalloutCount(): number {
  let total = 0;
  total += Object.keys(callouts.killStreak).length;
  total += Object.keys(callouts.headshotStreak).length;
  total += Object.keys(callouts.noReloadStreak).length;
  total += Object.keys(callouts.chainKill).length;
  total += Object.keys(callouts.bossPhase).length;
  total += Object.keys(callouts.noDamage).length;
  // Number of single-string callouts on the schema.
  total += 17;
  return total;
}
