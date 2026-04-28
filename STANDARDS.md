---
title: Concrete Vermin — Standards
updated: 2026-04-27
status: current
domain: quality
---

# Standards — Concrete Vermin

These are the non-negotiable gates. CI, hooks, and Biome enforce them. Subagent-driven development assumes these will not be relaxed.

## 1. Player-journey gate

A cold player — never seen the game before — must, within **15 seconds** of the title screen, understand:
- That this is a shooter
- That they aim by dragging
- That they shoot at the moving things
- That bigger / glowing / paper-textured things behave differently

The tutorial mission (`m01-bodega`) must be passable on first try by a non-gamer. Verified by the `e2e/golden-path.spec.ts` (no helper text reads required, mission completes within 4 minutes including the 60-100 word interstitial read).

## 2. Sim-purity gate

`src/sim/**` is **pure TypeScript**. The CI step `pnpm -s tsc -b tsconfig.sim.json` must pass with no DOM types loaded. Imports of any of the following from `sim/**` files are a hard error:

- `react`, `react-dom`, `pixi-react`
- `pixi.js`, `@pixi/*`
- `tone`
- `@capacitor/*`, `@capacitor-community/*`
- `framer-motion`, `@radix-ui/*`
- `matter-js`
- DOM globals (`window`, `document`, `navigator`)

Direct `Math.random()` in `src/sim/**` is a hard error. Use `createRng(seed)` from `@/sim/rng`.

## 3. Balance gate

`pnpm analysis:benchmark --profile ci` runs on every PR and must pass. Each mission's median-governor clear rate, perfect-governor achievable grade, and accuracy band live in `src/sim/analysis/thresholds.ts`. Drift outside any band fails the PR.

## 4. Brand gate

The palette lives in `src/ui/theme/colors.ts`. Forbidden colors outside of `src/render/effects/crt.ts` (which intentionally renders the cabinet's CRT bezel):

- Neon cyan `#00f0ff` and any `#0XfXfX` close variant
- Neon magenta `#ff00ff`
- Neon green `#39ff14`
- Pure neon red `#ff2a2a` (the POC's red — replaced by brick `#7a2818`)
- Neon gold `#ffd700` (replaced by sodium amber `#d4943a`)
- Pure white backgrounds

Pre-edit hook scans staged changes for these and rejects.

## 5. Pulpy-not-grimdark gate

Splash gore stays bright. Blood color = `#7a2818` (brick-red, brighter than `#400000`). No lingering corpses (despawn after 1.5s with a fade). No realistic anatomical detail. Vermin death animations cap at 3 frames + particle splash.

## 6. Factory pyramid

| Concern | Only path |
|---|---|
| Spawn a vermin | `src/sim/factories/actor.composeVermin()` |
| Build an encounter | `src/sim/factories/encounter.composeEncounter()` |
| Define a mission | `src/sim/factories/mission.defineMission()` |
| Roll any random number | `createRng(seed).next()` from `@/sim/rng` |
| Apply weapon damage | `src/sim/engine/damage.resolveHit()` |
| Update score | `src/sim/engine/scoring.recordKill()` |

CI greps for raw `world.spawn(Vermin` and `Math.random` and rejects.

## 7. GOAP for vermin AI

Vermin behavior lives in `src/sim/ai/goap/`. Each archetype's brain composes from the GOAP `Goal` / `CompositeGoal` / `Think` / `GoalEvaluator` primitives. No `switch (state) { case 'idle': ... }` style state machines for vermin behavior. (Boss FSMs are explicitly allowed and live in `src/sim/ai/bosses/`.)

## 8. File-length guideline (not a hard cap)

Decompose by responsibility. A canvas renderer, simulation core, or single-responsibility encounter file can run long. A 300-line file that secretly owns three subsystems is worse than a 600-line file with one tangled-but-cohesive job. Pre-edit hook **warns** at 600 lines, **does not block**.

## 9. Tests are part of the change

Touch a sim rule → update its unit test in the same PR. Touch a UI component → update its `*.dom.test.tsx` in the same PR. Touch a mission script → expect `analysis:benchmark` to re-validate.

Stale tests are worse than no tests. CI runs `pnpm test` on every PR; failures block.

## 10. Conventional Commits

`feat:` / `fix:` / `chore:` / `docs:` / `refactor:` / `perf:` / `test:` / `ci:` / `build:`. Squash-merge PRs. release-please drives versioning.

## 11. pnpm-only

`package-lock.json` or `yarn.lock` in the repo = CI fail. `pnpm-lock.yaml` is the single source of truth.

## 12. Biome, not ESLint/Prettier

`biome.json` is the single source of truth for lint + format. No `.eslintrc*`, no `.prettierrc*`.

## 13. Action SHAs in workflows

`.github/workflows/*.yml` must pin action references to commit SHAs (with version comment). `actions/checkout@de0fac2e... # v6.0.2` — not `@v6`.

## 14. Mobile-first

Touch input is the primary input model. Mouse/keyboard support is a secondary nicety, not a design driver. Safe-area insets respected. 60fps on a 3-year-old mid-range Android is the perf bar.
