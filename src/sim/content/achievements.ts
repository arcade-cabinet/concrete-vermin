/**
 * Achievement registry. Pure data + a small predicate language: the
 * runtime feeds an `AchievementContext` (per-mission accumulators +
 * lifetime totals from PlayerProgress) into each predicate after every
 * meaningful event, and an unlock fires the first time it returns true.
 *
 * Sim-pure. Lives under src/sim/ and imports nothing from React, DOM,
 * or audio. The runtime tracker (src/runtime/achievementsTracker.ts)
 * wires it into the player loop.
 */

export interface AchievementContext {
  /** Mission id the run is on (empty string if not in a mission). */
  missionId: string;
  /** Mission act (streets / underworld / above). */
  missionAct: "streets" | "underworld" | "above";
  /** Score earned this mission so far. */
  missionScore: number;
  /** Vermin killed this mission. */
  missionKills: number;
  /** Headshots this mission. */
  missionHeadshots: number;
  /** Crits this mission. */
  missionCrits: number;
  /** Boss kills this mission. */
  missionBossKills: number;
  /** Player damage taken this mission (0 if untouched). */
  missionDamageTaken: number;
  /** Reloads triggered this mission. */
  missionReloads: number;
  /** Multi-kill events of size N this mission. */
  missionMultiKill: { twoKill: number; threeKill: number; fiveKill: number };
  /** True if the active weapon never reloaded by mission end. */
  missionNoReload: boolean;
  /** True if the player won the mission this trigger. */
  missionWon: boolean;
  /** Final grade tier (S / A / B / C / D / F). */
  missionGrade?: "S" | "A" | "B" | "C" | "D" | "F";
  /** Lifetime aggregates pulled from PlayerProgress. */
  lifetime: {
    cashEarned: number;
    missionsCompleted: number;
    achievementsUnlocked: number;
  };
}

export interface Achievement {
  id: string;
  /** Player-visible name. */
  name: string;
  /** One-sentence description. */
  description: string;
  /** Tier — drives gallery sorting + visual treatment. */
  tier: "bronze" | "silver" | "gold" | "secret";
  /** Predicate: true → unlock the first time. */
  predicate: (ctx: AchievementContext) => boolean;
}

/**
 * The 22-achievement roster. Mix of skill (S-grade clears, no-damage
 * runs), grind (cash totals, mission counts), oddities (boss kills,
 * specific archetypes), and meta (unlock-other-achievements).
 */
