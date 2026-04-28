#!/usr/bin/env bash
# task-batch-flush.sh — flushes in-memory task-batch state to disk before compaction.
set -euo pipefail
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || dirname "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")")}"
STATE_DIR="$PROJECT_ROOT/.claude/state/task-batch"
mkdir -p "$STATE_DIR"
date -u +"%Y-%m-%dT%H:%M:%SZ" > "$STATE_DIR/.last-compaction"
exit 0
