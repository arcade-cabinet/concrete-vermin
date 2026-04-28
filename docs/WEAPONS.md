---
title: Weapons — Six-Slot Arsenal
updated: 2026-04-28
status: current
domain: technical
---

# Weapons

The six weapons the Pawnbroker sells. Source of truth for runtime stats: `src/sim/archetypes/weapons/index.ts`. This document is the editorial reference — what each weapon FEELS like, how to pitch it to the player, and what mods round it out.

## Reading guide

- **Pawnbroker pitch** — the line he says when he hands it to you.
- **Mechanical signature** — pellet count, spread, rate of fire, mag, headshot bonus, range.
- **Loadout tips** — which mods stack well.
- **Visual signature** — muzzle shape, smoke color, audio profile.

---

## `shotgun` — Family Shotgun

**Pawnbroker pitch.** "Six shells, six birds. Don't break the freezer."

| Stat | Value |
|---|---|
| Pellets per shot | 6 |
| Spread | wide (10°) |
| Rate of fire | slow (0.6 s) |
| Mag | 6 |
| Headshot bonus | 1.4× |
| Range | medium |

**Loadout tips.** Tight Choke for rooftops; Duckbill for alleys (more spread, less range); Lucky Shell talisman for the late-mission burst.

**Visual signature.** Wide sodium-amber muzzle cone, brown-black smoke, deep low-frequency thump. The starter weapon. All three Streets missions assume it.

---

## `revolver` — Bensonhurst Revolver

**Pawnbroker pitch.** "Six rounds. Make them count. Especially the last one."

| Stat | Value |
|---|---|
| Pellets per shot | 1 (slug) |
| Spread | tight (1°) |
| Rate of fire | medium (0.4 s) |
| Mag | 6 |
| Headshot bonus | 2.0× |
| Range | long |

**Loadout tips.** Speed Loader for the reload tax; Iron Sights Pro for the headshot bonus; Saint-Anthony Medal talisman if you're going underwater.

**Visual signature.** Sharp narrow flash, light blue smoke, a sharp percussive *crack* — closer to a hammer-strike than the shotgun's thump. The boss-finisher.

---

## `smg` — Mac-10 (Off A Truck)

**Pawnbroker pitch.** "Don't ask which truck. Don't ask which truck."

| Stat | Value |
|---|---|
| Pellets per shot | 1 (auto) |
| Spread | medium (4°) |
| Rate of fire | very fast (0.06 s) |
| Mag | 30 |
| Headshot bonus | 1.1× |
| Range | medium |

**Loadout tips.** Drum Mag (30 → 50, slightly slower reload); Tracer Rounds for the dark tunnels; Switchblade Charm if you want the rhythm bonus.

**Visual signature.** Rapid white-yellow flicker; thin smoke; brass casings rain. Loud, mid-frequency rattle. Reads as "the cheap option that works."

---

## `sawed-off` — Sawed-Off Twelve

**Pawnbroker pitch.** "Two barrels. Both at once. That's the trick."

| Stat | Value |
|---|---|
| Pellets per shot | 12 (double-barrel) |
| Spread | very wide (16°) |
| Rate of fire | slow (0.7 s) |
| Mag | 2 |
| Headshot bonus | 1.2× |
| Range | short |

**Loadout tips.** Auto-Loader for the brutal 2-round mag; Incendiary Shells for the sewer mission; Concrete Saint talisman for the heft.

**Visual signature.** Two flashes side by side; thick brown smoke; a shorter, fatter thump than the family shotgun. Reads as "the wrong tool for everything except close work, and close work is what you've got."

---

## `flamethrower` — Diesel Flamethrower

**Pawnbroker pitch.** "It hates wind. Wind hates it. They get along."

| Stat | Value |
|---|---|
| Pellets per shot | continuous stream |
| Spread | cone (12°) |
| Rate of fire | continuous |
| Mag | 8 seconds of fuel |
| Headshot bonus | n/a (DoT) |
| Range | short |

**Loadout tips.** Fuel Tank XL for the boss; Thermobaric Canister for the area denial; Subway Token talisman if you're afraid you'll need the luck.

**Visual signature.** Wide orange-yellow cone with sodium core; thick black smoke trailing; low rumbling roar. Lights vermin on fire — they keep moving for a beat, then collapse. Reserved for the river mutant boss; pure power, almost no precision.

---

## `tesla` — Grandfather's Tesla Rifle

**Pawnbroker pitch.** "Belonged to your grandfather. Yes, that one."

| Stat | Value |
|---|---|
| Pellets per shot | 1 (chained arc — up to 3 targets) |
| Spread | locked (homes to nearest in cone) |
| Rate of fire | medium (0.5 s) |
| Mag | 12 (capacitor) |
| Headshot bonus | 1.6× |
| Range | long |

**Loadout tips.** Capacitor Bank for mag size; Overcharge Coil for damage at the cost of fire-rate; Marksman Scope for the King fight.

**Visual signature.** Pale blue arc with sodium spark at origin; ozone smell implied by HUD haze; sharp electric *snap* with crackle tail. The Act III weapon — feels like inheritance, hits like inheritance.

---

## Adding a weapon

1. Edit `src/sim/archetypes/weapons/index.ts`. Define the archetype with the existing schema.
2. Add it to `WEAPON_ARCHETYPES` in `src/sim/factories/mission.ts`.
3. Add a Pawnbroker pitch + visual + loadout entry here.
4. The pawn shop UI auto-discovers compatible mods via `mod.compatibleWith`.
