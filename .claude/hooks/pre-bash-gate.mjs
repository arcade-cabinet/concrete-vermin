#!/usr/bin/env node
// Pre-bash gate. Refuses risky commands. Most enforcement is via Biome+CI;
// this catches the obvious bypasses an agent might attempt.
import { readFileSync } from "node:fs";

let input = "";
try {
  input = readFileSync(0, "utf-8");
} catch {
  process.exit(0);
}
let event;
try {
  event = JSON.parse(input);
} catch {
  process.exit(0);
}

const cmd = event?.tool_input?.command ?? "";
if (!cmd) process.exit(0);

const reject = (msg) => {
  process.stderr.write(`[concrete-vermin pre-bash-gate] ${msg}\n`);
  process.exit(2);
};

if (/\b(npm|yarn)\s+(install|add|i\b|ci\b)/.test(cmd) && !/\bpnpm\b/.test(cmd)) {
  reject(`pnpm-only: rejected '${cmd.slice(0, 80)}…'. ` + `Use pnpm. STANDARDS.md §11.`);
}

if (/git\s+commit\s+.*--no-verify/.test(cmd)) {
  reject(`--no-verify rejected. Pre-commit hooks must run. Investigate the failing hook.`);
}

if (/git\s+push\s+.*--force(?!-with-lease)/.test(cmd)) {
  reject(`git push --force rejected. Use --force-with-lease.`);
}

if (/gh\s+pr\s+merge.*--admin/.test(cmd)) {
  reject(`gh pr merge --admin rejected. Wait for CI green. STANDARDS.md autonomy guardrails.`);
}

process.exit(0);
