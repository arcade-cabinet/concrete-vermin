---
title: Mods — Twenty-Slot Catalog
updated: 2026-04-28
status: current
domain: technical
---

# Mods

Twenty mods across five slots: **choke**, **extended-mag**, **incendiary**, **scope**, **talisman**. Source of truth: `src/sim/archetypes/mods/index.ts`. Loadout cap: 3 slots active per mission.

This document is the editorial reference — what each mod IS, who it suits, and the in-fiction story.

## Slot semantics

- **choke** — Spread shaping. Shotgun-class only. Tightens for range, widens for crowds.
- **extended-mag** — Mag size or reload tax. One-per-weapon-class typical.
- **incendiary** — Damage uplift, sometimes with a payload (fire, area, crit chance).
- **scope** — Headshot bonus + spread reduction. Universal-friendly.
- **talisman** — Luck-flavored, Catholic-flavored, often universal. Small numbers, large feel.

---

## Chokes (2)

### `tight-choke` · Tight Choke · $80 · shotgun, sawed-off
Spread × 0.6.

**Pawnbroker pitch.** "For the rooftops. For when the bird's far and you can't get closer."
**Lore.** "Hand-machined by a guy in Long Island City who's no longer in business. Nobody asks why."

### `duckbill` · Duckbill · $60 · shotgun, sawed-off
Spread × 1.4, range × 0.85.

**Pawnbroker pitch.** "For the alley. Wide pattern, short throw. The roach won't see it coming."
**Lore.** "Surplus, NYPD anti-riot. Came in with a box of unrelated paperwork. Take it as part of the lot."

---

## Extended Mags (5)

### `drum-mag` · Drum Mag · $120 · smg
+20 mag, reload × 1.2.

**Pawnbroker pitch.** "Hold down the trigger. Don't think about it."
**Lore.** "From a guy in the Bronx who said it was for a movie. There was no movie."

### `speed-loader` · Speed Loader · $90 · revolver
Reload × 0.6.

**Pawnbroker pitch.** "If you're going to use the revolver right, you can't be slow on the reload."
**Lore.** "Standard police-issue, '74 redesign. Two hundred of them got 'lost' at the precinct. This is one."

### `auto-loader` · Auto-Loader · $100 · shotgun
+2 mag, reload × 0.85.

**Pawnbroker pitch.** "Eight in the tube, faster between."
**Lore.** "Italian custom. The plate inside reads '1969'. Don't ask."

### `fuel-tank-xl` · Fuel Tank XL · $110 · flamethrower
+40 mag (5s extra burn).

**Pawnbroker pitch.** "More flame for the boss."
**Lore.** "Welded by a longshoreman over the course of one weekend. He died of unrelated causes."

### `capacitor-bank` · Capacitor Bank · $130 · tesla
+4 mag.

**Pawnbroker pitch.** "Your grandfather built one of these. This one's a copy."
**Lore.** "The man who copied it was in his cellar for two months. He came up missing a finger but he came up."

---

## Incendiary (4)

### `incendiary-shells` · Incendiary Shells · $140 · shotgun, sawed-off
Damage × 1.25.

**Pawnbroker pitch.** "Hot load. Sets them on fire. Nobody likes fire."
**Lore.** "Smuggled from a Pennsylvania police range that closed in '76. Don't open the box near the radiator."

### `tracer-rounds` · Tracer Rounds · $110 · smg, revolver
Damage × 1.15, +5% crit.

**Pawnbroker pitch.** "Lights up the dark. The tunnels need it."
**Lore.** "Vietnam-era surplus. The orange phosphor still works. Smells like a barbecue."

### `thermobaric-canister` · Thermobaric · $180 · flamethrower
Damage × 1.4.

**Pawnbroker pitch.** "Don't ask. Just point it. The river will boil."
**Lore.** "Came in a wooden crate stenciled CCCP. The lid is screwed shut from the inside."

### `overcharge-coil` · Overcharge Coil · $170 · tesla
Damage × 1.3.

**Pawnbroker pitch.** "Pushes the rifle past spec. Your grandfather wouldn't approve. Take it anyway."
**Lore.** "Hand-wound by the Pawnbroker himself. The wire is older than you are."

---

## Scopes (3)

### `iron-sights-pro` · Iron Sights Pro · $70 · all
+0.15 headshot, spread × 0.85.

**Pawnbroker pitch.** "Better sights. Cheap. Take it."
**Lore.** "Polish post-war. The reticle is etched, not painted. Lasts forever."

### `marksman-scope` · Marksman Scope · $150 · revolver, smg
+0.35 headshot, range × 1.3.

**Pawnbroker pitch.** "For the King. You'll want it for the King."
**Lore.** "Off a deer rifle from upstate. The previous owner didn't shoot deer with it."

### `laser-sight` · Laser Sight · $100 · all
Spread × 0.7.

**Pawnbroker pitch.** "Red dot. Where the dot goes, the shot goes."
**Lore.** "Brand new. The Pawnbroker doesn't trust it but he'll sell it to you."

---

## Talismans (6)

### `rabbits-foot` · Rabbit's Foot · $140
+5% crit.

**Pawnbroker pitch.** "Take it. Don't ask whose foot it was."
**Lore.** "Card sharp's. Far Rockaway. He's no longer alive in the conventional sense."

### `st-anthony-medal` · St. Anthony Medal · $120
+3% crit, +0.10 headshot.

**Pawnbroker pitch.** "Wear it. For the river. For other things."
**Lore.** "St. Anthony of Padua finds lost things, including, evidently, you. Older than the shop."

### `lucky-shell` · Lucky Shell · $90 · shotgun, sawed-off
+8% crit.

**Pawnbroker pitch.** "Load it last. Never load it. That's the trick."
**Lore.** "Single 12-gauge brass shell, never fired, with a small cross filed into the rim."

### `subway-token` · Subway Token · $80
Damage × 1.05.

**Pawnbroker pitch.** "Take the token. Don't ask whose mouth it was in."
**Lore.** "Brass MTA token, pre-Y-cut redesign, with a small drilled hole. The man who carried it died with it in his mouth."

### `switchblade-charm` · Switchblade Charm · $110
Damage × 1.10, spread × 1.05.

**Pawnbroker pitch.** "Brass charm. Brooklyn. The luck is in the charm, not the blade."
**Lore.** "Off a charm bracelet sold to a longshoreman by a fortune-teller on Coney Island in 1953."

### `concrete-saint` · Concrete Saint · $200
+0.20 headshot, +5% crit.

**Pawnbroker pitch.** "Heaviest one I've got. Carry it anyway."
**Lore.** "Chip of unmarked grey concrete from the foundation of a tenement at 47 Cherry, knocked down in '47. He won't say more."

---

## Adding a mod

1. Edit `src/sim/archetypes/mods/index.ts`. Add to `MOD_DATA`.
2. Add an entry here with pitch + lore.
3. The pawn shop UI auto-discovers it.
