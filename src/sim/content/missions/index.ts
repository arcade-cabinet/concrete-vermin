import type { ActId, Mission } from "../../factories/mission";
import { mission08 } from "./above/mission-08";
import { mission09 } from "./above/mission-09";
import { secretAboveGrandfather } from "./secret/secret-above-grandfather";
import { secretStreetsCellar } from "./secret/secret-streets-cellar";
import { secretUnderworldCathedral } from "./secret/secret-underworld-cathedral";
import { mission01 } from "./streets/mission-01";
import { mission02 } from "./streets/mission-02";
import { mission03 } from "./streets/mission-03";
import { mission04 } from "./streets/mission-04";
import { mission05 } from "./underworld/mission-05";
import { mission06 } from "./underworld/mission-06";
import { mission07 } from "./underworld/mission-07";

/**
 * Canonical, linear mission progression. Drives the act/progress UI
 * in MissionSelect and the kill-count totals on the Daily Vermin
 * tabloid. Secret missions are NOT in this list — they live in
 * SECRET_MISSIONS so they can't accidentally land on the linear path.
 */
export const MISSIONS: ReadonlyArray<Mission> = Object.freeze([
  mission01,
  mission02,
  mission03,
  mission04,
  mission05,
  mission06,
  mission07,
  mission08,
  mission09,
]);

export const SECRET_MISSIONS: ReadonlyArray<Mission> = Object.freeze([
  secretStreetsCellar,
  secretUnderworldCathedral,
  secretAboveGrandfather,
]);

const ALL_MISSIONS: ReadonlyArray<Mission> = Object.freeze([...MISSIONS, ...SECRET_MISSIONS]);

const MISSIONS_BY_ID: ReadonlyMap<string, Mission> = new Map(ALL_MISSIONS.map((m) => [m.id, m]));

export function getMission(id: string): Mission {
  const m = MISSIONS_BY_ID.get(id);
  if (!m) throw new Error(`getMission: unknown mission id "${id}"`);
  return m;
}

export function listMissionsByAct(act: ActId): ReadonlyArray<Mission> {
  return MISSIONS.filter((m) => m.act === act);
}

export function listSecretMissionsByAct(act: ActId): ReadonlyArray<Mission> {
  return SECRET_MISSIONS.filter((m) => m.act === act);
}

export const FIRST_MISSION_ID = "streets-01-bodega";
