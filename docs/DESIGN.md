---
title: Design — Brand & Identity
updated: 2026-04-28
status: current
domain: product
---

# Design — Brand & Identity

## What this is

A pulpy 1979 NYC arcade rail-shooter. The Warriors meets Duck Hunt. You're the Pawnbroker's deniable pest-control kid with a shotgun and a list of addresses. Vermin pour out of subway grates, fly off rooftops, scuttle out of dumpsters. You drag-aim, you fire, you read the strange notes you find at the crime scenes.

## What this is NOT

- **Not neon. Not cyberpunk. Not Tron.** The POC's `#00f0ff` cyan and `#ff2a2a` red are explicitly forbidden in production. Pre-edit gate enforces this for source code.
- **Not grimdark.** Splash colors stay bright. The roaches are awful but funny. No realistic blood. No lingering corpses.
- **Not realistic.** Vermin are exaggerated cartoon nasties. Player-character has no face, no name, no monologue.
- **Not a plot game.** Story is **emergent** through collectibles + Pawnbroker barks + briefing flavor. The good-end and bad-end vignettes are the only authored cutscene moments.

## The brand voice

Read aloud, every line in the game should land somewhere on the spectrum between *fatherly Sicilian wisecrack* (the Pawnbroker), *clinical sanitation log* (the artifacts), and *barfly's drunk pontification* (the rumor mill). Anything outside that triangle is the wrong voice. There is no narrator. There is no system speaking to the player.

## Palette

The seven canonical colors. Tokens live in `src/ui/theme/`. CRT-overlay effects (`src/render/effects/crt.ts`) are the **only** source path with permission to reference forbidden neon hex.

| Use | Token | Hex | Where |
|---|---|---|---|
| Background asphalt | `--bg-asphalt` | `#0d0c0a` | All screens, behind everything. |
| Concrete mid | `--bg-concrete` | `#3a3833` | Sidewalk, mortar, mid-grey UI. |
| Sodium-vapor street light | `--accent-sodium` | `#d4943a` | Primary accent. HUD numbers, button outlines, headlines, muzzle flash core. |
| Subway tile cream | `--text-cream` | `#e8dcc4` | Body text. |
| Brick / dried blood | `--accent-brick` | `#7a2818` | Brick wall background, defeat states, secondary CTA. |
| Piss-yellow highlight | `--accent-piss` | `#a89344` | Hover states, mod-equipped highlight. |
| Sickly fluorescent (elites only) | `--elite-green` | `#5c6b2e` | Radioactive variant glow, sewer water surface. |

### Anti-palette (forbidden in source)

The pre-edit gate rejects these hex codes in `.ts/.tsx/.css` etc. Documented here so future authors know what was migrated away from. The CRT-overlay file is the only source-code exemption.

| Hex | Was used in POC for | Replaced by |
|---|---|---|
| `#00f0ff` | Cyber UI accent | `#d4943a` sodium |
| `#ff00ff` | Magenta highlight | `#7a2818` brick |
| `#39ff14` | Toxic green | `#5c6b2e` elite-green |
| `#ff2a2a` | Hit-flash red | `#7a2818` brick |
| `#ffd700` | Gold accent | `#d4943a` sodium |

## Typography

Two faces, intentionally limited.

### `Big Shoulders Display` (variable, weights 100-900)
- **Use for:** Headlines, mission titles, end-screen verdicts, the cabinet logo.
- **Why:** Condensed-stencil-newsprint feel. Reads as 1970s NYC subway signage. Variable weight gives the HUD a hierarchy without changing typeface.
- **Don't use for:** Body, briefing prose, anything below ~16 px (it gets crispy at small sizes).

### `Special Elite` (typewriter, single weight)
- **Use for:** HUD readouts (SCORE, VERMIN, SHELLS, LIVES), mission-select tile labels, mod names, all monospaced numerics, briefing prose.
- **Why:** Reads as departmental memo / police report / pest-control work order. Connects every UI surface to the in-fiction "deniable city office" voice.
- **Don't use for:** Headlines (it's not loud enough), button labels (it's too quiet against sodium amber).

### Forbidden type
- `Bebas Neue` — too clean, too modern, reads as 2016 startup.
- `Share Tech Mono` — POC's leftover; cyberpunk LED-display affect.
- Any sans-serif geometric (Futura/Avenir/Inter/Roboto) — wrong era, wrong voice.

## Type ramp

| Token | Size | Face | Use |
|---|---|---|---|
| `--type-display` | clamp(2rem, 6vw, 4rem) | Big Shoulders Display 700 | Title screen, end-screen verdicts |
| `--type-h1` | clamp(1.5rem, 4vw, 2.4rem) | Big Shoulders Display 600 | Mission-select header, screen titles |
| `--type-h2` | 1.2rem | Big Shoulders Display 500 | Section headers (act labels) |
| `--type-body` | 1rem | Special Elite | Briefing prose, lore |
| `--type-hud` | 0.875rem | Special Elite | HUD numerics, kills/lives |
| `--type-tag` | 0.75rem | Special Elite | Mission-tile blurbs, mod cost |

## Surfaces & textures

- **Brick masonry background.** Offset-row brick pattern with mortar gaps; top-edge highlight (`#9a3820`) and bottom-edge shadow. Replaces the POC's flat black.
- **Sodium streetlight glow.** Concentric 7-ring radial gradient + 5-band horizontal pool below the sidewalk lip. The pool of light the player aims into.
- **Halftone newsprint grain** subtly overlaid on still surfaces (subway tile, brick).
- **Wet asphalt reflection** below splash points (PixiJS displacement, optional, performance-gated).
- **CRT overlay** — opt-in via settings. Scanlines + 4-corner vignette + L/R chroma fringe. The single sanctioned home of POC neon. Off by default — pulpy, not glitchy.
- **Spray-paint splatter** for hit feedback. Per-archetype palette in `src/render/SplashLayer.tsx`.

## Player-journey gate

A cold player must understand the goal **within 15 seconds** of the title screen. The Briefing → Mission Select → Pawn Shop → Playing path must not stall a non-gamer. If a tap-on-START doesn't lead them into a kill within 30 seconds, the design has failed.

## Marketing screenshot brief

The hero screenshot is a **first-mission moment**: brick wall, sodium streetlight pool, three rats mid-scuttle, the player's reticle hovering over the lead one, the muzzle flash from the previous shot still fading on the right. HUD reads `SCORE 000420  VERMIN 4 / 8  SHELLS 3/6`. No CRT overlay. No menu chrome. Title `CONCRETE VERMIN` lockup in `Big Shoulders Display` 700, sodium amber, bottom-left at 64 px from edge. Tagline below in `Special Elite`: *"Pawnbroker's hiring. 142 Mott Street. Cash, no questions."*

## Theme tokens

Tokens live in `src/ui/theme/theme.tokens.ts`. Treat that file as **the** brand source — components import tokens, never literal hex. The pre-edit-gate brand check enforces literal hex avoidance for the forbidden palette in source files; the lint custom rule (planned) will eventually enforce token-only usage for new code.

See [`docs/LORE.md`](LORE.md) for the editorial style guide and [`docs/BESTIARY.md`](BESTIARY.md) for the per-archetype splash palette.
