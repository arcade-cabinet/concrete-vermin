# Continuous Work Directive — Concrete Vermin

**Status:** ACTIVE
**Owner:** Claude (this agent)
**Mandate (verbatim 2026-04-28):** "you should hsve zero deferrals stubs placeholders unwired unimplemented pieces code not covered in unit and visusl integrst8on and e2e testing no area oc the player journey not fully polisjed and balanace, all ui/ux/hud fully gonethrohfh with 21dev inspiratopn smd na eye to makomg this the mosr fun possosble. EVERYTHING"

Decoded: ZERO deferrals. ZERO stubs. ZERO placeholders. ZERO unwired pieces. ZERO unimplemented features. EVERY code path covered by unit + visual-integration + e2e tests. EVERY beat of the player journey polished AND balanced. EVERY UI/UX/HUD surface redone with 21st.dev inspiration aimed at MAX FUN.

## What CONTINUOUS means

1. Never stop for status reports the user didn't ask for.
2. Never stop for scope caution. The mandate IS the scope.
3. Never stop to summarize — git log is the summary.
4. Never stop for context pressure — task-batch + PreCompact hook handle it.
5. Never stop because a task feels big — pick the next atomic commit and ship.
6. Only stop when: user explicitly says stop, CI is red AND blocking, or genuine STOP_FAIL.

## Operating loop

```
while queue has [ ] items:
  1. Check state: gh pr checks; pnpm typecheck; pnpm test; pnpm lint; pnpm build — any red → fix that first
  2. Pick the top [ ] item below
  3. Implement on a branch
  4. Verify: typecheck + tests (unit/dom/browser/e2e where applicable) + lint + build all green
  5. git add -A && git commit (Conventional Commit) && git push
  6. PR via gh, address ALL review threads (evaluate, fix or document discard reason)
  7. Mark item [x] when committed; auto-merge when CI green
  8. Loop
```

## Forbidden phrases for this queue

- "deferred", "for v2+", "out of scope", "future work", "tracked separately", "follow-up"
- "TODO", "FIXME", "stub", "placeholder", "mock for now"
- "needs an actual device" (use emulator + Capacitor)
- "continue-on-error" in CI (every gate must be required)

## Queue — v1.0 production polish

Each `[ ]` is one commit. Group small ones into one PR; large surfaces get their own.

### v1.0-CALIBRATE — every mission lands inside its band, benchmark gate becomes hard-required

- [x] src/sim/analysis/benchmarks.ts: rewrite simulateEncounter to model partial damage — accumulate hits per target across multiple shots, only count contact damage when player engagement-time elapses with target alive (not per-miss tick)
- [x] src/sim/analysis/benchmarks.ts: per-archetype dodge factor honoring archetype.baseStats.health as health pool not binary kill
- [x] src/sim/analysis/benchmarks.ts: weapon recoil + reload windows reduce shots-per-second realistically
- [x] src/sim/analysis/benchmarks.ts: mod effects applied (incendiary DoT, scope crit chance, choke spread)
- [x] Run pnpm analysis:smoke; tune raw mission/archetype/weapon data via analysis:autobalance until streets-04, underworld-05, underworld-07, above-08 land in band
- [x] Re-run RELEASE_GATING=1 — every mission STABLE
- [x] .github/workflows/ci.yml: remove `continue-on-error: true` from balance-benchmark; flip to required gate
- [x] tests: src/sim/analysis/__tests__/benchmarks.test.ts — unit assertions on simulateEncounter for each weapon × each archetype combination

### v1.0-RUNTIME — fill every runner gap