export const ACHIEVEMENTS: ReadonlyArray<Achievement> = Object.freeze([
  // — Bronze: easy, the first hour will hit most of these. —
  {
    id: "first-blood",
    name: "First Blood",
    description: "Kill your first vermin.",
    tier: "bronze",
    predicate: (c) => c.missionKills >= 1,
  },
  {
    id: "first-clear",
    name: "First Clear",
    description: "Clear your first mission.",
    tier: "bronze",
    predicate: (c) => c.missionWon,
  },
  {
    id: "ten-kills",
    name: "Block Patrol",
    description: "Drop 10 vermin in a single mission.",
    tier: "bronze",
    predicate: (c) => c.missionKills >= 10,
  },
  {
    id: "first-cash",
    name: "First Score",
    description: "Earn $100 across your runs.",
    tier: "bronze",
    predicate: (c) => c.lifetime.cashEarned >= 100,
  },
  {
    id: "first-headshot",
    name: "Eye for Eye",
    description: "Land your first headshot.",
    tier: "bronze",
    predicate: (c) => c.missionHeadshots >= 1,
  },
  {
    id: "first-multi-kill",
    name: "Two for One",
    description: "Drop two vermin with a single shot.",
    tier: "bronze",
    predicate: (c) => c.missionMultiKill.twoKill >= 1,
  },
  // — Silver: skill-tier, asks the player to play with intent. —
  {
    id: "no-damage-streets",
    name: "Untouched on the Streets",
    description: "Clear any Streets mission without taking a single hit.",
    tier: "silver",
    predicate: (c) => c.missionWon && c.missionAct === "streets" && c.missionDamageTaken === 0,
  },
  {
    id: "five-kill",
    name: "Crowd Pleaser",
    description: "Drop five vermin with a single shot.",
    tier: "silver",
    predicate: (c) => c.missionMultiKill.fiveKill >= 1,
  },
  {
    id: "ten-headshots",
    name: "Pawnbroker's Pride",
    description: "Land 10 headshots in a single mission.",
    tier: "silver",
    predicate: (c) => c.missionHeadshots >= 10,
  },
  {
    id: "mission-five-cleared",
    name: "Block by Block",
    description: "Clear five missions across all acts.",
    tier: "silver",
    predicate: (c) => c.lifetime.missionsCompleted >= 5,
  },
  {
    id: "boss-kill",
    name: "Took the King",
    description: "Drop your first boss-class vermin.",
    tier: "silver",
    predicate: (c) => c.missionBossKills >= 1,
  },
  {
    id: "no-reload-clear",
    name: "Clean Sweep",
    description: "Clear any mission without ever reloading.",
    tier: "silver",
    predicate: (c) => c.missionWon && c.missionNoReload,
  },
  {
    id: "thousand-cash",
    name: "Backroom Banker",
    description: "Earn $1,000 across your runs.",
    tier: "silver",
    predicate: (c) => c.lifetime.cashEarned >= 1000,
  },
  // — Gold: end-game, S-grade and underworld tier. —
  {
    id: "s-grade-streets",
    name: "Streets Grandmaster",
    description: "Earn an S grade on any Streets mission.",
    tier: "gold",
    predicate: (c) => c.missionWon && c.missionAct === "streets" && c.missionGrade === "S",
  },
  {
    id: "s-grade-underworld",
    name: "Sewer Sovereign",
    description: "Earn an S grade on any Underworld mission.",
    tier: "gold",
    predicate: (c) => c.missionWon && c.missionAct === "underworld" && c.missionGrade === "S",
  },
  {
    id: "s-grade-above",
    name: "Skyline Sniper",
    description: "Earn an S grade on any Above mission.",
    tier: "gold",
    predicate: (c) => c.missionWon && c.missionAct === "above" && c.missionGrade === "S",
  },
  {
    id: "no-damage-underworld",
    name: "Untouched in the Underworld",
    description: "Clear any Underworld mission without taking a single hit.",
    tier: "gold",
    predicate: (c) => c.missionWon && c.missionAct === "underworld" && c.missionDamageTaken === 0,
  },
  {
    id: "no-damage-above",
    name: "Untouched on the Roof",
    description: "Clear any Above mission without taking a single hit.",
    tier: "gold",
    predicate: (c) => c.missionWon && c.missionAct === "above" && c.missionDamageTaken === 0,
  },
  {
    id: "all-missions-cleared",
    name: "Pawnbroker's Heir",
    description: "Clear every mission in the campaign.",
    tier: "gold",
    predicate: (c) => c.lifetime.missionsCompleted >= 8,
  },
  {
    id: "ten-thousand-cash",
    name: "Empire of Brass",
    description: "Earn $10,000 across your runs.",
    tier: "gold",
    predicate: (c) => c.lifetime.cashEarned >= 10_000,
  },
  // — Secret: hidden until unlocked, oddities & easter eggs. —
  {
    id: "secret-pigeon-king",
    name: "Crown Goes With Me",
    description: "Drop the Pigeon King boss in under 30 seconds.",
    tier: "secret",
    predicate: () => false, // Set by the runtime tracker on the boss-kill timing event.
  },
  {
    id: "secret-completionist",
    name: "Concrete Saint",
    description: "Unlock 20 other achievements.",
    tier: "secret",
    predicate: (c) => c.lifetime.achievementsUnlocked >= 20,
  },
]);

export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/**
 * Evaluate every achievement against the context and return the ids
 * that should be newly unlocked (filtered against `alreadyUnlocked`).
 * Pure — no side effects.
 */
export function evaluateAchievements(
  ctx: AchievementContext,
  alreadyUnlocked: ReadonlyArray<string>,
): ReadonlyArray<string> {
  const unlocked = new Set(alreadyUnlocked);
  const newly: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (unlocked.has(a.id)) continue;
    if (a.predicate(ctx)) newly.push(a.id);
  }
  return newly;
}
