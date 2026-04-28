import type { AIBrain } from "../../archetypes/vermin";
import type { Brain } from "./_types";
import { ambusherBrain } from "./ambusher";
import { chargerBrain } from "./charger";
import { diveBomberBrain } from "./dive-bomber";
import { erraticFlyerBrain } from "./erratic-flyer";
import { groundSwarmBrain } from "./ground-swarm";
import { lungerBrain } from "./lunger";
import { mixedThreatBrain } from "./mixed-threat";
import { popUpBrain } from "./pop-up";
import { wallClimberBrain } from "./wall-climber";

export type { Brain, BrainStep, BrainWorld, GoapPlan, Vec2, VerminSelf } from "./_types";

/**
 * Brain registry. boss-scripted brains live with their boss and use
 * the GOAP planner directly — they're not in this lookup.
 */
export const BRAIN_REGISTRY: Readonly<Record<Exclude<AIBrain, "boss-scripted">, Brain>> =
  Object.freeze({
    "ground-swarm": groundSwarmBrain,
    "wall-climber": wallClimberBrain,
    "erratic-flyer": erraticFlyerBrain,
    "dive-bomber": diveBomberBrain,
    lunger: lungerBrain,
    ambusher: ambusherBrain,
    "pop-up": popUpBrain,
    charger: chargerBrain,
    "mixed-threat": mixedThreatBrain,
  });

export function getBrain(id: AIBrain): Brain | null {
  if (id === "boss-scripted") return null;
  return BRAIN_REGISTRY[id];
}
