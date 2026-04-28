---
title: Architecture
updated: 2026-04-28
status: current
domain: technical
---

# Architecture

The actual layout of the codebase as it stands. The canonical design spec is **Section 2** of [docs/superpowers/specs/2026-04-27-concrete-vermin-design.md](superpowers/specs/2026-04-27-concrete-vermin-design.md#2-architecture--layering); when the design and this doc disagree, fix the design first, then this file.

## Top-level layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                           src/main.tsx                              │
│                              (entry)                                │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                              src/ui/                                │
│  React shell — Briefing, MissionSelect, PawnShop, GameStage, HUD,   │
│  PauseMenu, SettingsDialog, FirstLaunchOverlay, GlobalStyles.       │
│  Subscribes to runtime/store; talks to runtime/runner via refs.     │
│  Imports: react, @pixi/react, @radix-ui/*, theme, audio, platform,  │
│           sim/content (for missions/lore), runtime, ui/hooks.       │
└──┬───────────┬───────────┬──────────────┬──────────────┬────────────┘
   │           │           │              │              │
   ▼           ▼           ▼              ▼              ▼
┌──────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐
│theme/│  │ render/ │  │ audio/  │  │ platform/│  │ runtime/ │
│COLOR │  │ Pixi    │  │ Tone.js │  │ Capacitor│  │ store +  │
│TYPE  │  │ Stage,  │  │ setup,  │  │ haptics  │  │ runner   │
│MOTION│  │ vermin, │  │ sfx,    │  │ (web=    │  │ (zustand │
│SPACE │  │ splash, │  │ music   │  │  no-op)  │  │ + Pixi   │
│      │  │ CRT,    │  │         │  │          │  │ ticker)  │
│      │  │ reticle │  │         │  │          │  │          │
└───┬──┘  └───┬─────┘  └────┬────┘  └────┬─────┘  └────┬─────┘
    │         │             │            │             │
    │         │             └────────┬───┘             │
    │         │                      │                 │
    │         └──────────────────────┼─────────────────┘
    │                                │
    ▼                                ▼
┌───────────────────────────────────────────────────────────────────┐
│                            src/ecs/                               │
│  Koota traits + systems + actions. Lifts sim primitives into      │
│  runtime entity state. Reads from sim, writes Koota world.        │
└───────────────────────────────────┬───────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────┐
│                            src/sim/                               │
│  Pure TypeScript. Zero React/Pixi/Tone/Capacitor.                 │
│  rng + traits + archetypes (vermin, weapons, mods) + factories    │
│  (actor, encounter, mission, patterns) + ai/goap +                │
│  content (missions, lore, variants) + analysis (benchmarks).      │
└───────────────────────────────────────────────────────────────────┘
```

## Layer rules (enforced by `.claude/hooks/pre-edit-gate.mjs`)

1. **`src/sim/` is pure.** No imports of `react`, `@pixi/*`, `pixi.js`, `pixi-react`, `tone`, `@capacitor/*`, `@radix-ui/*`, `framer-motion`, `matter-js`. No `Math.random()` — use `createRng(seed)`.
2. **No raw `world.spawn(Vermin, ...)` outside `src/sim/factories/` or `src/ecs/`.** The factory pyramid (`composeVermin → composeEncounter → composeMission`) is the only spawn path.
3. **`src/ui/` cannot import from `src/render/`** except through the `pixi-react` `<Application>` bridge (which `GameStage.tsx` is the sole consumer of).
4. **`src/render/` cannot import from `src/ui/`.** Render reads Koota and draws; it never knows about React state.
5. **Brand neon hex is forbidden** outside `src/render/effects/crt.ts` (the single CRT-overlay exemption).

## src/ tree (real)

```
src/
├── main.tsx                  # React 18 root → <App/>
├── audio/                    # Tone.js
│   ├── setup.ts              # bus structure (master/music/sfx/ui), ensureAudio()
│   ├── sfx.ts                # synth-built fire/reload/empty/spawn/hit/death cues
│   └── music.ts              # ambient streets drone (LFO-swept lowpass + occasional pings)
├── ecs/                      # Koota
│   ├── traits.ts             # Position/Velocity/Health/Hitbox/Lifecycle/Vermin/Splash/Score/AIPlan
│   ├── world.ts              # createGameWorld(seed)
│   ├── actions.ts            # fireWeapon(), spawnSplash()
│   └── systems/              # ai, collide, motion, projectile, lifecycle, score, spawn, cull
├── platform/                 # Capacitor wrappers
│   └── haptics.ts            # hitHaptic / killHaptic / bossDamageHaptic — no-op on web
├── render/                   # PixiJS — reads Koota
│   ├── extend.ts             # registers pixiGraphics intrinsic
│   ├── Stage.tsx             # brick wall + sodium streetlight pool
│   ├── VerminLayer.tsx       # 12 per-archetype draw functions
│   ├── ProjectileLayer.tsx
│   ├── SplashLayer.tsx       # per-archetype palettes
│   ├── MuzzleFlashLayer.tsx
│   ├── ReticleLayer.tsx      # DPR-aware stroke
│   ├── CRTOverlay.tsx
│   └── effects/crt.ts        # the only POC-neon-allowed file
├── runtime/                  # game-state coordinator
│   ├── store.ts              # zustand: phase, viewport, settings, snapshot, mission state
│   └── runner.ts             # GameRunner class (Koota world + sim clock); Pixi ticker → step()
├── sim/                      # pure
│   ├── rng/                  # createRng(seed), .fork(label) — order-independent
│   ├── archetypes/
│   │   ├── vermin/           # 12 archetypes + traits taxonomy
│   │   ├── weapons/          # 6 weapons + spec schema
│   │   └── mods/             # 20 mods, applyLoadout
│   ├── factories/            # actor.composeVermin, encounter.composeEncounter, mission.defineMission, patterns
│   ├── ai/goap/              # planner, action, goal, world-state
│   ├── content/
│   │   ├── variants.ts       # 30 variants (3 per archetype, 1 per boss)
│   │   ├── missions/         # streets/01..04, underworld/05..07, above/08..09 + index.ts
│   │   └── lore/             # JSON tree + Zod loader
│   └── analysis/             # offline benchmark stack
│       ├── governors.ts      # perfect / median / trash
│       ├── thresholds.ts     # per-mission acceptance bands
│       ├── scoring.ts        # gradeFor + medianGrade
│       ├── effects.ts        # closed-form weapon + variant estimators
│       ├── benchmarks.ts     # runOnce / runSeededBenchmark / runAllMissions
│       ├── sweeps.ts         # parameter sweeps
│       ├── locking.ts        # STABLE/UNSTABLE/UNMEASURED
│       └── autobalance.ts    # clamped Proposal[]
├── theme/                    # neutral — both ui/ AND render/ depend on it
│   ├── colors.ts             # COLOR + actLightFor + pixi(hex)
│   ├── typography.ts         # TYPE + fontFamilyFor
│   ├── spacing.ts            # SPACING + RADIUS
│   ├── motion.ts             # MOTION
│   └── tokens.ts             # aggregator re-export
└── ui/                       # React shell
    ├── App.tsx
    ├── Briefing.tsx
    ├── MissionSelect.tsx
    ├── PawnShop.tsx
    ├── GameStage.tsx         # <Application/> mount; pointer + keyboard input
    ├── HUD.tsx               # SCORE/VERMIN/SHELLS/LIVES, modifier flashes, mute
    ├── MissionResult.tsx
    ├── PauseMenu.tsx         # Esc-triggered Radix Dialog
    ├── SettingsDialog.tsx    # nested Radix Dialog
    ├── FirstLaunchOverlay.tsx
    ├── LoadingSplash.tsx
    ├── GlobalStyles.tsx      # focus rings + high-contrast class on <html>
    ├── PlayerProgress.ts     # zustand: cash, unlocked, mods, completed, firstLaunchSeen
    ├── PlayerProgressPersistence.ts  # localStorage round-trip
    ├── copy/                 # thin adapters over sim/content/lore
    │   ├── briefings.ts
    │   ├── results.ts
    │   ├── pawnbroker.ts
    │   ├── loading.ts
    │   ├── death.ts
    │   └── encounter-callouts.ts
    └── hooks/
        ├── useViewport.ts    # useMediaMatch / useIsNarrow / usePrefersReducedMotion / useDevicePixelRatio
        ├── useTickedNumber.ts # rAF integer animator (HUD score)
        └── useScreenShake.ts  # killCount-driven shake; reduced-motion aware
```

## Data flow (one frame)

```
[input: PointerEvent on GameStage div]
   │
   ▼
ui/GameStage.onPointerUp → runner.queueShot(x, y)
   │
   ▼  (next Pixi ticker tick)
runtime/runner.step(realDt) → tick(fixedDt = 1/60)
   ├─→ ecs/systems/spawn   (drains pendingSpawns whose delay elapsed)
   ├─→ ecs/systems/ai      (replans GOAP, drives velocity)
   ├─→ ecs/actions.fireWeapon (if pendingShot) → spawns Projectile entities
   ├─→ ecs/systems/motion + projectile  (integrate)
   ├─→ ecs/systems/collide → CollideEvent[] (hit/kill, archetypeId)
   │      ├─→ audio/sfx.playVerminHit/Death
   │      └─→ platform/haptics.{hit,kill,bossDamage}Haptic
   ├─→ ecs/systems/score → ModifierFlash[] (HEADSHOT/2-FOR-1/MID-AIR/VARIETY/NO-RELOAD)
   ├─→ ecs/systems/cull + lifecycle  (GC offscreen + dead)
   └─→ runner.publishSnapshot() → zustand store.setSnapshot
        │
        ▼
ui/HUD subscribes via useGameStore selectors → re-renders score/ammo/lives
ui/hooks/useScreenShake watches killCount → 4 px shake on stage container
render/* layers subscribe via useGameStore selectors → re-draw on next ticker
```

## Module size rule of thumb

Per [`STANDARDS.md`](../STANDARDS.md), file length is contextual. A 400-line single-responsibility renderer or content table is fine; a 200-line file that tangles three subsystems is not. Hooks warn at 600 lines, never block. The biggest file in the repo today is `src/render/VerminLayer.tsx` at ~600 lines (12 per-archetype draw functions) — single responsibility, holds in one read.
