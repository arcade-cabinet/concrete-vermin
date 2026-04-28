#!/usr/bin/env bash
# anti-stop-check.sh — runs on every Stop event to verify the agent did not
# stop prematurely while the continuous-directive is ACTIVE.
#
# Exits 2 (block) if:
#   - directive file exists AND is ACTIVE
#   - queue still has unchecked items
#   - no new commit since last stop event (last-stop marker)
#
# Exits 0 (allow) if:
#   - directive absent (normal session)
#   - queue drained
#   - at least one new commit since the last stop marker

set -euo pipefail

REPO="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
DIRECTIVE="$REPO/.claude/continuous-directive.md"
MARKER="$REPO/.claude/state/.last-stop-sha"
mkdir -p "$REPO/.claude/state"

# No directive → nothing to enforce
[ -f "$DIRECTIVE" ] || exit 0

# Directive inactive (explicit user release) → allow stop
grep -qiE "^\\*\\*Status:\\*\\* *ACTIVE" "$DIRECTIVE" || exit 0

# Count unchecked queue items
OPEN=$(grep -cE '^- \[ \]' "$DIRECTIVE" || true)
if [ "$OPEN" -eq 0 ]; then
  # Queue drained. Allow stop. Mark done.
  if sed --version 2>/dev/null | grep -q GNU; then
    sed -i 's/^\*\*Status:\*\* *ACTIVE/**Status:** DRAINED/' "$DIRECTIVE"
  else
    sed -i '' 's/^\*\*Status:\*\* *ACTIVE/**Status:** DRAINED/' "$DIRECTIVE"
  fi
  exit 0
fi

# Require at least one commit since last stop attempt
CURRENT_SHA="$(git rev-parse HEAD 2>/dev/null || echo "none")"
LAST_SHA="$(cat "$MARKER" 2>/dev/null || echo "")"

if [ "$CURRENT_SHA" = "$LAST_SHA" ]; then
  cat >&2 <<EOF
⛔ STOP BLOCKED: continuous-directive is ACTIVE and no new commit was made
   since the last stop attempt (HEAD still $CURRENT_SHA).

Queue has $OPEN open items in .claude/continuous-directive.md.
Pick the top one, ship a commit, then you may stop.

If the user has explicitly said "stop", change the directive's
Status line from ACTIVE to RELEASED and this hook will allow exit.
EOF
  exit 2
fi

# New commit since last stop → allow, record
echo "$CURRENT_SHA" > "$MARKER"
exit 0