- [x] src/runtime/runner.ts: real reload-window state — reloadStartedAt, reloadDurationS, blocks fire input until elapsed
- [x] src/runtime/store.ts: publish reloadProgress: number | null (0..1) and reloadDurationMs for HUD bar
- [x] src/sim/factories/mission.ts: per-mission livesAllowance field (default 3, bosses 5, tutorial 5)
- [x] src/sim/factories/mission.ts: per-mission cashAward override (boss missions pay double)
- [x] src/runtime/runner.ts: respect mission.livesAllowance (no more hardcoded 3)
- [x] src/runtime/runner.ts: emit pendingReload AND reload-complete events for audio bridge
- [x] src/runtime/runner.ts: pause/resume hooks accessible from React (already partial; complete + test)
- [x] tests: src/runtime/__tests__/runner.reload.test.ts — reload window blocks fire, completes correctly
- [x] tests: src/runtime/__tests__/runner.lives.test.ts — livesAllowance respected per mission

### v1.0-AUDIO-WIRE — every weapon, every vermin, every transition has its sound

- [x] src/audio/sfx.ts: per-weapon fire synth (revolver bark, smg chitter, sawed-off wet boom, flamethrower roar loop, tesla arc-snap) — match docs/AUDIO.md brief
- [x] src/audio/sfx.ts: per-weapon reload cue (shotgun pump, revolver cylinder, smg mag, sawed-off break, flame purge, tesla cap charge)
- [x] src/audio/sfx.ts: per-archetype death cue (rat squeal, roach crunch, pigeon flutter-thud, sewer-fish wet flop, dumpster-bear groan, river-mutant gurgle, goose honk-snap, seagull cry, pigeon-king bell-toll)
- [x] src/audio/sfx.ts: per-archetype hit cue (lighter than death)
- [x] src/audio/music.ts: per-act ambient bed switcher — Streets (horn + steam + traffic), Underworld (drips + low rumble), Above (wind + bird-ambience)
- [x] src/audio/music.ts: stings — mission-start chime, win sting, loss sting, S-grade fanfare
- [x] src/audio/music.ts: boss leitmotif (4-beat 90 BPM ostinato) — fires when boss spawned
- [x] src/audio/setup.ts: ducking matrix — boss leitmotif ducks ambient -10dB; player fire ducks music -4dB; boss death drops music to -20dB silence-as-sting for 1.2s
- [x] src/audio/setup.ts: per-bus volumes (sfx/music/ui) wired to Settings store
- [x] src/runtime/runner.ts: emit AudioEvent for every fire/reload/hit/kill/spawn/missionStart/missionEnd/bossSpawn/bossDeath
- [x] tests: src/audio/__tests__/sfx.test.ts — every emit type produces a Tone node (mocked AudioContext)
- [x] tests: src/audio/__tests__/ducking.test.ts — ducking matrix engages correctly

### v1.0-RENDER-POLISH — every visual beat hits

- [x] src/render/Stage.tsx: per-act streetlight color via actLightFor(mission.act) — Streets sodium amber, Underworld sickly green, Above pale dawn
- [x] src/render/Stage.tsx: per-act background tint matching DESIGN.md color shift
- [x] src/render/SplashLayer.tsx: second-frame fade so splash isn't a single-frame pop
- [x] src/render/VerminLayer.tsx: per-archetype idle animation — rat tail wiggle, roach antenna twitch, pigeon wing-beat, sewer-fish gill flutter, goose head-bob
- [x] src/render/VerminLayer.tsx: walk-cycle bob (1px vertical sin wave) on locomoting vermin
- [x] src/render/Stage.tsx: halftone grain overlay (subtle, 4% opacity) for EC-Comics texture
- [x] src/runtime/screenShake.ts: per-event shake amplitude (kill 4px, boss-hit 8px, boss-death 16px), respects reduced-motion
- [x] src/render/HudOverlay.tsx: floating damage numbers on hit (+score amount, sodium-amber, 400ms ttl, rises 24px)
- [x] src/render/effects/parallax.ts: 3-layer parallax (far brick, mid streetlight, near vermin) tied to subtle camera drift
- [x] tests: src/runtime/__tests__/screenShake.test.ts + src/render/__tests__/actLighting.test.ts — amplitude scaling, decay, dedupe, reduced-motion zeroes it; per-act palette lookup
- [x] visual: pnpm screenshots — diff committed alongside

### v1.0-INPUT-POLISH — feels good on every device

