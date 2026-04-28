#!/usr/bin/env node
// Session-start orientation. Prints the read-this-first map every session.
// Non-blocking; just informational stdout.

const msg = `
[concrete-vermin] Session start.

Canonical design:  docs/superpowers/specs/2026-04-27-concrete-vermin-design.md
Governing PRD:     docs/plans/concrete-vermin.prq.md
Standards (gates): STANDARDS.md
Current state:     docs/STATE.md

Hooks active:
  - pre-edit-gate:  sim-purity, brand-no-neon, factory pyramid, layering
  - pre-bash-gate:  pnpm-only, no --no-verify, no --force, no --admin merge
  - post-edit:      file-length warnings (600+ lines)

Mode: autonomous delivery. Decide, log to docs/STATE.md, continue. No design questions.
`;
process.stdout.write(msg);
process.exit(0);
