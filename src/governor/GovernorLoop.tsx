import { useTick } from "@pixi/react";
import { useRef } from "react";
import type { GameRunner } from "../runtime/runner";
import type { TunedWeapon } from "../sim/archetypes/mods";
import {
  type GovernorProfile,
  type GovernorState,
  PLAYTHROUGH,
  governorTick,
  makeGovernorState,
} from "./decide";

export {
  type GovernorProfile,
  type GovernorState,
  PLAYTHROUGH,
  governorTick,
  makeGovernorState,
} from "./decide";

export interface GovernorLoopProps {
  runner: GameRunner | null;
  weapon: TunedWeapon;
  enabled: boolean;
  profile?: GovernorProfile;
  playerLineY: number; // threat scoring origin
  shooterPos: { x: number; y: number }; // pursuit lookahead origin
}

// Returns null — renders no Pixi nodes; side-effects only via runner.queue*.
export function GovernorLoop({
  runner,
  weapon,
  enabled,
  profile = PLAYTHROUGH,
  playerLineY,
  shooterPos,
}: GovernorLoopProps): null {
  const stateRef = useRef<GovernorState>(makeGovernorState());

  useTick(() => {
    if (!enabled || !runner) return;
    governorTick({
      runner,
      weapon,
      profile,
      playerLineY,
      shooterPos,
      state: stateRef.current,
    });
  });

  return null;
}
