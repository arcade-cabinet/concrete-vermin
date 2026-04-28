---
title: Concrete Vermin
updated: 2026-04-27
status: current
domain: product
---

# Concrete Vermin: Tactical Reforged

Pulpy 1979 NYC rail-shooter for the arcade cabinet. Drag-to-aim, auto-fire while held. Hunt rats, roaches, pigeons, geese, and worse across subway tunnels, brick alleys, sodium-vapor streets, and rooftops. Built mobile-first via Capacitor.

> The neon POC at `poc.html` is the **floor**. The production game is the ceiling.

## Status

Pre-bootstrap. Governing artifacts in place; implementation begins on first execution of [`docs/plans/concrete-vermin.prq.md`](docs/plans/concrete-vermin.prq.md) via `/task-batch`.

## Quick start

```bash
pnpm install
pnpm dev
```

Web preview at `http://localhost:5173` once the renderer ships.

## Key documents

| Doc | What |
|---|---|
| [docs/superpowers/specs/2026-04-27-concrete-vermin-design.md](docs/superpowers/specs/2026-04-27-concrete-vermin-design.md) | Canonical design spec |
| [docs/plans/concrete-vermin.prq.md](docs/plans/concrete-vermin.prq.md) | Governing PRD for autonomous delivery |
| [CLAUDE.md](CLAUDE.md) | Agent entry point |
| [AGENTS.md](AGENTS.md) | Operating protocols for agents |
| [STANDARDS.md](STANDARDS.md) | CI-enforced gates |
| [docs/STATE.md](docs/STATE.md) | What's done, what's next |

## Stack

PixiJS · pixi-react · Koota · Yuka (GOAP port) · Tone.js · Capacitor · Radix · Framer Motion · Matter.js (optional) · TypeScript · Vite · Vitest · Playwright · Biome · pnpm.

## License

[MIT](LICENSE).
