import type { ActId, Mission } from "../../factories/mission";
import { mission08 } from "./above/mission-08";
import { mission09 } from "./above/mission-09";
import { mission01 } from "./streets/mission-01";
import { mission02 } from "./streets/mission-02";
import { mission03 } from "./streets/mission-03";
import { mission04 } from "./streets/mission-04";
import { mission05 } from "./underworld/mission-05";
import { mission06 } from "./underworld/mission-06";
import { mission07 } from "./underworld/mission-07";

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

const MISSIONS_BY_ID: ReadonlyMap<string, Mission> = new Map(MISSIONS.map((m) => [m.id, m]));

export function getMission(id: string): Mission {
  const m = MISSIONS_BY_ID.get(id);
  if (!m) throw new Error(`getMission: unknown mission id "${id}"`);
  return m;
}

export function listMissionsByAct(act: ActId): ReadonlyArray<Mission> {
  return MISSIONS.filter((m) => m.act === act);
}

export const FIRST_MISSION_ID = "streets-01-bodega";
