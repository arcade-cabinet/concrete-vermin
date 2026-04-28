# GitHub Copilot — concrete-vermin

This project's authoritative agent instructions live in [CLAUDE.md](../CLAUDE.md) and [AGENTS.md](../AGENTS.md).
Standards (CI-enforced) live in [STANDARDS.md](../STANDARDS.md).
The canonical design lives in [docs/superpowers/specs/2026-04-27-concrete-vermin-design.md](../docs/superpowers/specs/2026-04-27-concrete-vermin-design.md).

Read those before generating code.

## Quick reminders

- pnpm only. No npm or yarn.
- `src/sim/**` is pure TS. No React/Pixi/DOM/Tone/Capacitor. No `Math.random` (use `createRng`).
- Vermin spawning only via `src/sim/factories/actor.composeVermin`.
- No neon hex (`#00f0ff`, `#ff2a2a`, `#ffd700`) outside `src/render/effects/crt.ts`.
- Conventional Commits.
- Squash-merge PRs.
