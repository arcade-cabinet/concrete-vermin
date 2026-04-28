import type { World } from "koota";
import {
  type KillEvent,
  type ModifierFlash,
  recordKill,
  recordMiss,
  recordReload,
  type ScoreState,
} from "../../sim/engine/scoring";
import { setScore } from "../actions";
import { Score } from "../traits";
import type { CollideEvent } from "./collide";

/** Map a CollideEvent to scoring's KillEvent (when killed). */
function toKillEvent(ce: CollideEvent): KillEvent {
  return {
    archetypeId: ce.archetypeId as KillEvent["archetypeId"],
    baseBounty: ce.baseBounty,
    healthScale: 1,
    isHeadshot: ce.isHeadshot,
    isMidAir: false,
    isTwoForOne: false,
  };
}

/** Read the singleton Score trait into a ScoreState. */
function readScoreState(world: World, scoreEntityId: number): ScoreState | null {
  for (const e of world.query(Score)) {
    if (e.id() !== scoreEntityId) continue;
    const s = e.get(Score);
    if (!s) return null;
    return {
      total: s.total,
      multiplier: s.multiplier,
      multiplierDecayAt: s.multiplierDecayAt,
      multiplierGraceUntil: s.multiplierGraceUntil,
      noReloadStreak: s.noReloadStreak,
      lastArchetypeKilled: null,
      varietyChain: [],
      modifierFlashes: [],
    };
  }
  return null;
}

/**
 * Score system: folds collide events into the singleton Score trait.
 * Misses (shots that didn't hit anything) are detected by the caller
 * and reported via `missCount`; this system increments the multiplier
 * decay accordingly.
 */
export function scoreSystem(
  world: World,
  scoreEntityId: number,
  events: ReadonlyArray<CollideEvent>,
  missCount: number,
  now: number,
  didReload = false,
): ReadonlyArray<ModifierFlash> {
  let s = readScoreState(world, scoreEntityId);
  if (!s) return [];

  if (didReload) s = recordReload(s);
  for (let i = 0; i < missCount; i++) s = recordMiss(s, now);

  for (const ev of events) {
    if (ev.kind === "kill") {
      s = recordKill(s, toKillEvent(ev), now);
    }
  }

  setScore(world, scoreEntityId, {
    total: s.total,
    multiplier: s.multiplier,
    multiplierGraceUntil: s.multiplierGraceUntil,
    multiplierDecayAt: s.multiplierDecayAt,
    noReloadStreak: s.noReloadStreak,
  });
  return s.modifierFlashes;
}
