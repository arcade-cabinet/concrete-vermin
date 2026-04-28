---
title: Concrete Vermin — Agent Operating Protocols
updated: 2026-04-27
status: current
domain: context
---

# AGENTS.md

Extended operating protocols for autonomous and semi-autonomous agents working on Concrete Vermin.

## Operating mode

**Autonomous delivery.** The user has approved the design ([docs/superpowers/specs/2026-04-27-concrete-vermin-design.md](./docs/superpowers/specs/2026-04-27-concrete-vermin-design.md)) and the PRD ([docs/plans/concrete-vermin.prq.md](./docs/plans/concrete-vermin.prq.md)). Implementation proceeds without further design questions.

**On ambiguity**: make a defensible decision aligned with the design's spirit, log it in `docs/STATE.md` → "Decisions made during implementation", continue.

**On a hard blocker** (broken upstream dep, contradiction in spec, missing required asset): document in `docs/STATE.md` → "Blockers", open a GitHub issue, continue with parallel work that isn't blocked.

## Per-task workflow

1. Read the task in `docs/plans/concrete-vermin.prq.md`.
2. Read the relevant design section it derives from.
3. Branch: `feat/<task-id>-<short-slug>` (e.g., `feat/CV-024-scoring-engine`).
4. Implement, with tests, in the same commit chain.
5. Run gates locally: `pnpm typecheck && pnpm lint && pnpm test && pnpm analysis:smoke`.
6. Commit (Conventional Commits), push, open PR.
7. Wait for CI green. Never `--admin` merge.
8. Address PR feedback, re-push.
9. Squash-merge once green.
10. Update `docs/STATE.md` → mark task done, list any decisions logged, list any new follow-ups discovered.

## Parallelizable work

The PRD task graph identifies parallel opportunities. Specifically:

- **Sim core (Phase 2)** parallelizes across: rng, traits, archetypes, scoring, encounter-fsm.
- **Content (Phase 7)** parallelizes across mission scripts, variant definitions, cutscene prose, collectible prose, bestiary entries.
- **Audio (Phase 6)** parallelizes across weapon/vermin/ambience patches.

When the next available task has no in-flight dependency, **spawn a subagent** rather than serialize. Default model: `sonnet`. Use `haiku` for content (cutscene prose, bestiary entries, mission scripts that are mostly data). Reserve `opus` for the GOAP port and the autobalance algorithm.

## Subagent dispatch

```
Agent(model="haiku")   # cutscene prose, bestiary entries, mission data
Agent(model="sonnet")  # feature implementation, tests, balance tuning
Agent(model="opus")    # GOAP port, autobalance algorithm, performance optimization
```

Always pass:
- The PRD task ID
- The path to the relevant design section
- The acceptance criteria
- "Implement, test, commit on a branch, open a PR. Do not ask design questions — decide and log."

## Code conventions

See [STANDARDS.md](./STANDARDS.md) for the full list of CI-enforced rules.

Beyond those:

- **No comments explaining what code does.** Identifiers are the documentation. Only comment **why** when there's a hidden constraint, subtle invariant, or workaround.
- **No defensive guards for impossible states.** Trust internal code and framework guarantees. Validate only at boundaries (user input, IPC).
- **No backward-compatibility shims.** When a module moves, every caller moves with it in the same PR.
- **No `// removed for X`-style markers.** If it's gone, it's gone.

## Visual verification

For UI changes, capture a screenshot via Playwright before claiming done. For gameplay changes, capture a Pixi screenshot via the dev `?screenshot=1` query param (provided by `src/ui/shell/devtools.ts`). Review the image before reporting completion.

## Test discipline

- Sim changes → add Node-test
- ECS changes → add world-fixture test
- UI changes → add jsdom test
- Canvas/render changes → add browser test
- Mission/encounter changes → re-run `pnpm analysis:smoke`

## Resources

| Tool | Where |
|---|---|
| Godot | `/opt/homebrew/bin/godot` |
| Blender | `/opt/homebrew/bin/blender` |
| Asset library | `/Volumes/home/assets/` (mount with `mount | grep -q /Volumes/home`) |
| Asset MCP | `~/src/assets-management/assets-mcp/` |

For UI inspiration: `mcp__magic__21st_magic_component_inspiration` before hand-rolling components.
