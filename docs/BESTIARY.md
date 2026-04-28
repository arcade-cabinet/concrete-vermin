---
title: Bestiary — Twelve Archetypes
updated: 2026-04-28
status: current
domain: technical
---

# Bestiary

The twelve archetypes of *Concrete Vermin*. Source of truth for runtime behavior is `src/sim/archetypes/vermin/<id>.ts`. Source of truth for variants (named trait compositions) is `src/sim/content/variants.ts`. The in-game Bestiary screen will derive entries from these tables.

This document is the **editorial reference** — what each thing IS, how it acts, what kind of bounty it pays, and the line you'd read about it on the cabinet's bestiary screen.

## Reading guide

- **Common name** — what New Yorkers call it.
- **Taxonomic flavor** — the in-fiction "scientific" name (pulpy, half-real). Used as Bestiary subtitle.
- **Range stats** — typical health × speed × damage band, normalized to the rat baseline (rat = 1.0×).
- **Behavior tells** — what the player should be watching for to read its move.
- **Bounty band** — relative cash payout (S=large, A=above average, B=baseline, C=cheap, K=king-tier).
- **Splash** — the splash color the renderer paints on death (per-archetype palette in `src/render/SplashLayer.tsx`).
- **Lore blurb** — the line that ships in the Bestiary screen.

---

## `rat` — Mangy Rat

> *Rattus norvegicus tactica*

| Stat | Value |
|---|---|
| Health × Speed × Damage | 1.0 × 1.0 × 1.0 |
| Bounty | C |
| Splash | dirty pink + sodium streaks |

**Behavior tells.** Scuttles in straight lines, faster when grouped. Engorged variants slow but tank a slug.

**Lore blurb.** "Brooklyn-strain field rat. Used to fear people. Stopped fearing people about three weeks ago. Mr. Halpern at the bodega will pay the Pawnbroker off the books to make them go away."

---

## `roach` — Common Roach

> *Periplaneta gigantica*

| Stat | Value |
|---|---|
| Health × Speed × Damage | 0.4 × 1.6 × 0.5 |
| Bounty | C |
| Splash | amber-yellow + brown |

**Behavior tells.** Wall-climbs, drops from above, comes in clusters. One slug usually catches three; aim for the densest knot.

**Lore blurb.** "Not the kitchen kind. The kind you can hear from twenty feet. They're not afraid of light any more, which is the part that matters."

---

## `pigeon` — Rooftop Pigeon

> *Columba livia urbis*

| Stat | Value |
|---|---|
| Health × Speed × Damage | 0.7 × 1.3 × 0.7 |
| Bounty | B (mid-air kills × 1.4) |
| Splash | charcoal grey + iridescent oil-slick fleck |

**Behavior tells.** Fakes left, dives right. Always. Rabid variants don't fake — they just dive.

**Lore blurb.** "The ones who used to fly south have stopped flying south. Mrs. Costanza on the fifth floor screamed about them for a week before anyone listened."

---

## `raccoon` — Trash Panda

> *Procyon lotor sanitarius*

| Stat | Value |
|---|---|
| Health × Speed × Damage | 1.6 × 0.9 × 1.2 |
| Bounty | B |
| Splash | sodium amber + black mask |

**Behavior tells.** Pause-then-leap from cover. The pause is the tell — you have ~250ms after it stops moving to put a slug into it before the leap.

**Lore blurb.** "Trash Panda. Sanitation jokes about them and then sanitation stops joking. The cybernetic ones are a different conversation."

---

## `seagull` — Wharf Seagull

> *Larus argentatus belligerens*

| Stat | Value |
|---|---|
| Health × Speed × Damage | 0.8 × 1.4 × 0.9 |
| Bounty | B |
| Splash | white feather burst + pink |

**Behavior tells.** Peels off the flock, then strikes in a long arc. The peel is the tell — fire as it begins to bank.

**Lore blurb.** "The gulls run protection. Nobody knows what they're protecting. They will steal your sandwich and they will not give it back."

