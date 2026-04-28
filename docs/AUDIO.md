---
title: Audio — Sonic Direction Bible
updated: 2026-04-28
status: current
domain: creative
---

# Audio

The game's audio direction. Source of truth for what each cue should *feel* like, not how it's coded — the implementation lives in `src/audio/{setup,sfx,music}.ts` and uses Tone.js synthesis (no asset pipeline). When a designer says "the shotgun sounds wrong," reach for this doc; when an engineer says "I added a new vermin," cross-reference its death-sound row here.

## Reference triangle

Every cue in the game should land somewhere on the spectrum between three references:

- **Death Wish (1974)** — sodium-light street ambience; distant subway; an overcoat too heavy for the weather; sirens never quite arriving.
- **Reservoir Dogs (1992) opening** — period jukebox cuts heard through a tinny radio in the next room. Music is *in* the world, never floating above it.
- **Adult Swim's 12 Oz Mouse** — wrong-sounding-on-purpose synth blurts. The roach crunch should sound funny.

Anything that doesn't trace to one of those is the wrong texture.

---

## Per-weapon sonic signature

The shotgun is the campaign's home tone. Every other weapon is heard *against* the shotgun — lighter, tighter, wetter, hotter, sharper.

| Weapon | Signature | Implementation notes |
|---|---|---|
| **`shotgun` — Family Shotgun** | **Thumpy thwack-pop.** Brown-noise burst, attack 0.002 s, decay 0.18 s. Cardboard-tube resonance at 60 Hz. Ends in a cling of falling shells. | NoiseSynth with shaped envelope; the cling is a metallic synth ping at –20 dB, post-shot. |
| **`revolver` — Bensonhurst** | **Sharp bark.** A hammer striking iron. Tighter than the shotgun, no smoke trail. ~120 Hz fundamental, click-attack. | MembraneSynth at C2; pitch-bends down 200 cents in 80 ms for the recoil tail. |
| **`smg` — Mac-10** | **Chittering rip.** Five rounds in a quarter-second, all running together; brass casings rain on concrete (the secondary cue). | White-noise burst loop at 16 Hz; brass = pluck synth on metal scale, played randomly during the burst. |
| **`sawed-off` — Sawed-Off Twelve** | **Wet boom.** Two barrels stacked: a dry whump on the left, a damp whump on the right, ~6 ms apart. The wetness sells the close range. | Two NoiseSynth pulses with an LP filter on the second; LP cutoff fixed at 800 Hz. |
| **`flamethrower` — Diesel** | **Sustained roar with intake hiss.** Looping sub-bass rumble with a high-frequency "intake" hiss layered on top. Stops cleanly when fuel runs out. | Filtered pink noise on a long loop; intake = bandpass-filtered white noise at 3 kHz. |
| **`tesla` — Grandfather's Rifle** | **Arc-snap with crackle tail.** Sharp electric *snap* on shot, then a 200 ms crackle tail that decays. Static smell implied by the HUD haze. | MetalSynth E5 short attack; tail = noise through a high-Q peaking EQ, mod-amplitude LFO. |

### Reload SFX

Per-weapon reload is its own small character moment. Same envelope budget (≤ 250 ms) but distinct timbre:

- **shotgun** — pump-action *cha-chunk*, two close clicks.
- **revolver** — cylinder spin (rapid pluck) + chamber click.
- **smg** — magazine drop *clack*, slap-up *click*.
- **sawed-off** — break-action *creak* + two shells dropping into chambers.
- **flamethrower** — pneumatic *hiss-pump*, three seconds. Yes, three. The tax is the point.
- **tesla** — capacitor whine ramp-up over 400 ms.

---

## Per-vermin death sound

Each archetype's death is part of its character. Comic, never gory. Rooted in the *Adult Swim* corner of the reference triangle.

| Archetype | Death cue |
|---|---|
| **`rat`** | Short, sharp **squeal** — pitched-up white-noise with a quick fall-off. ~200 ms. |
| **`roach`** | Wet **crunch**. Like stepping on a chip wrapper. Mid-frequency, no tail. |
| **`pigeon`** | **Flutter-thud** — wing-flap puffs (low pulses) ending in a soft thud. The flap count scales with health. |
| **`raccoon`** | Surprised **chitter-grunt**. Mid-range, slightly rising. |
| **`seagull`** | Indignant **squawk** cut short. Higher-pitched than the pigeon. |
| **`feral-cat`** | A single sharp **yowl-cough**. ~300 ms with breath release. |
| **`sewer-fish`** | **Wet slap** + bubbling tail. Implication of water surface. |
| **`street-dog`** | A clipped **whuf-grunt**. Pack mates yelp in response (one-shot, low probability). |
| **`goose`** | Long aggressive **honk** truncated mid-honk. Reads as embarrassment. |
| **`boss-dumpster-bear`** | Multi-stage **roar → wheeze → collapse**. ~1.5 s. The collapse is the longest beat — let it land. |
| **`boss-river-mutant`** | A **water-rush dissolve** + low gargle. The body never lands; it just stops being there. |
| **`boss-pigeon-king`** | **Court of pigeons goes silent**. The King falls without a sound. The silence *is* the cue. (Implementation: duck music to –20 dB for 1.2 s.) |

### Hit (non-kill) cue

A short pink-noise *tick* with no pitch information, –12 dB to the death cue. Same for every archetype — the player should know "I made contact" without it competing with the kill sounds.

---

## Ambient bed (per act)

