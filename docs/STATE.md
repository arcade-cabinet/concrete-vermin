---
title: State
updated: 2026-04-28
status: current
domain: context
---

# State — Where the project stands

## v1.0 Launch Snapshot (2026-04-28)

Every checkbox in the v1.0 production directive is complete. The table below is the official v1.0 sign-off record.

- **Branch:** `feat/governor-yuka-adapter` (PR #83, pending merge to main)
- **Tests:** 637+ node / 54+ dom / 5 e2e specs — all green, no `continue-on-error`
- **Pages:** `https://arcade-cabinet.github.io/concrete-vermin/`
- **CI:** core / balance-benchmark (hard gate) / release-gate / browser-canvas / e2e (5 specs) / perf-trace — all required
- **Repo:** `arcade-cabinet/concrete-vermin` (public)

### What shipped in v1.0

- All **12 missions** (9 canonical + 3 secret) across 3 acts — each passes the governor strict gate (grade ≥ B)
- **Yuka-driven governor** (`src/governor/`) — headless AI drives the same `queueShot`/`queueReload` path the player uses; validates every mission automatically in CI
- **Per-weapon charge-shot** — tap = precise shot (existing), hold = charged heavy variant per weapon:
  - Shotgun → wide-spray (extra pellets)
  - Revolver → 5-shot auto-burst
  - Sawed-off → double-barrel both shells at once
  - SMG → full-auto mag-dump with widening cone
  - Tesla → 3-arc rapid chain
  - Flamethrower → napalm pool DoT (lingering, scales with charge)
- **Charge ring UI** — segmented sodium-amber arc fills clockwise around the reticle; pulse at full charge
- **Input wiring** — pointer hold, Space/Enter hold, gamepad R2 hold; 80ms tap threshold preserves existing feel
- **AI dive-at fix** — `STEP_DURATION_S` cap in `ai.ts` was preventing ceiling-drop roaches from completing full descent; fixed enabling all underwater/rooftop missions to be governor-winnable
- **NapalmPool ECS trait + napalmSystem** — proper DoT tick with radius, DPS, TTL scaled to charge depth
- **Balance gate** — `pnpm analysis:benchmark --profile ci` is a hard required CI gate (no `continue-on-error`)
- **Coverage gate** — vitest `--coverage` with ≥85% line threshold across sim/ecs/runtime/audio
- **5 e2e specs** — full-journey, accessibility (axe-core), mobile-viewport, keyboard-only, gamepad
- **Android mobile verify** — `pnpm cap:sync` confirmed, android-launch spec validates mobile-viewport boot

## What's playable

- **Mission flow**: MainMenu → MissionSelect → Briefing → PawnShop → Playing → MissionResult, with cash + unlock persistence via `localStorage`
- **PawnShop** loadout picker — 20-mod registry, weapon-compatible filtering
- **6 weapons** with full SFX, tap-fire AND charge-fire variants
- **HUD**: SCORE, VERMIN N/M, SHELLS, LIVES, modifier-flash chips, charge-ring, mute, pause
- **Pause + Settings** — volume / mute / motion-reduction / high-contrast / CRT / haptics / aim-assist / invertY
- **Accessibility**: WCAG 2.1 AA, focus rings, autofocus, aria-live HUD, aria-label canvas, axe-core clean on every screen
- **Mobile**: drag-to-aim, long-press reload, 44px targets, safe-area insets, DPR cap, orientation lock (Android)
- **3 secret missions** — S-grade unlock gated; verified by governor end-to-end

## What's done by phase

| Phase | Status | Reference |
|---|---|---|
| 0 — Governance | ✅ | bootstrap commit, CLAUDE.md, STANDARDS.md, AGENTS.md |
| 1 — Foundation | ✅ | PR #1 — Capacitor, lockfile, hooks, biome |
| 2 — Sim Core | ✅ | PR #2 — rng, traits, archetypes, factories, GOAP, scoring |
| 3 — ECS Bridge | ✅ | PRs #3–#6 — Koota traits, systems, runner |
| 4 — Render | ✅ | PRs #7–#21 — per-archetype sprites, splash, muzzle flash, CRT overlay, napalm pool |
| 5 — UI Shell | ✅ | PRs #21, #36, #40, #44 — drag/keyboard input, responsive HUD, pause/settings, a11y |
| 6 — Audio | ✅ | PR #19 — Tone.js bus, SFX, ambient drone, charge-whine |
| 7 — Content | ✅ | PRs #24, #26, #28, #44 — 12 missions, JSON lore, briefings/results/pawnbroker/callouts |
| 8 — Balance & Polish | ✅ | PR #46/#48/#50 — analysis stack; balance gate now hard-required; all missions in band |
| 9 — Governor | ✅ | PR #83 — Yuka-driven end-to-end governor; all 12 missions graduate strict gate |
| 10 — Charge-shot | ✅ | PR #83 — all 6 weapons with hold-fire charged variant; napalm pool; reticle ring; input wiring |
| 11 — Coverage | ✅ | PR #83 — ≥85% coverage gate; 5 e2e specs; CI all-required |
| 12 — Mobile | ✅ | PR #83 — cap:sync verified; android-launch e2e; DEPLOYMENT.md |

## Recent decisions (2026-04-28)

- **Governor architecture** — `src/governor/` is the only file that imports `yuka`; sim stays pure. Governor reads from `useGameStore` (same store the player sees), drives `runner.queueShot`/`queueReload` via the public API.
- **AI dive-at cap bug** — `STEP_DURATION_S = 0.6` in `src/ecs/systems/ai.ts` capped ceiling-drop steps, preventing roaches from descending into weapon range. Fixed to `(zone.maxY - zone.minY) / step.speed + 0.5` — resolves sewer-shallows and other underwater missions.
- **Charge tap threshold** — 80ms. Below: existing `queueShot` (no behavior change for fast taps). Above: `queueChargeRelease`. Preserves the feel of the original tap-fire for players who don't use charge.
- **Napalm DoT design** — TTL scales 1–4s with charge depth, radius 24–40 px, DPS 15–40. Flamethrower tap-fire remains viable; napalm is a zone-control tool, not a DPS replacement.
- **Coverage thresholds** — set to actual measured values (lines ≥85%, functions ≥80%, branches ≥75%) so CI gate is honest without being aspirational.
- **Android e2e** — real emulator not available in CI; android-launch spec uses Playwright with mobile user-agent + viewport (375×812) against the web bundle. Documented honestly in DEPLOYMENT.md.

## Blockers

(None — v1.0 is complete.)

## Outstanding for v2+

- **iOS build** — Capacitor iOS target compiles but not validated on device.
- **Online leaderboards** — out of scope for v1.
- **Live perf on 2018-era mobile** — `useCallback` is in place; real-device profiling deferred.
- **Charge-modifying mods** — `chargeTimeMul` field reserved in WeaponMod schema; no actual mods built until designers request.
- **Multi-reticle charge variants** — `double` reticle gets two arcs; further per-shape tuning is v2 polish.
