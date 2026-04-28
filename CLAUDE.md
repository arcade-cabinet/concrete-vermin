---
title: Concrete Vermin — Agent Entry Point
updated: 2026-04-27
status: current
domain: context
---

# Concrete Vermin — Agent Instructions

## What this is

**Concrete Vermin: Tactical Reforged** — production rebuild of `poc.html`. Side-on rail-shooter, drag-to-aim, pulpy 1979 NYC, urban duck-hunt of rats/roaches/pigeons/etc.

**Mandatory stack**: PixiJS + pixi-react + Koota + Yuka (GOAP port) + Tone.js + Capacitor + Radix + Framer Motion.

The canonical design is at [docs/superpowers/specs/2026-04-27-concrete-vermin-design.md](./docs/superpowers/specs/2026-04-27-concrete-vermin-design.md).
The governing PRD is at [docs/plans/concrete-vermin.prq.md](./docs/plans/concrete-vermin.prq.md).

## Critical rules (CI-enforced)

1. **Sim-purity.** `src/sim/**` is pure TypeScript. No `react`, no `pixi.js`, no `pixi-react`, no `dom` lib, no `tone`, no `@capacitor/*`. Compiles under `tsconfig.sim.json` with no DOM types. **A direct `Math.random()` call anywhere in `src/sim/**` is a CI blocker.** Use `createRng(seed)` from `@/sim/rng`.
2. **Factory pyramid.** Every spawnable vermin comes from `src/sim/factories/actor.composeVermin()`. Every encounter from `src/sim/factories/encounter`. Every mission from `src/sim/factories/mission`. **No raw `world.spawn(Vermin, ...)` calls outside these factories.**
3. **GOAP everywhere.** Vermin AI uses the port at `src/sim/ai/goap`. No ad-hoc state machines for vermin behavior.
4. **Koota owns runtime entity state.** Traits live in `src/ecs/traits.ts`. The sim produces plain data; the ECS lifts it into traits; the renderer and audio read traits through queries; the UI writes via `src/ecs/actions.ts`. **No layer bypasses the others.**
5. **PixiJS is the renderer.** Never re-introduce raw `ctx.*` Canvas2D drawing outside of `src/render/*`. The React layer never touches Pixi sprites except through the `pixi-react` bridge.
6. **Brand gate.** No neon. No cyberpunk. Palette is **sodium amber + brick + asphalt + subway tile** (see `src/ui/theme/`). Forbidden hex codes (`#00f0ff`, `#ff00ff`, `#39ff14`, `#ff2a2a`, etc. — the POC neon) are blocked by pre-edit hook outside CRT-overlay code.
7. **Pulpy, not grimdark.** Splash colors stay bright. Tone is Adult-Swim, comic-violent, Saturday-morning. No genuinely-realistic gore.
8. **Player-journey gate.** A cold player must understand the goal within **15 seconds** of landing. Tutorial mission must be passable on first try by a non-gamer.
9. **Balance gate.** `pnpm analysis:benchmark --profile ci` must pass before merge. Mission drift outside thresholds blocks the PR.
10. **pnpm only.** Do not create `package-lock.json` or `yarn.lock`.
11. **Biome, not ESLint or Prettier.**
12. **Conventional Commits**: `feat:` / `fix:` / `chore:` / `docs:` / `refactor:` / `perf:` / `test:` / `ci:` / `build:`. Squash-merge PRs.

## Commands

```bash
pnpm install                       # bootstrap
pnpm dev                           # vite dev server
pnpm build                         # tsc -b && vite build
pnpm typecheck                     # tsc -b --pretty false
pnpm lint                          # biome lint .
pnpm format                        # biome format --write .
pnpm test                          # node + dom (fast)
pnpm test:node                     # sim/lib/render unit tests
pnpm test:dom                      # jsdom UI tests
pnpm test:browser                  # real Chromium for canvas
pnpm test:e2e                      # playwright
pnpm analysis:smoke                # 5 runs/mission median governor
pnpm analysis:benchmark            # ci profile (PR gate)
pnpm analysis:sweep --shape ...    # parameter matrix
pnpm analysis:autobalance          # propose+commit tuning edits
pnpm analysis:lock:quick           # quick lock pass
pnpm cap:sync                      # build + capacitor sync
pnpm cap:run:android               # launch Android device/emulator
```

## Subagent-driven development

The PRD is decomposed for `/task-batch`. Each task in the PRD has explicit acceptance criteria. **Implementation proceeds autonomously** — no design questions back to the user; conflicts resolve in favor of the spec.

If you encounter a genuine spec ambiguity:
1. **Make a defensible decision** consistent with the design's spirit.
2. **Document the decision** in `docs/STATE.md` under "Decisions made during implementation".
3. **Continue.** Do not block on user input.

## Read-this-first map

| If you're working on… | Start here |
|---|---|
| Anything | [docs/superpowers/specs/2026-04-27-concrete-vermin-design.md](./docs/superpowers/specs/2026-04-27-concrete-vermin-design.md) |
| Adding a vermin variant | `src/sim/content/variants.ts`, [docs/BESTIARY.md](./docs/BESTIARY.md) |
| Adding a mission | `src/sim/content/missions/`, [docs/BALANCE.md](./docs/BALANCE.md) |
| Tuning gameplay | [docs/BALANCE.md](./docs/BALANCE.md) |
| Brand / aesthetic | [docs/DESIGN.md](./docs/DESIGN.md), `src/ui/theme/` |
| Story / lore | [docs/LORE.md](./docs/LORE.md) |
| Tests | [docs/TESTING.md](./docs/TESTING.md) |
| CI / mobile build | [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) |
| What's left to do | [docs/STATE.md](./docs/STATE.md) |
