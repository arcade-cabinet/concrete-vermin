---
title: State
updated: 2026-04-28
status: current
domain: context
---

# State — Where the project stands

## What's done (governance)

- ✅ Canonical design spec: [docs/superpowers/specs/2026-04-27-concrete-vermin-design.md](superpowers/specs/2026-04-27-concrete-vermin-design.md)
- ✅ Governing PRD: [docs/plans/concrete-vermin.prq.md](plans/concrete-vermin.prq.md)
- ✅ CLAUDE.md, AGENTS.md, STANDARDS.md
- ✅ Supporting docs (this file, ARCHITECTURE, DESIGN, LORE, BESTIARY, BALANCE, TESTING, DEPLOYMENT)
- ✅ Repo skeleton (package.json, tsconfigs, vite/vitest/playwright/biome configs, capacitor)
- ✅ CI workflows (ci, release, cd, analysis-nightly, automerge)
- ✅ Dependabot, release-please, .editorconfig, .gitignore, LICENSE
- ✅ Claude Code hooks (sim-purity, brand-no-neon, factory pyramid, layering, pnpm-only, --no-verify ban)
- ✅ Git initialized + first commit pushed
- ✅ Public repo at `arcade-cabinet/concrete-vermin`

## What's next

Implementation begins by running:

```bash
/task-batch docs/plans/concrete-vermin.prq.md
```

This starts Phase 1 (Foundation, CV-001 → CV-019). Phase 2 (Sim Core) depends on Phase 1 green.

## Phase status

| Phase | Status | Notes |
|---|---|---|
| 0 — Governance | ✅ Complete | bootstrap commit |
| 1 — Foundation | ✅ Complete | PR #1 merged 2026-04-28 (Capacitor Android shell, lockfile, hook fixes, biome migrate) |
| 2 — Sim Core | ✅ Complete | PR #2 open — 308/308 tests, sim-purity gate green |
| 3 — ECS Bridge | ⬜ Pending | CV-040 → CV-054 |
| 4 — Render | ⬜ Pending | CV-055 → CV-074 |
| 5 — UI Shell | ⬜ Pending | CV-075 → CV-099 |
| 6 — Audio | ⬜ Pending | CV-100 → CV-114 |
| 7 — Content | ⬜ Pending | CV-115 → CV-159 |
| 8 — Balance & Polish | ⬜ Pending | CV-160 → CV-189 |

## Decisions made during implementation

- **2026-04-28**: Swapped `pixi-react@^7` (deprecated stub) for `@pixi/react@^8` — the stack mandate says "pixi-react" but the actually-modern Pixi-8 React bridge ships under that scoped name.
- **2026-04-28**: GOAP planner uses an array open-list with linear scan instead of a heap — vermin/boss script action spaces are ≤ 30 actions; a heap costs determinism (FIFO tiebreak is simpler) for negligible perf gain.
- **2026-04-28**: rng.fork(label) is order-independent (derived from parent's STARTING seed XOR label, does not consume parent stream). Trade-off: encounter spec re-ordering is invisible to sibling streams; cost: parent draw-count no longer tells you which forks happened. Worth it for analysis-sweep determinism.
- **2026-04-28**: Damage resolver `armorPierce` is a fraction `[0..1]` where 1=ignore armor, 0=full armor (matches "% pierced" intuition). Initially shipped inverted; corrected before merge.
- **2026-04-28**: Hot-moment detector window is 5 kills / 4 seconds. Subsequent kills in the same window EXTEND the moment (replace-tail) rather than spawning duplicates.
- **2026-04-28**: Variants registry seeded with 30 entries (3 per non-boss archetype, 1 per boss). Mission specs reference variants by id, not raw archetypes — this is the analysis sweeper's mutation surface.

## Blockers

(Empty.)

## Outstanding follow-ups for v1+

- iOS launch (Capacitor target compiles but isn't shipped in v1)
- Online leaderboards
- Microtransactions / IAP (explicitly out of scope for v1)
- User-generated content / level editor
- Automated APK signing in CI (currently manual)
