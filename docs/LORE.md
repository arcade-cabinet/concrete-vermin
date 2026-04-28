---
title: Lore — Editorial Style Guide
updated: 2026-04-28
status: current
domain: creative
---

# Lore — Editorial Style Guide

The lore data lives in [`src/sim/content/lore/`](../src/sim/content/lore/) as decomposed JSON, validated by Zod at module load. UI copy modules (`src/ui/copy/{briefings,results,pawnbroker}.ts`) consume those JSON files directly — no string duplication.

This document is the **editorial style guide**: voice, do/don't, frame narrative. Read it before adding or revising lore, then edit the JSON.

## Where the lore lives

| File | What it holds |
|---|---|
| `setting.json` | Era, city, premise, tone/anti-tone, three act intros |
| `characters.json` | Pawnbroker bio + voice, player frame |
| `endings.json` | Good-end vignette, bad-end vignette, per-grade victory lines, per-cause defeat lines |
| `talismans.json` | Six talisman backstories keyed to MOD_REGISTRY ids |
| `barks.json` | 20+ Pawnbroker barks (rotating during shop visits) + 10 rumor-mill entries (rotating on briefing screens) |
| `frame.json` | The 2026 cabinet frame narrative + cabinet plaque + easter-egg list |
| `missions/<mission-id>.json` | One per mission: blurb (1 sentence, mission-select tile) + briefing (3-4 sentences, pre-mission screen) + epigraph (in-fiction quote) |

## Voice rules

- **Second person, present tense.** "You walk back across the Brooklyn Bridge at first light." Not "the player walks." Not past-tense.
- **Specific over general.** "DiSalvo Plumbing & Iron, est. 1938" beats "an old plumbing company." Real-feeling NYC place names: Mott, Mulberry, Bleecker, Canal, Williamsburg, Woolworth Building, Coney Island.
- **Short sentences for menace; long sentences for setting.** A boss line is six words. A scene-set is three clauses.
- **The Pawnbroker calls you `kid`.** Always. Never your name (you don't have one).
- **Catholic, not arcane.** St. Anthony, the rosary, Old St. Patrick's. Not pentagrams, not eldritch glyphs.
- **Pulpy violence, never gore.** "Six rounds in it and one more in its head when you're sure it's dead" lands; "viscera spilled across the alley" doesn't.
- **No exposition dumps.** The frame narrative is implied via easter eggs, never narrated.

## Anti-voice (don't write)

- ❌ "The cyber-punk neon glow of the rat's eyes…"
- ❌ "In a dystopian alternate 1979 where…"
- ❌ "Our hero, brave Detective Smith, draws his weapon…"
- ❌ "*INCOMING TRANSMISSION*…"
- ❌ Any sentence with the word "epic" or "legendary"
- ❌ Any sentence that explains the magic system
- ❌ Capital-letter dramatic SCREAMING

## Frame narrative

The cabinet is ostensibly a 1981 arcade machine. In-fiction, it was commissioned by the Pawnbroker's estate after his death (date deliberately vague — somewhere between 1989 and 2003) and rolled out of a Coney Island warehouse in 2026. There is a brass plaque on the side; the player can find it. The frame: an old-timer at the arcade drops a quarter and says "let me tell you about a kid I knew." Everything you play is the story he's telling. The high-score table is presented as having been signed by other kids he has told this story to. You're added when you finish.

This frame is **never narrated directly**. Hooks are: the attract loop occasionally flashes a Coney Island warehouse for one frame; the credits cite the Pawnbroker's estate; one of the Pawnbroker's barks ("you remind me of someone") is the tell.

## How to add or revise

1. Edit the JSON file under `src/sim/content/lore/`.
2. Run `pnpm test:node -- lore` — Zod schema rejects malformed entries; mission lore must match a mission id in the registry.
3. Run `pnpm lore:print > /tmp/lore.md` to read the assembled prose form for editorial review.
4. Open a PR. The CI lore test enforces that every mission in `MISSIONS` has a matching lore JSON file.

## What's intentionally unanswered

The player should never be told:
- Why is this happening?
- What was your grandfather's first name?
- What's actually in the East River?
- Is the Pigeon-King a metaphor or a literal entity? (Both.)
- What's in the basement of the shop, under the dirt floor?

These are seeds for the player's imagination. The game ends when the player completes mission 9. There is no epilogue past the good-end / bad-end vignette.

## What's known about the bestiary

Lives in [`docs/BESTIARY.md`](BESTIARY.md). Each archetype has a "what people say about them" entry that goes in the Bestiary screen.
