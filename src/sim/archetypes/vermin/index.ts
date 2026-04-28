import { type Archetype, type ArchetypeId, archetypeSchema } from "./_types";
import { bossDumpsterBear } from "./boss-dumpster-bear";
import { bossPigeonKing } from "./boss-pigeon-king";
import { bossRiverMutant } from "./boss-river-mutant";
import { feralCat } from "./feral-cat";
import { goose } from "./goose";
import { pigeon } from "./pigeon";
import { raccoon } from "./raccoon";
import { rat } from "./rat";
import { roach } from "./roach";
import { seagull } from "./seagull";
import { sewerFish } from "./sewer-fish";
import { streetDog } from "./street-dog";

export type { AIBrain, Archetype, ArchetypeId, Locomotion } from "./_types";
export { AI_BRAINS, ARCHETYPE_IDS, archetypeSchema, LOCOMOTIONS } from "./_types";

const RAW: Record<ArchetypeId, Readonly<Archetype>> = {
  rat,
  roach,
  pigeon,
  raccoon,
  seagull,
  "feral-cat": feralCat,
  "sewer-fish": sewerFish,
  "street-dog": streetDog,
  goose,
  "boss-dumpster-bear": bossDumpsterBear,
  "boss-river-mutant": bossRiverMutant,
  "boss-pigeon-king": bossPigeonKing,
};

// Validate every archetype at module load. Throws on any schema violation,
// preventing a bad data file from silently ending up in production.
for (const [id, value] of Object.entries(RAW)) {
  const result = archetypeSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`Invalid archetype "${id}": ${result.error.message}`);
  }
}

export const ARCHETYPES: Record<ArchetypeId, Readonly<Archetype>> = Object.freeze(RAW);

export function getArchetype(id: ArchetypeId): Readonly<Archetype> {
  return ARCHETYPES[id];
}
