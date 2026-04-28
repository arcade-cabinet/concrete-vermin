---
title: Architecture
updated: 2026-04-27
status: current
domain: technical
---

# Architecture

This document is a pointer. The canonical architecture lives in **Section 2** of the design spec:
[docs/superpowers/specs/2026-04-27-concrete-vermin-design.md § 2](superpowers/specs/2026-04-27-concrete-vermin-design.md#2-architecture--layering).

Read the spec first. Edit the spec when architecture changes; this file links there.

## Quick reference

```
src/
├── sim/         # PURE TypeScript (no React/Pixi/DOM/Tone/Capacitor)
├── ecs/         # Koota — runtime entity state
├── render/      # PixiJS — reads Koota, never writes
├── ui/          # React + pixi-react bridge
├── audio/       # Tone.js
├── platform/    # Capacitor wrappers
└── lib/         # pure utils
```

## Frame loop

- Pixi `app.ticker` → render loop (free-running)
- Fixed-step sim ticker at 60 Hz logical → `sim/engine/tick`
- Render interpolates between sim states (Glenn Fiedler "Fix Your Timestep")

## Data flow (one frame)

```
[input: PointerEvent]
  → ui/hud (computes reticle world-pos)
  → ecs/actions.fireWeapon(reticleWorldPos)
  → ecs/systems/projectile spawns Projectile entities
  → sim/engine/damage resolves hits next tick
  → ecs/actions.killVermin → emits "kill" event
  → audio/weapons + render/effects/splash react
  → sim/engine/scoring updates multiplier
  → ui/hud re-renders (subscribes to score query)
```