---

## `feral-cat` — Alley Cat

> *Felis catus urbana*

| Stat | Value |
|---|---|
| Health × Speed × Damage | 1.2 × 1.5 × 1.0 |
| Bounty | B |
| Splash | rust orange + black |

**Behavior tells.** Hides behind cover, then strikes from a flank. Skittish variants flicker between cover; tough variants commit.

**Lore blurb.** "Alley cat. Half of them have names. The other half have eaten people who had names."

---

## `sewer-fish` — Sewer Pike

> *Esox cloacalis*

| Stat | Value |
|---|---|
| Health × Speed × Damage | 1.4 × 1.1 × 1.3 |
| Bounty | A |
| Splash | dark green + bioluminescent fleck |

**Behavior tells.** Surfaces from grates with a vertical lunge. Wait for the surface — shooting underwater wastes the slug.

**Lore blurb.** "The water is warm. It shouldn't be warm. The fish in there have not been fish for a while."

---

## `street-dog` — Pack Dog

> *Canis lupus familiaris bowery*

| Stat | Value |
|---|---|
| Health × Speed × Damage | 1.8 × 1.3 × 1.4 |
| Bounty | A |
| Splash | rust + sodium |

**Behavior tells.** Charges in a straight line; pack mates flank. The lead dog will lock eyes — that's the tell.

**Lore blurb.** "Used to belong to a longshoreman. The longshoreman is on a list now. The dogs are on a different list."

---

## `goose` — Canada Goose

> *Branta canadensis hostilis*

| Stat | Value |
|---|---|
| Health × Speed × Damage | 2.0 × 1.0 × 1.5 |
| Bounty | A |
| Splash | white down + brown stripe |

**Behavior tells.** Switches between ground charge and short flight. Smarter than the gulls; takes the flank, not the front.

**Lore blurb.** "The geese have organized. Take the geese first. Trust me on that one."

---

## `boss-dumpster-bear` — Dumpster Bear

> *Ursus actually-no-this-shouldn't-exist*

| Stat | Value |
|---|---|
| Health × Speed × Damage | 18.0 × 0.6 × 4.0 |
| Bounty | S |
| Splash | brick red + matted fur |

**Behavior tells.** Three-stage attack: shoulder-rear, charge, claw-arc. Open at the shoulder-rear (front exposed); covered during charge; open after the claw-arc lands.

**Lore blurb.** "Sanitation called it a 'big raccoon.' It is not a big raccoon. The shift super has not been to work in three days, and we should not ask why."

---

## `boss-river-mutant` — River Mutant

> *Pisces innominatus*

| Stat | Value |
|---|---|
| Health × Speed × Damage | 22.0 × 0.8 × 5.0 |
| Bounty | S |
| Splash | bioluminescent green + black silt |

**Behavior tells.** Submerges, then surfaces with a tendril sweep. Open during the surface and during the recovery; covered while submerged. The flame works on the recovery.

**Lore blurb.** "Where the East River cuts under the Williamsburg piers. The Pawnbroker doesn't have a name for it. Wear the medal. Don't look at it after."

---

## `boss-pigeon-king` — Pigeon King

> *Columba rex coronatus*

| Stat | Value |
|---|---|
| Health × Speed × Damage | 30.0 × 1.4 × 6.0 |
| Bounty | K |
| Splash | charcoal grey + bottle-cap silver + sodium |

**Behavior tells.** Court of pigeons swarms; King circles. Open between swarm waves and during the King's perched-roar phase. Tesla rifle holds it.

**Lore blurb.** "Top of the Woolworth Building. He has been waiting for you longer than you have been alive. Finish what your grandfather started."

---

## Adding a variant

1. Edit `src/sim/content/variants.ts`. Add an entry — pick an existing archetype and a partial trait override.
2. Run `pnpm test:node` — the variants test enforces ≥2 variants per non-boss archetype.
3. If the variant appears in a mission encounter, run `pnpm analysis:smoke` to confirm it doesn't break balance.
