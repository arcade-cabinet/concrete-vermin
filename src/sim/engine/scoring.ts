import type { ArchetypeId } from "../archetypes/vermin";

// ─── Tunables ──────────────────────────────────────────────────────────────

export const MULTIPLIER_BASE = 1;
export const MULTIPLIER_CAP = 5;
export const MULTIPLIER_KILL_DELTA = 0.1;
export const MULTIPLIER_STYLE_DELTA = 0.25;
export const MULTIPLIER_GRACE_S = 1.5;
export const MULTIPLIER_DECAY_PER_S = 0.6;
export const MISS_MULTIPLIER_PENALTY = 0.85;
export const COLLECTIBLE_GRACE_BONUS_S = 5;

export const STYLE_HEADSHOT_PCT = 0.5;
export const STYLE_TWO_FOR_ONE_PCT = 1.0;
export const STYLE_MID_AIR_PCT = 0.75;
export const STYLE_VARIETY_PCT = 2.0; // 3 different archetypes in last 4
export const STYLE_NO_RELOAD_PER_5_PCT = 0.1;
export const STYLE_NO_RELOAD_CAP_PCT = 0.5;

export const MAX_MODIFIER_FLASHES = 8;

// ─── Types ─────────────────────────────────────────────────────────────────

export type ModifierKind = "headshot" | "two-for-one" | "mid-air" | "variety" | "no-reload";

export interface ModifierFlash {
  kind: ModifierKind;
  bonusPct: number;
  at: number;
}

export interface ScoreState {
  total: number;
  multiplier: number;
  multiplierDecayAt: number;
  multiplierGraceUntil: number;
  noReloadStreak: number;
  lastArchetypeKilled: ArchetypeId | null;
  varietyChain: ReadonlyArray<ArchetypeId>;
  modifierFlashes: ReadonlyArray<ModifierFlash>;
}

export interface KillEvent {
  archetypeId: ArchetypeId;
  baseBounty: number;
  healthScale: number;
  isHeadshot: boolean;
  isMidAir: boolean;
  isTwoForOne: boolean;
}

export interface KillScoreBreakdown {
  base: number;
  modifierBonusPct: number;
  multiplier: number;
  scoreGain: number;
  flashes: ModifierFlash[];
}

export interface MissionStats {
  shotsFired: number;
  shotsHit: number;
  artifactsFound: number;
  artifactsAvailable: number;
  livesLost: number;
  damageTaken: number;
  killsByArchetype: Partial<Record<ArchetypeId, number>>;
}

export interface MissionPar {
  parScore: number;
  parAccuracy: number;
}

export type Grade = "F" | "D" | "C" | "B" | "A" | "S" | "S+";

export interface GradeResult {
  grade: Grade;
  raw: number;
  components: { score: number; accuracy: number; collect: number };
}

// ─── Construction ─────────────────────────────────────────────────────────

export const initialScoreState: Readonly<ScoreState> = Object.freeze({
  total: 0,
  multiplier: MULTIPLIER_BASE,
  multiplierDecayAt: 0,
  multiplierGraceUntil: 0,
  noReloadStreak: 0,
  lastArchetypeKilled: null,
  varietyChain: Object.freeze([]) as ReadonlyArray<ArchetypeId>,
  modifierFlashes: Object.freeze([]) as ReadonlyArray<ModifierFlash>,
});

// ─── Helpers ──────────────────────────────────────────────────────────────

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

const noReloadBonusPct = (streak: number): number => {
  if (streak < 10) return 0;
  const fives = Math.floor(streak / 5);
  return Math.min(STYLE_NO_RELOAD_CAP_PCT, fives * STYLE_NO_RELOAD_PER_5_PCT);
};

const varietyBonusPct = (chain: ReadonlyArray<ArchetypeId>, next: ArchetypeId): number => {
  // Last-4 window including the new kill: variety bonus if 3+ unique.
  const window = [...chain.slice(-3), next];
  const unique = new Set(window).size;
  return unique >= 3 ? STYLE_VARIETY_PCT : 0;
};

const pushFlashes = (prev: ReadonlyArray<ModifierFlash>, add: ModifierFlash[]): ModifierFlash[] => {
  const out = prev.concat(add);
  if (out.length <= MAX_MODIFIER_FLASHES) return out;
  return out.slice(out.length - MAX_MODIFIER_FLASHES);
};

// ─── Pure transitions ─────────────────────────────────────────────────────

