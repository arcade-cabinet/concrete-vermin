---
title: Testing
updated: 2026-04-28
status: current
domain: quality
---

# Testing

## Three Vitest configs

| Config | Environment | Includes | Run via |
|---|---|---|---|
| `vitest.config.ts` | node | `src/sim/**`, `src/ecs/**`, `src/data/**`, `src/lib/**`, `src/render/**`, `src/platform/**`, `src/theme/**`, `src/ui/**` (non-DOM `.test.ts`) | `pnpm test:node` |
| `vitest.dom.config.ts` | jsdom | `src/ui/**/*.dom.test.{ts,tsx}` | `pnpm test:dom` |
| `vitest.browser.config.ts` | real Chromium (Playwright) | `src/**/*.browser.test.{ts,tsx}` | `pnpm test:browser` (CI-only by default) |

The split exists so the bulk of the suite stays fast and CI-cheap (node has no jsdom or browser overhead). Anything that genuinely needs the DOM lives in a `.dom.test.tsx` file; anything that needs WebGL / canvas / actual layout lives in `.browser.test.tsx`.

## What each suite covers

### `pnpm test:node` (385 tests)
- **`src/sim/**`** — rng, archetypes, factories, GOAP, scoring, content/missions registry, content/lore registry, all of `src/sim/analysis/*`.
- **`src/ecs/**`** — traits, systems (ai, collide, motion, projectile, lifecycle, score, spawn, cull), actions.
- **`src/render/**`** — pure helpers (no Pixi instantiation; the canvas regression lives in the browser config).
- **`src/theme/**`** — token integrity, `actLightFor` per-act mapping, frozen palette.
- **`src/ui/**`** (non-DOM) — `PlayerProgress` store, `encounter-callouts` resolver.

### `pnpm test:dom` (5 tests)
- `src/ui/hooks/__tests__/useTickedNumber.dom.test.tsx` — covers the rAF score animator under jsdom.

### `pnpm test:browser` (1 test, CI-only)
- `src/ui/__tests__/canvas-renders.browser.test.tsx` — mounts `GameStage` in real Chromium, asserts the canvas exists with positive dimensions and a WebGL context. Catches Pixi-version drift and missing `pixiGraphics` intrinsic — the kind of regression unit tests can't see.

### `pnpm test:e2e` (Playwright, CI-only)
- `e2e/tutorial-clear.spec.ts` — Briefing → MissionSelect → PawnShop → click 40 times → assert "Cleared" overlay. Desktop project only; mobile/tablet projects skip.
- Playwright config defines four projects (mobile-portrait, mobile-landscape, tablet-portrait, desktop). Per-repo port `41739`. Runs against `pnpm exec vite preview`.

## Sim-purity gate

A grep gate in `.github/workflows/ci.yml` rejects any `Math.random()` use in `src/sim/` outside the purity test, and any forbidden import (react/pixi/tone/capacitor/radix/framer/matter). The same rules are also enforced on every Edit/Write by `.claude/hooks/pre-edit-gate.mjs` so violations never reach disk in the first place.

## CI jobs

| Job | When | What it runs |
|---|---|---|
| `core` | every PR | sim-purity grep, typecheck, lint, test:node, test:dom, build |
| `balance-benchmark` | every PR | `pnpm exec tsx scripts/analysis-cli.ts benchmark --profile ci` (`continue-on-error` until missions converge) |
| `release-gate` | every PR | `vitest run src/sim/analysis/__tests__/release-gate` (informational on PR; enforced when `RELEASE_GATING=1` in `release.yml`) |
| `browser-canvas` | every PR | `pnpm test:browser` with Playwright Chromium |
| `e2e-smoke` | every PR | `pnpm build` + `pnpm exec playwright test --project=desktop` |

## Analysis CLI

The benchmark CLI doubles as the local analysis tool:

```bash
pnpm analysis:smoke           # 5 runs/mission, median governor; never fails
pnpm analysis:benchmark       # 25 runs/mission, median + trash; fails if median clear < 40%
pnpm analysis:focus --mission underworld-07-river-mutant
pnpm analysis:sweep --shape weapon-damage --mission streets-01-bodega \
                    --lo 0.8 --hi 1.2 --step 0.05
pnpm analysis:lock:quick      # 3-pass smoke → STABLE/UNSTABLE/UNMEASURED
pnpm analysis:autobalance     # refuses if working tree is dirty
```

## Coverage targets (informal)

- `src/sim/**`: ≥ 90% (pure code, easy to cover; current ~95%)
- `src/ecs/**`: ≥ 80%
- `src/render/**`: ≥ 60% (browser tests carry the rest)
- `src/ui/**`: ≥ 70% (jsdom + e2e blend)

## Running

```bash
pnpm test                # node + dom (fast)
pnpm test:node           # node only
pnpm test:dom            # jsdom only
pnpm test:browser        # real Chromium — needs Playwright browsers installed
pnpm test:e2e            # Playwright e2e
pnpm test:watch          # vitest --watch on the node config

# Release-gate enforcement (CI sets this; local opt-in):
RELEASE_GATING=1 pnpm exec vitest run src/sim/analysis/__tests__/release-gate
```
