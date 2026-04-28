#!/usr/bin/env bash
# task-batch-flush.sh — flushes in-memory task-batch state to disk before compaction.
# Idempotent. Resolves the project root via (in order): CLAUDE_PROJECT_DIR,
# `git rev-parse`, then a POSIX-portable script-directory walk (script lives
# at <repo>/.claude/hooks/, so the repo root is two `dirname` levels up from
# the script's directory).
set -euo pipefail

resolve_project_root() {
  if [[ -n "${CLAUDE_PROJECT_DIR:-}" ]]; then
    printf '%s\n' "$CLAUDE_PROJECT_DIR"
    return
  fi
  local root
  if root=$(git rev-parse --show-toplevel 2>/dev/null); then
    printf '%s\n' "$root"
    return
  fi
  # Portable fallback: cd into the script's dir, then up two levels.
  # No reliance on GNU readlink -f.
  local script_dir
  script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
  # script_dir = <repo>/.claude/hooks → up two = <repo>
  printf '%s\n' "$(cd -- "$script_dir/../.." && pwd)"
}

PROJECT_ROOT=$(resolve_project_root)
STATE_DIR="$PROJECT_ROOT/.claude/state/task-batch"
mkdir -p "$STATE_DIR"
date -u +"%Y-%m-%dT%H:%M:%SZ" >"$STATE_DIR/.last-compaction"
exit 0