- [x] src/ui/GameStage.tsx: aim assist (5px snap to nearest vermin in radius), settings-toggleable, default ON for touch
- [x] src/ui/GameStage.tsx: tap-to-fire on pointerDown for touch (no drag required for trivial taps)
- [x] src/input/gamepad.ts: Gamepad API support — left stick = aim, right trigger = fire, left bumper = reload, options = pause
- [x] src/runtime/store.ts: settings.aimAssist boolean (default: detect touch device → true)
- [x] src/runtime/store.ts: settings.invertY for gamepad
- [x] tests: src/input/__tests__/gamepad.test.ts — virtual gamepad event → store action mapping
- [x] tests: src/input/__tests__/aimAssist.test.ts — snap behavior, off respects setting

### v1.0-A11Y-FINISH — WCAG 2.1 AA across every screen

- [ ] src/ui/MissionSelect.tsx: arrow-key navigation between mission tiles, Enter selects, focus visible
- [ ] src/ui/PawnShop.tsx: arrow-key navigation between mod tiles, Space toggles
- [ ] src/ui/Briefing.tsx, MissionResult.tsx, PauseMenu.tsx, Settings.tsx: tab-order audit + roving tabindex where applicable
- [ ] src/ui/Settings.tsx: aria-describedby on every Radix Switch with helper text
- [ ] src/ui/HUD.tsx: aria-live="polite" already present — extend to streak chips
- [ ] WCAG contrast audit via Lighthouse — bump any failing token in src/theme/colors.ts
- [ ] src/ui/copy/sr-only.ts: screen-reader narrations for mission start, boss spawn, mission complete
- [ ] tests: src/ui/__tests__/a11y.dom.test.ts — every screen passes axe-core checks

### v1.0-UX-21ST — UI redone with 21st.dev component inspiration

- [ ] Magic MCP browse: arcade/retro/terminal/HUD components for inspiration
- [ ] src/ui/MainMenu.tsx: NEW — title screen with animated "Concrete Vermin: Tactical Reforged" logo, Press Start CTA, settings entry, credits entry
- [ ] src/ui/Briefing.tsx: redesign with newspaper-clipping aesthetic — headline + body + threat assessment chips + Begin button
- [ ] src/ui/MissionSelect.tsx: redesign as a 1979 NYC subway-map metaphor — acts are lines, missions are stops; current stop pulses
- [ ] src/ui/PawnShop.tsx: redesign as actual pawnshop UI — wood counter, mod cards as price-tagged items, Pawnbroker portrait + bark text
- [ ] src/ui/MissionResult.tsx: redesign as a tabloid front-page — grade as headline, stats as columns, callouts as bylines
- [ ] src/ui/HUD.tsx: redesign — corner brackets like a CRT viewfinder; SCORE/AMMO/LIVES with neon-tube-amber underglow (sodium amber, NOT cyberpunk neon — within brand)
- [ ] src/ui/PauseMenu.tsx: redesign as a Polaroid stack — paused frame on top, options as torn-edge cards
- [ ] src/ui/Settings.tsx: redesign — categorized accordion (Audio/Visual/Input/Accessibility), live preview chips
- [ ] src/ui/Credits.tsx: NEW — scrolling credits with role attribution, lore Easter eggs
- [ ] src/ui/Toast.tsx: NEW — Radix Toast wired for non-blocking notifications (cash earned, weapon unlocked, achievement)
- [ ] src/ui/transitions/: page transitions via Framer Motion — newspaper-fold between menus, cinematic letterbox into missions
- [ ] tests: src/ui/__tests__/screens.dom.test.ts — every new screen renders + interactive

### v1.0-CONTENT-DEPTH — make missions LIVE

