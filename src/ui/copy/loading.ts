import { loadingTips, pickLoadingTip } from "../../sim/content/lore";

export const ALL_LOADING_TIPS: ReadonlyArray<string> = loadingTips;

export function randomLoadingTip(rng: () => number = Math.random): string {
  return pickLoadingTip(rng());
}