The drone-loop bed under everything. Quiet (–24 dB). Always running while a mission is active; ducked when music plays.

| Act | Ambience | Reference |
|---|---|---|
| **Streets (1–4)** | **Distant car horn (every 8–12 s, random-low-prob)**. Sodium-streetlight buzz (LFO-swept lowpass on a sine sub-bass, 0.05 Hz, 160–360 Hz cutoff range). Wet pavement *hiss*. Faint subway under the asphalt. | The opening of *Death Wish*. |
| **Underworld (5–7)** | **Drips (irregular, 4–8 s spacing)**. Long low concrete-rumble. Faint sub-pulse under everything. No traffic. | The chase scene in *The French Connection* (1971), under the el. |
| **Above (8–9)** | **Wind through wires.** Distant pigeons. A rooftop water-tank creak every 12–20 s. No traffic; the city is below you. | The rooftop scene in *Manhattan* (1979), but stripped of its romance. |

---

## Music brief

The game has very little music. That's deliberate. Music is reserved for **scene-set moments** so that when it does play, the player notices.

| Cue | Form | Reference tracks (for direction, not licensing) |
|---|---|---|
| **Title screen** | Slow, looping, sodium-amber pad chord ["A1", "E2", "A2"] under a single tremolo'd pluck note. Reads as "an old story being remembered." | *Twin Peaks* "Falling," instrumental sections. |
| **Mission start sting** | 3-second bell-like phrase: tonic → dominant → up an octave. Dies into ambience; doesn't loop. | The chime that opens *The Warriors* (1979) subway shots. |
| **Boss leitmotif** | A 4-beat, 90 BPM ostinato in low brass. Repeats while the boss is on screen; cuts on boss-down. Different bass note per boss (bear: F1; mutant: D1; king: A1). | Penderecki's *Threnody* — but cut short; never let it bloom. |
| **Win sting** | Falling 5th in piano — one chord, allowed to ring. Then ambience returns. | The credits piano in *Death Wish*. |
| **Loss sting** | Single dissonant whole-tone cluster, immediate decay. Then silence (no ambience) for 800 ms. The silence is the punishment. | The button-press at the end of *Funny Games* (1997) — the *idea* of it, not the mood. |

### What music is NOT

- Not heroic. Never major-key triumph.
- Not chiptune. The era is 1979; chiptune is 1985+.
- Not orchestral. We don't have the budget and even if we did the game wouldn't earn it.
- Not period rock or punk. The 1970s NYC reference points are *implied* through ambience, not foreground.

---

## Ducking & mix policy

A simple priority hierarchy. Higher priority ducks lower by the listed dB amount over the listed attack/release times. Implementation lives in `src/audio/setup.ts` bus structure (master / music / sfx / ui).

| Trigger | Ducks | By | Attack | Release |
|---|---|---|---|---|
| Boss leitmotif starts | Ambient bed | –10 dB | 200 ms | 600 ms |
| Player fires | Ambient bed | –4 dB | 5 ms | 250 ms |
| Vermin death | Music + ambient bed | –6 dB | 2 ms | 300 ms |
| **Boss dies** | **Music** | **–20 dB** | **2 ms** | **1200 ms** | (the silence is the sting) |
| First-launch overlay open | Music + sfx | –12 dB | 200 ms | 500 ms | (let the player read) |
| Pause menu open | Everything except UI sfx | –24 dB | 300 ms | 500 ms | (paused = world quiets) |
| Settings dialog open | Sfx + ambient | –6 dB | 200 ms | 400 ms | (audible adjustments still possible) |

### Hard rules

- **Music never ducks SFX.** Player feedback always wins.
- **UI bus never ducks anything else.** Menu beeps are background; the world is foreground.
- **Pause menu is the only place the world goes fully quiet.** Everywhere else, ambience is always present (even if -30 dB).
- **No fade-outs longer than 1.5 s.** A long fade is a boring fade; if you need more time the cue was the wrong shape.

---

## Master volume defaults

| Bus | Default (dB) | User-adjustable? | Reason |
|---|---|---|---|
| Master | -6 | Yes (settings slider) | Headroom for normalization |
| Music | -10 | No (folded into master) | Music is rare; doesn't need its own knob |
| Sfx | -3 | No | Always loud (player feedback) |
| Ui | -12 | No | Never the foreground |
| Ambient | -24 | No | Bed only |

A player who wants per-bus control gets it through the master + mute toggle. The settings dialog could grow per-bus sliders if playtesters ask; until then we keep it simple.

---

## Implementation status

- ✅ `src/audio/setup.ts` — master + bus structure, lazy init on first user gesture (`ensureAudio()`).
- ✅ `src/audio/sfx.ts` — shotgun + smg + revolver + empty + verminSpawn + verminHit + verminDeath.
- ✅ `src/audio/music.ts` — Streets ambient drone (LFO-swept lowpass + occasional metal ping).
- ⚠ Per-act ambience swap (Underworld + Above) — not yet wired; structure is there.
- ⚠ Per-weapon SFX beyond shotgun/smg/revolver — not yet wired; documented above so a future PR has the brief.
- ⚠ Per-vermin death cues — currently one shared cue; documented above for differentiation.
- ⚠ Boss leitmotifs — not yet wired.
- ⚠ Music stings (mission start, win, loss) — not yet wired.
- ⚠ Ducking rules — bus structure exists; the per-trigger ducks below are the implementation brief.

The "⚠" items are deliberate — this doc is the **brief** for the next audio implementation pass. The skeleton in `src/audio/` should grow to fill the rows here.