export function recordKill(state: ScoreState, kill: KillEvent, now: number): ScoreState {
  const base = Math.max(0, Math.round(kill.baseBounty * kill.healthScale));

  const flashes: ModifierFlash[] = [];
  let bonusPct = 0;

  if (kill.isHeadshot) {
    bonusPct += STYLE_HEADSHOT_PCT;
    flashes.push({ kind: "headshot", bonusPct: STYLE_HEADSHOT_PCT, at: now });
  }
  if (kill.isTwoForOne) {
    bonusPct += STYLE_TWO_FOR_ONE_PCT;
    flashes.push({ kind: "two-for-one", bonusPct: STYLE_TWO_FOR_ONE_PCT, at: now });
  }
  if (kill.isMidAir) {
    bonusPct += STYLE_MID_AIR_PCT;
    flashes.push({ kind: "mid-air", bonusPct: STYLE_MID_AIR_PCT, at: now });
  }
  const variety = varietyBonusPct(state.varietyChain, kill.archetypeId);
  if (variety > 0) {
    bonusPct += variety;
    flashes.push({ kind: "variety", bonusPct: variety, at: now });
  }

  // No-reload bonus uses the streak that INCLUDES this kill.
  const newStreak = state.noReloadStreak + 1;
  const noReload = noReloadBonusPct(newStreak);
  if (noReload > 0) {
    bonusPct += noReload;
    flashes.push({ kind: "no-reload", bonusPct: noReload, at: now });
  }

  const isStyleKill = bonusPct > 0;
  const newMultiplier = clamp(
    state.multiplier + (isStyleKill ? MULTIPLIER_STYLE_DELTA : MULTIPLIER_KILL_DELTA),
    MULTIPLIER_BASE,
    MULTIPLIER_CAP,
  );

  const scoreGain = Math.round(base * (1 + bonusPct) * newMultiplier);

  // Variety chain: last 4 unique-or-not kills.
  const nextChain = state.varietyChain.concat(kill.archetypeId).slice(-4);

  return {
    total: state.total + scoreGain,
    multiplier: newMultiplier,
    multiplierDecayAt: now + MULTIPLIER_GRACE_S,
    multiplierGraceUntil: now + MULTIPLIER_GRACE_S,
    noReloadStreak: newStreak,
    lastArchetypeKilled: kill.archetypeId,
    varietyChain: nextChain,
    modifierFlashes: pushFlashes(state.modifierFlashes, flashes),
  };
}

export function recordMiss(state: ScoreState, _now: number): ScoreState {
  return {
    ...state,
    multiplier: clamp(state.multiplier * MISS_MULTIPLIER_PENALTY, MULTIPLIER_BASE, MULTIPLIER_CAP),
  };
}

export function recordReload(state: ScoreState): ScoreState {
  return { ...state, noReloadStreak: 0 };
}

export function recordCollectible(state: ScoreState, now: number): ScoreState {
  return {
    ...state,
    multiplierGraceUntil: Math.max(state.multiplierGraceUntil, now + COLLECTIBLE_GRACE_BONUS_S),
    multiplierDecayAt: Math.max(state.multiplierDecayAt, now + COLLECTIBLE_GRACE_BONUS_S),
  };
}

export function tickDecay(state: ScoreState, now: number): ScoreState {
  if (now < state.multiplierDecayAt) return state;
  if (state.multiplier <= MULTIPLIER_BASE) {
    return state.multiplier === MULTIPLIER_BASE ? state : { ...state, multiplier: MULTIPLIER_BASE };
  }
  const elapsed = now - state.multiplierDecayAt;
  const drop = elapsed * MULTIPLIER_DECAY_PER_S;
  const next = clamp(state.multiplier - drop, MULTIPLIER_BASE, MULTIPLIER_CAP);
  return { ...state, multiplier: next, multiplierDecayAt: now };
}

// ─── Mission grading ──────────────────────────────────────────────────────

export function computeMissionGrade(
  total: number,
  stats: MissionStats,
  par: MissionPar,
): GradeResult {
  const score = par.parScore <= 0 ? 0 : clamp(total / par.parScore, 0, 1.5);
  const accuracy = stats.shotsFired === 0 ? 0 : stats.shotsHit / stats.shotsFired;
  const collect =
    stats.artifactsAvailable === 0 ? 1 : stats.artifactsFound / stats.artifactsAvailable;
  const raw = 0.55 * score + 0.3 * accuracy + 0.15 * collect;
  return {
    grade: rawToGrade(raw),
    raw,
    components: { score, accuracy, collect },
  };
}

const GRADE_TABLE: ReadonlyArray<readonly [Grade, number]> = [
  ["S+", 1.05],
  ["S", 0.9],
  ["A", 0.75],
  ["B", 0.6],
  ["C", 0.45],
  ["D", 0.3],
  ["F", 0],
];

function rawToGrade(raw: number): Grade {
  for (const [g, threshold] of GRADE_TABLE) {
    if (raw >= threshold) return g;
  }
  return "F";
}

export const _internals = { rawToGrade, varietyBonusPct, noReloadBonusPct };
