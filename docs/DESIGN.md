---
title: Design — Brand & Identity
updated: 2026-04-27
status: current
domain: product
---

# Design — Brand & Identity

## What this is

A pulpy 1979 NYC arcade rail-shooter. The Warriors meets Duck Hunt. You're the city's deniable Pest Control operator with a shotgun and a bad attitude. Vermin pour out of subway grates, fly off rooftops, scuttle out of dumpsters. You drag-aim, you fire, you read the strange notes you find at the crime scenes.

## What this is NOT

- Not neon. Not cyberpunk. Not Tron. The POC's `#00f0ff` cyan and `#ff2a2a` red are explicitly forbidden in production.
- Not grimdark. Splash gore stays bright and comic. No realistic blood. No lingering corpses.
- Not realistic. Vermin are exaggerated cartoon nasties. Player-character has no face, no name, no story-arc.
- Not a campaign with a plot. Story is **emergent** through collectible artifacts you find in the world.

## Palette

| Use | Token | Hex |
|---|---|---|
| Background / asphalt | `--bg-asphalt` | `#0d0c0a` |
| Concrete mid | `--bg-concrete` | `#3a3833` |
| Sodium-vapor street light | `--accent-sodium` | `#d4943a` |
| Subway tile cream | `--text-cream` | `#e8dcc4` |
| Brick / dried blood | `--accent-brick` | `#7a2818` |
| Piss-yellow highlight | `--accent-piss` | `#a89344` |
| Sickly fluorescent (elites only) | `--elite-green` | `#5c6b2e` |

## Typography

- Headlines: **Big Shoulders Display** (or stencil/condensed equivalent)
- HUD readouts: **Special Elite** (typewriter)
- Body / cutscene prose: **Courier Prime**

The POC's `Bebas Neue` and `Share Tech Mono` are forbidden — too clean, too cyberpunk.

## Surfaces & textures

- Halftone newsprint grain over everything (subtle)
- Wet asphalt reflections (PixiJS displacement filter)
- Scratched-glass CRT scanlines + sodium tint (the only place neon hex is allowed: [src/render/effects/crt.ts](../src/render/effects/crt.ts))
- Spray-paint splatter for hit feedback
- Brick wall background with peeling subway-poster collage

## Tone

Pulpy, comic-violent, Adult Swim. Cutscene voice rotates across artifact types: tabloid headlines, sanitation memos, payphone transcripts, bodega depositions, kid's crayon drawings, matchbook covers. Each pulpy in its own way.

## Player-journey gate

A cold player must understand the goal **within 15 seconds** of the title screen. If a tap-on-START doesn't lead them into a kill within 30 seconds, the design has failed.

See [docs/LORE.md](LORE.md) for setting bible.
