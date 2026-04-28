import type { ArchetypeId } from "../archetypes/vermin";
import type { VerminTraitSet } from "../traits";

/**
 * Variants registry. A variant pairs an archetype with a partial trait
 * override set; `composeVermin(archetype, traits, rng)` produces the
 * runtime spawn record. Variants are the unit content authors balance
 * against — never expose raw archetypes to mission spec.
 *
 * 30 variants spanning all 12 archetypes (target: ≥2 per archetype,
 * ≥3 per non-boss, exactly 1 per boss).
 *
 * The variant id is the spawn-system's stable handle. Mission specs
 * reference variants by id; the analysis sweeper mutates one variant
 * at a time and re-runs the benchmark.
 */

export interface Variant {
  id: string;
  archetype: ArchetypeId;
  traits: Partial<VerminTraitSet>;
  /** Display name for the bestiary UI. */
  displayName: string;
}

const v = (
  id: string,
  archetype: ArchetypeId,
  displayName: string,
  traits: Partial<VerminTraitSet> = {},
): Variant => ({ id, archetype, displayName, traits });

const VARIANT_LIST: ReadonlyArray<Variant> = [
  // — Rats (3) —
  v("rat-mangy", "rat", "Mangy Rat"),
  v("rat-runt", "rat", "Runt Rat", { bodySize: "runt", speedMod: "scuttling" }),
  v("rat-engorged", "rat", "Engorged Rat", { bodySize: "engorged", healthMod: "tough" }),
  // — Roaches (3) —
  v("roach-baseline", "roach", "Common Roach"),
  v("roach-massive", "roach", "Massive Roach", { antennaSize: "massive", bodySize: "fat" }),
  v("roach-radioactive", "roach", "Radioactive Roach", {
    affliction: "radioactive",
    eyeGlow: "sickly-green",
  }),
  // — Pigeons (3) —
  v("pigeon-rooftop", "pigeon", "Rooftop Pigeon"),
  v("pigeon-rabid", "pigeon", "Rabid Pigeon", {
    affliction: "rabid",
    aggression: "berserk",
    eyeGlow: "red",
  }),
  v("pigeon-soot", "pigeon", "Soot Pigeon", { furColor: "soot-grey", speedMod: "panicked" }),
  // — Raccoons (3) —
  v("raccoon-trash-panda", "raccoon", "Trash Panda"),
  v("raccoon-cybernetic", "raccoon", "Cybernetic Raccoon", {
    affliction: "cybernetic",
    eyeGlow: "amber",
    healthMod: "armored",
  }),
  v("raccoon-engorged", "raccoon", "Engorged Raccoon", { bodySize: "engorged" }),
  // — Seagulls (3) —
  v("seagull-baseline", "seagull", "Wharf Seagull"),
  v("seagull-aggressive", "seagull", "Mean Seagull", { aggression: "aggressive" }),
  v("seagull-albino", "seagull", "Albino Seagull", { furColor: "albino", eyeGlow: "red" }),
  // — Feral cats (3) —
  v("feral-cat-baseline", "feral-cat", "Alley Cat"),
  v("feral-cat-skittish", "feral-cat", "Skittish Cat", {
    aggression: "skittish",
    speedMod: "panicked",
  }),
  v("feral-cat-tough", "feral-cat", "Mangled Cat", { healthMod: "tough", furColor: "rust" }),
  // — Sewer fish (3) —
  v("sewer-fish-baseline", "sewer-fish", "Sewer Pike"),
  v("sewer-fish-radioactive", "sewer-fish", "Glowing Pike", {
    affliction: "radioactive",
    eyeGlow: "sickly-green",
  }),
  v("sewer-fish-engorged", "sewer-fish", "Bloated Pike", {
    bodySize: "engorged",
    healthMod: "tough",
  }),
  // — Street dogs (3) —
  v("street-dog-baseline", "street-dog", "Stray Dog"),
  v("street-dog-rabid", "street-dog", "Rabid Stray", {
    affliction: "rabid",
    eyeGlow: "red",
    aggression: "berserk",
  }),
  v("street-dog-armored", "street-dog", "Junkyard Mastiff", {
    healthMod: "armored",
    bodySize: "fat",
  }),
  // — Geese (3) —
  v("goose-baseline", "goose", "Park Goose"),
  v("goose-aggressive", "goose", "War Goose", {
    aggression: "berserk",
    healthMod: "tough",
  }),
  v("goose-pied", "goose", "Pied Goose", { furColor: "piebald", speedMod: "scuttling" }),
  // — Bosses (1 each) —
  v("boss-dumpster-bear-classic", "boss-dumpster-bear", "Dumpster Bear", {
    bodySize: "engorged",
    healthMod: "armored",
    aggression: "aggressive",
  }),
  v("boss-river-mutant-classic", "boss-river-mutant", "River Mutant", {
    bodySize: "engorged",
    affliction: "radioactive",
    eyeGlow: "sickly-green",
    healthMod: "armored",
  }),
  v("boss-pigeon-king-classic", "boss-pigeon-king", "Pigeon King", {
    bodySize: "fat",
    aggression: "berserk",
    eyeGlow: "amber",
  }),
];

export const VARIANTS: ReadonlyMap<string, Readonly<Variant>> = new Map(
  VARIANT_LIST.map((vt) => [vt.id, Object.freeze({ ...vt, traits: Object.freeze(vt.traits) })]),
);

export type VariantId = string;

export function getVariant(id: VariantId): Readonly<Variant> | undefined {
  return VARIANTS.get(id);
}

export const VARIANT_IDS: ReadonlyArray<VariantId> = Object.freeze(VARIANT_LIST.map((vt) => vt.id));
