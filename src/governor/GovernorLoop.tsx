import { useTick } from "@pixi/react";
import { useRef } from "react";
import type { GameRunner } from "../runtime/runner";
import type { WeaponArchetype } from "../sim/archetypes/weapons/_types";
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
  weapon: WeaponArchetype;
  enabled: boolean;
  profile?: GovernorProfile;
  playerLineY: number; // threat scoring origin
  shooterPos: { x: number; y: number }; // pursuit lookahead origin
}

/** Headless sibling of <Loop>: drives runner.queueShot/queueReload via Yuka pursuit. Returns null. */
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
