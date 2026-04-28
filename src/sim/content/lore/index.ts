import { z } from "zod";
import barksData from "./barks.json" with { type: "json" };
import calloutsData from "./callouts.json" with { type: "json" };
import charactersData from "./characters.json" with { type: "json" };
import deathData from "./death.json" with { type: "json" };
import endingsData from "./endings.json" with { type: "json" };
import frameData from "./frame.json" with { type: "json" };
import loadingData from "./loading.json" with { type: "json" };
import settingData from "./setting.json" with { type: "json" };
import talismansData from "./talismans.json" with { type: "json" };
// Per-mission lore
import above08 from "./missions/above-08-rooftop-chase.json" with { type: "json" };
import above09 from "./missions/above-09-pigeon-king.json" with { type: "json" };
import streets01 from "./missions/streets-01-bodega.json" with { type: "json" };
import streets02 from "./missions/streets-02-alley.json" with { type: "json" };
import streets03 from "./missions/streets-03-rooftop.json" with { type: "json" };
import streets04 from "./missions/streets-04-dumpster-bear.json" with { type: "json" };
import underworld05 from "./missions/underworld-05-subway.json" with { type: "json" };
import underworld06 from "./missions/underworld-06-sewer-shallows.json" with { type: "json" };
import underworld07 from "./missions/underworld-07-river-mutant.json" with { type: "json" };

const settingSchema = z
  .object({
    era: z.string().min(1),
    city: z.string().min(1),
    premise: z.string().min(20),
    tone: z.string().min(1),
    antiTone: z.string().min(1),
    acts: z.record(
      z.string(),
      z.object({ title: z.string().min(1), intro: z.string().min(40) }).strict(),
    ),
  })
  .strict();

const charactersSchema = z
  .object({
    pawnbroker: z
      .object({
        fullName: z.string(),
        born: z.string(),
        background: z.string(),
        voice: z.string(),
        motive: z.string(),
        firstActReveal: z.string(),
      })
      .strict(),
    player: z
      .object({
        name: z.string(),
        age: z.string(),
        background: z.string(),
        frame: z.string(),
      })
      .strict(),
  })
  .strict();

const endingsSchema = z
  .object({
    goodEnd: z.object({ title: z.string(), vignette: z.string().min(80) }).strict(),
    badEnd: z.object({ title: z.string(), vignette: z.string().min(80) }).strict(),
    victoryByGrade: z.record(z.string(), z.string()),
    defeatByCause: z.record(z.string(), z.string()),
  })
  .strict();

const talismanSchema = z.object({ displayName: z.string(), story: z.string().min(40) }).strict();
const talismansSchema = z.record(z.string(), talismanSchema);

const barksSchema = z
  .object({
    pawnbroker: z.array(z.string().min(2)).min(20),
    rumorMill: z.array(z.string().min(2)).min(10),
  })
  .strict();

const frameSchema = z
  .object({
    year: z.number().int(),
    premise: z.string(),
    cabinetPlaque: z.array(z.string()).min(1),
    easterEggs: z.array(z.string()).min(1),
  })
  .strict();

const missionDebriefSchema = z
  .object({
    win: z.string().min(20),
    loss: z.string().min(20),
    sGrade: z.string().min(20),
  })
  .strict();

const missionLoreSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    blurb: z.string().min(20),
    briefing: z.string().min(40),
    epigraph: z.string().min(2),
    debrief: missionDebriefSchema,
  })
  .strict();

const loadingSchema = z.array(z.string().min(2)).min(30);

const deathSchema = z.record(z.string(), z.string().min(4));

const calloutsSchema = z
  .object({
    killStreak: z.record(z.string(), z.string()),
    headshotStreak: z.record(z.string(), z.string()),
    noReloadStreak: z.record(z.string(), z.string()),
    chainKill: z.record(z.string(), z.string()),
    bossPhase: z.record(z.string(), z.string()),
    noDamage: z.record(z.string(), z.string()),
    twoForOne: z.string(),
    midAir: z.string(),
    variety: z.string(),
    perfectMission: z.string(),
    lastShellKill: z.string(),
    lastSecondClear: z.string(),
    lowLifeKill: z.string(),
    comeback: z.string(),
    bossOpen: z.string(),
    bossDown: z.string(),
    noModsRun: z.string(),
    perfectAccuracy: z.string(),
    noWasteShells: z.string(),
    firstClear: z.string(),
    tutorialClear: z.string(),
    rapidClear: z.string(),
    marathonClear: z.string(),
    bossOnly: z.string(),
    vermin50: z.string(),
    vermin100: z.string(),
    vermin500: z.string(),
  })
  .strict();

export const setting = Object.freeze(settingSchema.parse(settingData));
export const characters = Object.freeze(charactersSchema.parse(charactersData));
export const endings = Object.freeze(endingsSchema.parse(endingsData));
export const talismans = Object.freeze(talismansSchema.parse(talismansData));
export const barks = Object.freeze(barksSchema.parse(barksData));
export const frame = Object.freeze(frameSchema.parse(frameData));
export const loadingTips = Object.freeze(loadingSchema.parse(loadingData));
export const deathLines = Object.freeze(deathSchema.parse(deathData));
export const callouts = Object.freeze(calloutsSchema.parse(calloutsData));

const MISSION_LORE_LIST = [
  streets01,
  streets02,
  streets03,
  streets04,
  underworld05,
  underworld06,
  underworld07,
  above08,
  above09,
].map((data) => Object.freeze(missionLoreSchema.parse(data)));

const MISSION_LORE: ReadonlyMap<string, (typeof MISSION_LORE_LIST)[number]> = new Map(
  MISSION_LORE_LIST.map((m) => [m.id, m]),
);

export type MissionLore = (typeof MISSION_LORE_LIST)[number];

export function getMissionLore(id: string): MissionLore {
  const m = MISSION_LORE.get(id);
  if (!m) throw new Error(`getMissionLore: unknown mission id "${id}"`);
  return m;
}

export const ALL_MISSION_LORE: ReadonlyArray<MissionLore> = Object.freeze(MISSION_LORE_LIST);

/** Random-but-deterministic Pawnbroker bark; pass a uniform [0,1) value. */
export function pickBark(uniform: number): string {
  const arr = barks.pawnbroker;
  const idx = Math.min(arr.length - 1, Math.max(0, Math.floor(uniform * arr.length)));
  return arr[idx] as string;
}

/** Same for rumor-mill flavor. */
export function pickRumor(uniform: number): string {
  const arr = barks.rumorMill;
  const idx = Math.min(arr.length - 1, Math.max(0, Math.floor(uniform * arr.length)));
  return arr[idx] as string;
}

export function pickLoadingTip(uniform: number): string {
  const arr = loadingTips;
  const idx = Math.min(arr.length - 1, Math.max(0, Math.floor(uniform * arr.length)));
  return arr[idx] as string;
}

export function deathLineFor(archetypeOrCause: string): string {
  return (
    (deathLines as Readonly<Record<string, string>>)[archetypeOrCause] ??
    (deathLines as Readonly<Record<string, string>>).wipe ??
    "He'll find another kid."
  );
}

export type DebriefOutcome = "win" | "loss" | "sGrade";

export function pawnbrokerDebriefFor(missionId: string, outcome: DebriefOutcome): string {
  return getMissionLore(missionId).debrief[outcome];
}
