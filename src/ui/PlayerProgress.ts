import { create } from "zustand";
import { FIRST_MISSION_ID, MISSIONS } from "../sim/content/missions";
import type { WeaponArchetype } from "../sim/factories/mission";

export interface PlayerProgress {
  cash: number;
  unlockedWeapons: ReadonlyArray<WeaponArchetype>;
  activeMods: ReadonlyArray<string>;
  completedMissionIds: ReadonlyArray<string>;
  selectedMissionId: string;
  unlockMission: (id: string) => void;
  selectMission: (id: string) => void;
  awardCash: (amount: number) => void;
  spendCash: (amount: number) => boolean;
  unlockWeapon: (w: WeaponArchetype) => void;
  toggleMod: (modId: string) => void;
  reset: () => void;
}

const INITIAL_CASH = 0;
const INITIAL_WEAPONS: ReadonlyArray<WeaponArchetype> = ["shotgun"];

export function isMissionUnlocked(missionId: string, completed: ReadonlyArray<string>): boolean {
  if (missionId === FIRST_MISSION_ID) return true;
  const idx = MISSIONS.findIndex((m) => m.id === missionId);
  if (idx <= 0) return false;
  const prev = MISSIONS[idx - 1];
  return prev !== undefined && completed.includes(prev.id);
}

export const usePlayerProgress = create<PlayerProgress>((set) => ({
  cash: INITIAL_CASH,
  unlockedWeapons: INITIAL_WEAPONS,
  activeMods: [],
  completedMissionIds: [],
  selectedMissionId: FIRST_MISSION_ID,
  unlockMission: (id) =>
    set((s) =>
      s.completedMissionIds.includes(id)
        ? s
        : { completedMissionIds: [...s.completedMissionIds, id] },
    ),
  selectMission: (id) => set({ selectedMissionId: id }),
  awardCash: (amount) => set((s) => ({ cash: s.cash + Math.max(0, amount) })),
  spendCash: (amount) => {
    let ok = false;
    set((s) => {
      if (s.cash < amount) return s;
      ok = true;
      return { cash: s.cash - amount };
    });
    return ok;
  },
  unlockWeapon: (w) =>
    set((s) =>
      s.unlockedWeapons.includes(w) ? s : { unlockedWeapons: [...s.unlockedWeapons, w] },
    ),
  toggleMod: (modId) =>
    set((s) => ({
      activeMods: s.activeMods.includes(modId)
        ? s.activeMods.filter((m) => m !== modId)
        : [...s.activeMods, modId],
    })),
  reset: () =>
    set({
      cash: INITIAL_CASH,
      unlockedWeapons: INITIAL_WEAPONS,
      activeMods: [],
      completedMissionIds: [],
      selectedMissionId: FIRST_MISSION_ID,
    }),
}));
