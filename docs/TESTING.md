---
title: Testing
updated: 2026-04-27
status: current
domain: quality
---

# Testing

## Three Vitest configs

| Config | Environment | Includes |
|---|---|---|
| `vitest.config.ts` | node | `src/sim/**/*.test.ts`, `src/ecs/**/*.test.ts`, `src/lib/**/*.test.ts`, `src/render/**/*.test.ts`, `src/platform/**/*.test.ts` |
| `vitest.dom.config.ts` | jsdom | `src/ui/**/*.dom.test.{ts,tsx}` |
| `vitest.browser.config.ts` | real Chromium | `src/**/*.browser.test.{ts,tsx}` (Pixi/canvas) |

## Playwright

`e2e/` — 4 device projects (mobile-portrait, mobile-landscape, tablet-portrait, desktop). Per-repo port `41739`. Notable specs:

| Spec | Purpose |
|---|---|
| `golden-path.spec.ts` | The **player-journey gate**. Cold player → first kill → mission complete in ≤4 min. Fails the PR if broken. |
| `drag-aim.spec.ts` | Drag-to-aim mechanic E2E. Asserts crosshair offset, auto-fire, magnetism. |
| `cutscene-collectible.spec.ts` | Shoot-to-pause story collectibles. |
| `pawnshop.spec.ts` | Cash → mod purchase → loadout → effect verifiable. |
| `case-file.spec.ts` | Re-readable artifact archive. |
| `player-governor.spec.ts` | Nightly. Median governor through all 12 missions. |

## Coverage targets (informal)

- `src/sim/**`: ≥ 90% (pure code, easy to cover)
- `src/ecs/**`: ≥ 80%
- `src/render/**`: ≥ 60% (browser tests carry the rest)
- `src/ui/**`: ≥ 70% (jsdom + e2e blend)

## Running

```bash
pnpm test                # node + dom (fast)
pnpm test:node
pnpm test:dom
pnpm test:browser
pnpm test:e2e
pnpm test:e2e:governor   # nightly long-form
pnpm test:release        # release-gating analysis
```
