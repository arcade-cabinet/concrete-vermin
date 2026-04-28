import { z } from "zod";
import type { WeaponArchetype, WeaponId } from "../weapons";

/**
 * Weapon mod registry. Mods are passive multipliers/additives applied
 * via `applyLoadout(weapon, mods)`. Up to 3 mods active per weapon.
 *
 * Categories:
 * - choke: tightens spread (shotgun-class only)
 * - extended-mag: more rounds before reload
 * - incendiary: damage uplift, often with a payload
 * - scope: headshotBonus + accuracy
 * - talisman: rabbit-foot / st-anthony / lucky-shell — % crit, luck-flavored
 *
 * Each mod is a frozen record. The `compatibleWith` array restricts
 * mods to weapon ids; an empty array means "all weapons".
 */

export const MOD_SLOTS = ["choke", "extended-mag", "incendiary", "scope", "talisman"] as const;
export type ModSlot = (typeof MOD_SLOTS)[number];

export const weaponModSchema = z
  .object({
    id: z.string().min(1),
    slot: z.enum(MOD_SLOTS),
    name: z.string().min(1),
    cost: z.number().int().nonnegative(),
    /** Empty = compatible with every weapon. */
    compatibleWith: z.array(z.string()).readonly(),
    /** Multiplicative damage adjustment. 1 = no change. */
    damageMod: z.number().positive().default(1),
    /** Additive crit-chance bonus [0..1]. */
    critChanceAdd: z.number().min(0).max(1).default(0),
    /** Additive headshot bonus on top of weapon.headshotBonus. */
    headshotBonusAdd: z.number().min(0).default(0),
    /** Spread multiplier; <1 tightens, >1 loosens. */
    spreadMul: z.number().positive().default(1),
    /** Extra rounds in the magazine. */
    magSizeAdd: z.number().int().nonnegative().default(0),
    /** Reload time multiplier; <1 faster. */
    reloadMul: z.number().positive().default(1),
    /** Range multiplier. */
    rangeMul: z.number().positive().default(1),
    /** Armor pierce additive [0..1]. */
    armorPierceAdd: z.number().min(0).max(1).default(0),
  })
  .strict();

export type WeaponMod = z.infer<typeof weaponModSchema>;

const MOD_DATA: ReadonlyArray<z.input<typeof weaponModSchema>> = [
  // — Chokes —
  {
    id: "tight-choke",
    slot: "choke",
    name: "Tight Choke",
    cost: 80,
    compatibleWith: ["shotgun", "sawed-off"],
    spreadMul: 0.6,
  },
  {
    id: "duckbill",
    slot: "choke",
    name: "Duckbill",
    cost: 60,
    compatibleWith: ["shotgun", "sawed-off"],
    spreadMul: 1.4,
    rangeMul: 0.85,
  },
  // — Extended mags —
  {
    id: "drum-mag",
    slot: "extended-mag",
    name: "Drum Mag",
    cost: 120,
    compatibleWith: ["smg"],
    magSizeAdd: 20,
    reloadMul: 1.2,
  },
  {
    id: "speed-loader",
    slot: "extended-mag",
    name: "Speed Loader",
    cost: 90,
    compatibleWith: ["revolver"],
    reloadMul: 0.6,
  },
  {
    id: "auto-loader",
    slot: "extended-mag",
    name: "Auto-Loader",
    cost: 100,
    compatibleWith: ["shotgun"],
    magSizeAdd: 2,
    reloadMul: 0.85,
  },
  {
    id: "fuel-tank-xl",
    slot: "extended-mag",
    name: "Fuel Tank XL",
    cost: 110,
    compatibleWith: ["flamethrower"],
    magSizeAdd: 40,
  },
  {
    id: "capacitor-bank",
    slot: "extended-mag",
    name: "Capacitor Bank",
    cost: 130,
    compatibleWith: ["tesla"],
    magSizeAdd: 4,
  },
  // — Incendiary —
  {
    id: "incendiary-shells",
    slot: "incendiary",
    name: "Incendiary Shells",
    cost: 140,
    compatibleWith: ["shotgun", "sawed-off"],
    damageMod: 1.25,
  },
  {
    id: "tracer-rounds",
    slot: "incendiary",
    name: "Tracer Rounds",
    cost: 110,
    compatibleWith: ["smg", "revolver"],
    damageMod: 1.15,
    critChanceAdd: 0.05,
  },
  {
    id: "thermobaric-canister",
    slot: "incendiary",
    name: "Thermobaric",
    cost: 180,
    compatibleWith: ["flamethrower"],
    damageMod: 1.4,
  },
  {
    id: "overcharge-coil",
    slot: "incendiary",
    name: "Overcharge Coil",
    cost: 170,
    compatibleWith: ["tesla"],
    damageMod: 1.3,
    armorPierceAdd: 0,
  },
  // — Scopes —
  {
    id: "iron-sights-pro",
    slot: "scope",
    name: "Iron Sights Pro",
    cost: 70,
    compatibleWith: [],
    headshotBonusAdd: 0.15,
    spreadMul: 0.85,
  },
  {
    id: "marksman-scope",
    slot: "scope",
    name: "Marksman Scope",
    cost: 150,
    compatibleWith: ["revolver", "smg"],
    headshotBonusAdd: 0.35,
    rangeMul: 1.3,
  },
  {
    id: "laser-sight",
    slot: "scope",
    name: "Laser Sight",
    cost: 100,
    compatibleWith: [],
    spreadMul: 0.7,
  },
  // — Talismans —
  {
    id: "rabbits-foot",
    slot: "talisman",
    name: "Rabbit's Foot",
    cost: 140,
    compatibleWith: [],
    critChanceAdd: 0.05,
  },
  {
    id: "st-anthony-medal",
    slot: "talisman",
    name: "St. Anthony Medal",
    cost: 120,
    compatibleWith: [],
    critChanceAdd: 0.03,
    headshotBonusAdd: 0.1,
  },
  {
    id: "lucky-shell",
    slot: "talisman",
    name: "Lucky Shell",
    cost: 90,
    compatibleWith: ["shotgun", "sawed-off"],
    critChanceAdd: 0.08,
  },
  {
    id: "subway-token",
    slot: "talisman",
    name: "Subway Token",
    cost: 80,
    compatibleWith: [],
    damageMod: 1.05,
  },
  {
    id: "switchblade-charm",
    slot: "talisman",
    name: "Switchblade Charm",
    cost: 110,
    compatibleWith: [],
    damageMod: 1.1,
    spreadMul: 1.05,
  },
  {
    id: "concrete-saint",
    slot: "talisman",
    name: "Concrete Saint",
    cost: 200,
    compatibleWith: [],
    headshotBonusAdd: 0.2,
    critChanceAdd: 0.05,
  },
];