- [ ] src/sim/content/missions/*: each mission gets 3-5 dynamic event triggers (mid-mission boss-bark, environmental hazard, surprise wave) — already partially scripted; complete every mission to spec
- [ ] src/sim/content/encounters/: per-act unique encounter compositions (no two missions feel identical)
- [ ] src/sim/content/missions/secret/: NEW — 3 hidden missions unlocked by S-grade conditions (bonus content for replay)
- [ ] src/sim/content/lore/*.json: per-mission post-mission Pawnbroker debrief blurb (different per win/loss/S-grade)
- [ ] src/ui/copy/encounter-callouts.ts: 30+ dynamic callouts (was 10) — chained kills, headshot streaks, no-damage runs, boss-phase transitions
- [ ] src/sim/content/achievements.ts: NEW — 20+ achievements with unlock conditions, persisted via player progress store
- [ ] src/ui/AchievementsScreen.tsx: NEW — gallery view of locked/unlocked
- [ ] tests: src/sim/__tests__/achievements.test.ts — each achievement triggers under expected conditions

### v1.0-PERF — every frame under budget, every byte justified

- [ ] scripts/perf-trace.ts: scripted Chrome DevTools trace via Playwright; outputs JSON
- [ ] scripts/perf-trace.ts: assert median frame time < 16ms across 60s mission run
- [ ] vite.config.ts: bundle size budget — fail build if any chunk > 1.5MB gzipped
- [ ] src/main.tsx: lazy-load PauseMenu / SettingsDialog / FirstLaunchOverlay / Credits / AchievementsScreen
- [ ] src/render/: object-pool every transient sprite (muzzle flash, splash, damage number)
- [ ] tests: scripts/__tests__/perf.test.ts — bundle-size + frame-time gates run in CI

### v1.0-MOBILE-VERIFY — Android emulator end-to-end

- [ ] pnpm cap:sync && launch Android emulator from CI/local — confirm boots into MainMenu
- [ ] android/app/src/main/res/: app icon set (mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi)
- [ ] android/app/src/main/res/values/styles.xml: splash screen branded (subway-tile background + logo)
- [ ] android/app/src/main/AndroidManifest.xml: orientation lock — landscape phone, free tablet
- [ ] src/platform/lifecycle.ts: background → foreground correctly pauses runner; verified
- [ ] tests: e2e/android-launch.spec.ts — Capacitor launch smoke (emulator-driven where CI supports)
- [ ] docs/DEPLOYMENT.md: Android QA checklist updated to reflect actual emulator runs

### v1.0-COVERAGE — every line tested at the right altitude

- [ ] vitest --coverage: assert >85% line coverage across src/sim/, src/ecs/, src/runtime/, src/audio/
- [ ] e2e/full-journey.spec.ts: MainMenu → MissionSelect → Briefing → PawnShop → Mission → Result → next mission, verifies HUD/audio/transitions
- [ ] e2e/accessibility.spec.ts: every screen passes axe-core via Playwright + @axe-core/playwright
- [ ] e2e/mobile-viewport.spec.ts: golden path on phone-portrait viewport
- [ ] e2e/keyboard-only.spec.ts: complete tutorial mission with keyboard alone
- [ ] e2e/gamepad.spec.ts: complete tutorial mission with virtual gamepad
- [ ] vitest.browser.config.ts: real-Chromium tests for every render/effects/* module
- [ ] CI: every test suite (node, dom, browser, e2e, e2e-mobile, perf) is required gate (no continue-on-error)

### v1.0-RELEASE — ship 1.0.0

- [ ] One feat! commit at the end forces release-please major bump → v1.0.0
- [ ] docs/STATE.md: v1.0 launch snapshot — every checkbox in this directive complete
- [ ] CHANGELOG.md: hand-written v1.0 narrative section above release-please autogen
- [ ] README.md: status badge + 30-second gameplay GIF + "Play in browser" button → Pages
- [ ] docs/screenshots/: full marketing set (5 store-quality shots) per docs/DESIGN.md brief
- [ ] release-please PR for v1.0.0 — verify android job attaches signed AAB
- [ ] Cross-reference every checkbox here against design-spec acceptance criteria — file final report in docs/STATE.md

## Out of scope (genuinely — not deferrals)

- iOS Capacitor target (web + android only for v1; iOS is v2 platform expansion, not polish gap)
- Online leaderboards (architectural addition, not polish)
- Microtransactions (against design)
- Level editor / UGC (against design)
