import type { ArchetypeId } from "../archetypes/vermin";
import type { MissionStats } from "./scoring";

/**
 * Run-stats accumulator. Pure event-fold. Every gameplay event the
 * sim emits gets folded into a snapshot the grading layer can chew on.
 *
 * `accumulate(stats, event)` returns a NEW snapshot — no mutation.
 * `summarize(stats)` produces the immutable input the grading function
 * (`computeMissionGrade`) expects, plus side-data the post-mission UI
 * needs (max multiplier seen, hot moments).
 *
 * "Hot moment" = a window where the player got 5+ kills in 4 seconds.
 * The accumulator detects them by checking the rolling kill timestamps
 * on every kill event; emitted hot moments are deduplicated per window.
 */

const HOT_MOMENT_KILLS = 5;
const HOT_MOMENT_WINDOW_S = 4;
/**
 * Cooldown after a hot moment ends before a new one can start. Without
 * this, a continuous kill stream emits a fresh moment per kill once the
 * sliding window contains ≥ HOT_MOMENT_KILLS — overlapping records
 * with sliding startAt. Cooldown is "absolute time since the last
 * moment's endAt", not "since startAt", so a long fight produces a
 * series of distinct moments, not one giant one or N tiny ones.
 */
const HOT_MOMENT_COOLDOWN_S = 4;

export interface HotMoment {
  startAt: number;
  endAt: number;
  kills: number;
}

export interface RunStats {
  shotsFired: number;
  shotsHit: number;
  killsByArchetype: Partial<Record<ArchetypeId, number>>;
  totalKills: number;
  damageTaken: number;
  livesLost: number;
  artifactsFound: number;
  artifactsAvailable: number;
  maxMultiplier: number;
  hotMoments: ReadonlyArray<HotMoment>;
  /** Last-window of kill timestamps for hot-moment detection. */
  recentKillTimes: ReadonlyArray<number>;
}

export const initialRunStats: Readonly<RunStats> = Object.freeze({
  shotsFired: 0,
  shotsHit: 0,
  killsByArchetype: Object.freeze({}),
  totalKills: 0,
  damageTaken: 0,
  livesLost: 0,
  artifactsFound: 0,
  artifactsAvailable: 0,
  maxMultiplier: 1,
  hotMoments: Object.freeze([]),
  recentKillTimes: Object.freeze([]),
});

export type RunEvent =
  | { kind: "shot-fired" }
  | { kind: "shot-hit" }
  | { kind: "kill"; archetypeId: ArchetypeId; at: number }
  | { kind: "damage-taken"; amount: number }
  | { kind: "life-lost" }
  | { kind: "artifact-found" }
  | { kind: "artifact-registered" }
  | { kind: "multiplier-sample"; value: number };

export function accumulate(stats: RunStats, event: RunEvent): RunStats {
  switch (event.kind) {
    case "shot-fired":
      return { ...stats, shotsFired: stats.shotsFired + 1 };

    case "shot-hit":
      return { ...stats, shotsHit: stats.shotsHit + 1 };

    case "kill": {
      const prev = stats.killsByArchetype[event.archetypeId] ?? 0;
      const killsByArchetype = { ...stats.killsByArchetype, [event.archetypeId]: prev + 1 };

      // Hot-moment detection: prune timestamps older than the window,
      // append this one, and emit a HotMoment if the window contains
      // >= HOT_MOMENT_KILLS kills AND the latest moment doesn't already
      // cover this timestamp.
      const windowStart = event.at - HOT_MOMENT_WINDOW_S;
      const recentKillTimes = [...stats.recentKillTimes.filter((t) => t >= windowStart), event.at];

      let hotMoments = stats.hotMoments;
      if (recentKillTimes.length >= HOT_MOMENT_KILLS) {
        const startAt = recentKillTimes[0] as number;
        const last = hotMoments[hotMoments.length - 1];
        // Three cases:
        // 1. No previous moment OR previous moment ended > cooldown ago
        //    AND startAt is past the cooldown gate → append new moment.
        // 2. Previous moment is still "live" (its window overlaps ours)
        //    → extend it (replace-tail with updated endAt + kill count).
        // 3. Previous moment ended within cooldown → swallow this kill
        //    (don't spam new moments while the cooldown is in effect).
        if (last && startAt < last.endAt + HOT_MOMENT_COOLDOWN_S) {
          // Continuous run — extend the trailing moment.
          hotMoments = [
            ...hotMoments.slice(0, -1),
            {
              startAt: last.startAt,
              endAt: event.at,
              kills: last.kills + 1,
            },
          ];
        } else {
          hotMoments = [...hotMoments, { startAt, endAt: event.at, kills: recentKillTimes.length }];
        }
      }

      return {
        ...stats,
        killsByArchetype,
        totalKills: stats.totalKills + 1,
        recentKillTimes,
        hotMoments,
      };
    }

    case "damage-taken":
      return { ...stats, damageTaken: stats.damageTaken + event.amount };

    case "life-lost":
      return { ...stats, livesLost: stats.livesLost + 1 };

    case "artifact-found":
      return { ...stats, artifactsFound: stats.artifactsFound + 1 };

    case "artifact-registered":
      return { ...stats, artifactsAvailable: stats.artifactsAvailable + 1 };

    case "multiplier-sample":
      return event.value > stats.maxMultiplier ? { ...stats, maxMultiplier: event.value } : stats;
  }
}

export interface MissionResult {
  /** Trimmed to what `computeMissionGrade` needs. */
  stats: MissionStats;
  maxMultiplier: number;
  hotMoments: ReadonlyArray<HotMoment>;
  totalKills: number;
}

export function summarize(stats: RunStats): MissionResult {
  return {
    stats: {
      shotsFired: stats.shotsFired,
      shotsHit: stats.shotsHit,
      artifactsFound: stats.artifactsFound,
      artifactsAvailable: stats.artifactsAvailable,
      livesLost: stats.livesLost,
      damageTaken: stats.damageTaken,
      killsByArchetype: stats.killsByArchetype,
    },
    maxMultiplier: stats.maxMultiplier,
    hotMoments: stats.hotMoments,
    totalKills: stats.totalKills,
  };
}
