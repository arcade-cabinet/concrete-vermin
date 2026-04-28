#!/usr/bin/env bash
# anti-stop-check.sh — per-repo Stop hook for Concrete Vermin.
#
# Blocks Stop while the directive's queue still has open checkboxes.
# Uses the {"decision":"block","reason":...} JSON protocol so the
# agent receives the open items as actionable feedback instead of a
# silent block. No SHA-advance escape hatch — the only way out is to
# drain the queue or flip Status to RELEASED.

set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO"

DIRECTIVE="$REPO/.claude/continuous-directive.md"

# No directive → nothing to enforce.
[ -f "$DIRECTIVE" ] || exit 0

# Status: RELEASED → user explicitly let us stop.
if grep -qiE '^\*\*Status:\*\* *RELEASED' "$DIRECTIVE"; then
  exit 0
fi

# Status: ACTIVE check (default if absent — be strict).
# Use `|| true` so set -e doesn't trip on no-match.
n=$(grep -c '^- \[ \]' "$DIRECTIVE" 2>/dev/null || true)
n=${n:-0}

if [ "$n" = "0" ]; then
  # Queue drained — flip to DRAINED so the next session knows.
  if sed --version 2>/dev/null | grep -q GNU; then
    sed -i 's/^\*\*Status:\*\* *ACTIVE/**Status:** DRAINED/' "$DIRECTIVE"
  else
    sed -i '' 's/^\*\*Status:\*\* *ACTIVE/**Status:** DRAINED/' "$DIRECTIVE"
  fi
  exit 0
fi

TMP=$(mktemp -t keep-going.XXXXXX)
trap 'rm -f "$TMP"' EXIT

{
  echo "Stop blocked: ${n} checkboxes still open in .claude/continuous-directive.md."
  echo ""
  echo "Top open items:"
  grep '^- \[ \]' "$DIRECTIVE" | head -8
  echo ""
  echo "Pick the next one and execute. Do not ask what to do."
  echo "If the user has explicitly said stop, change the directive's"
  echo "Status from ACTIVE to RELEASED."
} > "$TMP"

python3 - "$TMP" <<'PY'
import json, sys
with open(sys.argv[1]) as f:
    reason = f.read()
print(json.dumps({"decision": "block", "reason": reason}))
PY