// Internal mutable map kept private — `get`/`size`/iteration go through
// the frozen view below. This prevents callers from .set()/.delete()ing
// at runtime (ReadonlyMap is a compile-time-only protection).
const _MOD_MAP = new Map<string, Readonly<WeaponMod>>(
  MOD_DATA.map((d) => [d.id, Object.freeze(weaponModSchema.parse(d))]),
);

export const MOD_REGISTRY: Readonly<{
  size: number;
  get(id: string): Readonly<WeaponMod> | undefined;
  has(id: string): boolean;
  values(): IterableIterator<Readonly<WeaponMod>>;
}> = Object.freeze({
  get size() {
    return _MOD_MAP.size;
  },
  get(id: string) {
    return _MOD_MAP.get(id);
  },
  has(id: string) {
    return _MOD_MAP.has(id);
  },
  values() {
    return _MOD_MAP.values();
  },
});

export function getMod(id: string): Readonly<WeaponMod> | undefined {
  return _MOD_MAP.get(id);
}

export const MAX_LOADOUT_SLOTS = 3;

/**
 * Tuned weapon: the weapon archetype with all mod modifiers folded in.
 * The damage resolver consumes `damageMods` and `critChanceMods` arrays
 * directly, so applyLoadout returns those alongside the rolled-up
 * scalar fields the runtime needs (magSize, reloadMs, spread, etc.).
 */
export interface TunedWeapon {
  base: Readonly<WeaponArchetype>;
  mods: ReadonlyArray<Readonly<WeaponMod>>;
  /** Final per-projectile values after mods. */
  spread: number;
  magSize: number;
  reloadMs: number;
  rangeMax: number;
  headshotBonus: number;
  critChance: number;
  armorPierce: number;
  /** Damage stacking is multiplicative; the resolver applies these. */
  damageMods: ReadonlyArray<number>;
  critChanceMods: ReadonlyArray<number>;
}

export class LoadoutError extends Error {}

export function applyLoadout(
  weapon: Readonly<WeaponArchetype>,
  mods: ReadonlyArray<Readonly<WeaponMod>>,
): TunedWeapon {
  if (mods.length > MAX_LOADOUT_SLOTS) {
    throw new LoadoutError(`Loadout exceeds ${MAX_LOADOUT_SLOTS}-slot cap (got ${mods.length}).`);
  }
  for (const m of mods) {
    if (m.compatibleWith.length > 0 && !m.compatibleWith.includes(weapon.id as WeaponId)) {
      throw new LoadoutError(`Mod '${m.id}' is not compatible with weapon '${weapon.id}'.`);
    }
  }
  // Reject duplicate slots — a loadout is one mod per slot type.
  const slots = new Set<string>();
  for (const m of mods) {
    if (slots.has(m.slot)) throw new LoadoutError(`Loadout has two '${m.slot}' mods.`);
    slots.add(m.slot);
  }

  let spread = weapon.spread;
  let magSize = weapon.magSize;
  let reloadMs = weapon.reloadMs;
  let rangeMax = weapon.rangeMax;
  let headshotBonus = weapon.headshotBonus;
  let critChance = weapon.critChance;
  let armorPierce = weapon.armorPierce;
  const damageMods: number[] = [];
  const critChanceMods: number[] = [];

  for (const m of mods) {
    spread *= m.spreadMul;
    magSize += m.magSizeAdd;
    reloadMs = Math.round(reloadMs * m.reloadMul);
    rangeMax *= m.rangeMul;
    headshotBonus += m.headshotBonusAdd;
    critChance = Math.min(1, critChance + 0); // critChance itself isn't mutated; mods feed critChanceMods
    armorPierce = Math.min(1, armorPierce + m.armorPierceAdd);
    if (m.damageMod !== 1) damageMods.push(m.damageMod);
    if (m.critChanceAdd > 0) critChanceMods.push(m.critChanceAdd);
  }

  return {
    base: weapon,
    mods,
    spread,
    magSize,
    reloadMs,
    rangeMax,
    headshotBonus,
    critChance,
    armorPierce,
    damageMods,
    critChanceMods,
  };
}
