import {
  type AchievementContext,
  evaluateAchievements,
  getAchievement,
} from "../sim/content/achievements";
import { useGameStore } from "./store";
import { usePlayerProgress } from "../ui/PlayerProgress";

/**
 * Subscribes to game-store + player-progress changes, builds an
 * AchievementContext at meaningful moments (mission end, cash awards),
 * evaluates the achievement registry, and persists newly-unlocked ids
 * via PlayerProgress.unlockAchievement.
 *
 * Returns an unsubscribe so the caller (App.tsx) can tear down on
 * unmount during tests.
 *
 * The tracker is deliberately additive: it only consults state — it
 * never writes to the runtime store, never reaches into the renderer,
 * and never controls phase. This keeps achievements a passive overlay
 * that can't break gameplay if its predicates have bugs.
 */
export function installAchievementsTracker(): () => void {
  const unsubGame = useGameStore.subscribe((s, prev) => {
    // Mission-end pulses: evaluate when phase flips into won or lost.
    const ended =
      (s.phase === "won" || s.phase === "lost") &&
      prev.phase !== "won" &&
      prev.phase !== "lost";
    if (!ended) return;
    evaluateOnce(s.phase === "won");
  });

  // Cash award subscription: evaluate every time lifetime cash grows
  // so the cash-tier achievements unlock the moment they're earned.
  const unsubProgress = usePlayerProgress.subscribe((s, prev) => {
    if (s.cash > prev.cash || s.completedMissionIds.length > prev.completedMissionIds.length) {
      evaluateOnce(false);
    }
  });

  return () => {
    unsubGame();
    unsubProgress();
  };
}

function evaluateOnce(missionWon: boolean): void {
  const game = useGameStore.getState();
  const progress = usePlayerProgress.getState();
  const ctx: AchievementContext = {
    missionId: game.missionId,
    missionAct: game.missionAct,
    missionScore: game.score.total,
    missionKills: game.killCount,
    // The runner doesn't yet publish per-mission counters for headshots,
    // crits, multi-kills, no-reload, or damage-taken — those flow in via
    // separate hooks added with the achievement events. Until then we
    // pull conservative zeros so the predicates that need them simply
    // won't fire (they wait for the dedicated events).
    missionHeadshots: 0,
    missionCrits: 0,
    missionBossKills: 0,
    missionDamageTaken: 0,
    missionReloads: 0,
    missionMultiKill: { twoKill: 0, threeKill: 0, fiveKill: 0 },
    missionNoReload: false,
    missionWon,
    missionGrade: gradeFromScore(game.score.total),
    lifetime: {
      cashEarned: progress.cash,
      missionsCompleted: progress.completedMissionIds.length,
      achievementsUnlocked: progress.unlockedAchievements.length,
    },
  };

  const newly = evaluateAchievements(ctx, progress.unlockedAchievements);
  for (const id of newly) {
    progress.unlockAchievement(id);
    const a = getAchievement(id);
    if (!a) continue;
    // Surface unlock via the screen-reader live region so AT users get
    // a polite "Achievement unlocked: <name>" without interrupting fire.
    game.announceForScreenReader(`Achievement unlocked: ${a.name}.`, "polite");
  }
}

/**
 * Five-tier grade ladder. Scoring bands are intentionally generous so
 * S-grade is achievable on a clean tutorial; the underworld tiers
 * tighten naturally because the maximum spawn count grows.
 */
function gradeFromScore(score: number): "S" | "A" | "B" | "C" | "D" | "F" {
  if (score >= 5000) return "S";
  if (score >= 3000) return "A";
  if (score >= 1500) return "B";
  if (score >= 800) return "C";
  if (score >= 200) return "D";
  return "F";
}
