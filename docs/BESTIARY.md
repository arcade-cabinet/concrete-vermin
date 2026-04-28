---
title: Bestiary — Archetype + Trait Taxonomy
updated: 2026-04-27
status: current
domain: technical
---

# Bestiary

Reference for the data model. Canonical types live in:
- `src/sim/archetypes/vermin/` (one file per archetype)
- `src/sim/traits/vermin.ts` (trait taxonomy)
- `src/sim/content/variants.ts` (named variants)

The in-game Bestiary screen ([src/ui/screens/Bestiary.tsx](../src/ui/screens/Bestiary.tsx)) auto-derives entries from `VARIANTS`.

## Archetypes (~12)

| ID | Locomotion | Brain | Notes |
|---|---|---|---|
| `rat` | ground | ground-swarm | the foundation; comes in many variants |
| `roach` | wall | wall-climber | tiny, very fast, ceiling-drops |
| `pigeon` | flying | erratic-flyer | unpredictable, mid-air kills give bonus |
| `raccoon` | ground | lunger | pause-then-leap; range threat |
| `seagull` | flying | dive-bomber | peels off and strikes |
| `feral-cat` | ground | ambusher | hides behind cover, strikes |
| `sewer-fish` | amphibious | pop-up | surfaces from grates |
| `street-dog` | ground | charger | straight-line aggression |
| `goose` | mixed | mixed-threat | ground + flight switching, extremely hostile |
| `boss-dumpster-bear` | ground | boss-scripted | act 1 boss |
| `boss-river-mutant` | amphibious | boss-scripted | act 2 boss |
| `boss-pigeon-king` | flying | boss-scripted | act 3 final boss |

## Traits

See `src/sim/traits/vermin.ts` for the canonical interface. Three tiers:

**Visual** (cosmetic + small stat impact): `furColor`, `eyeGlow`, `bodySize`, `tailLength`, `antennaSize`.

**Behavioral** (changes how the AI plans): `speedMod`, `healthMod`, `aggression`.

**Affliction** (elite/boss tier — rendering AND behavioral): `affliction`.
- `none` (default)
- `rabid`: +50% speed, foam particle effect, on-death small AOE infect chance
- `radioactive`: sickly-green glow aura, leaves toxic puddle on death
- `cybernetic`: metallic plating, +100% health, spark particles on hit

## Variants

~30-50 named compositions in `src/sim/content/variants.ts`. Each is `{ archetype, traits }`. Examples:

- `sewer-rat` = rat + `{furColor: oil-black, eyeGlow: red, bodySize: fat, healthMod: tough}`
- `central-park-goose` = goose + `{bodySize: engorged, aggression: berserk, affliction: rabid}`
- `glow-rat` = rat + `{furColor: albino, eyeGlow: sickly-green, affliction: radioactive}`

## Adding a variant

1. Edit `src/sim/content/variants.ts`. Add an entry.
2. Add flavor text in `src/sim/content/bestiary/<variant-id>.ts` (50-100 word entry, Adult-Swim-comic tone, see DESIGN.md).
3. Run `pnpm test:node src/sim/content/variants.test.ts` to verify composition.
4. Run `pnpm analysis:smoke` if the variant appears in any mission's encounters — check it doesn't break balance.
