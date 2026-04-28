import {
  PROJECTILE_TYPES,
  TRAIL_TYPES,
  WEAPON_IDS,
  type WeaponArchetype,
  type WeaponId,
  weaponArchetypeSchema,
} from "./_types";
import { flamethrower } from "./flamethrower";
import { revolver } from "./revolver";
import { sawedOff } from "./sawed-off";
import { shotgun } from "./shotgun";
import { smg } from "./smg";
import { tesla } from "./tesla";

export type { ProjectileType, TrailType } from "./_types";
export {
  PROJECTILE_TYPES,
  TRAIL_TYPES,
  WEAPON_IDS,
  type WeaponArchetype,
  type WeaponId,
  weaponArchetypeSchema,
};

export const WEAPON_REGISTRY: Readonly<Record<WeaponId, Readonly<WeaponArchetype>>> = Object.freeze(
  {
    shotgun,
    revolver,
    smg,
    "sawed-off": sawedOff,
    flamethrower,
    tesla,
  },
);

export function getWeapon(id: WeaponId): Readonly<WeaponArchetype> {
  return WEAPON_REGISTRY[id];
}
