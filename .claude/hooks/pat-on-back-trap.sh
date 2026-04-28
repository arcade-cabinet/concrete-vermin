#!/usr/bin/env bash
# pat-on-back-trap.sh — UserPromptSubmit hook for Concrete Vermin.
#
# When the user sends a brief acknowledgement ("ok", "go", "thanks",
# "keep going" etc.), inject the open-queue summary as additional
# context so the agent knows exactly what to do next instead of
# stopping for confirmation.

set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO"

INPUT=$(cat || echo "{}")
PROMPT=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    print(json.load(sys.stdin).get('prompt',''))
except Exception:
    print('')
" 2>/dev/null || echo "")

NORM=$(echo "$PROMPT" | tr '[:upper:]' '[:lower:]' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
WC=$(echo "$NORM" | wc -w | tr -d ' ')

TRIGGER=0
if [ "$WC" -le 5 ]; then
  case "$NORM" in
    "thanks"|"ty"|"thank you"|"nice"|"good"|"good job"|"great"|"great work"| \
    "awesome"|"cool"|"ok"|"okay"|"go"|"continue"|"keep going"|"keep at it"| \
    "sounds good"|"looks good"|"lgtm"|"yes"|"yep"|"ship it"|"ready"|"done"| \
    "all set"|"perfect"|"k"|"more"|"next")
      TRIGGER=1
      ;;
  esac
fi

if [ "$WC" = "1" ] && [ "${#NORM}" -le 3 ]; then
  TRIGGER=1
fi

if [ "$TRIGGER" = "0" ]; then
  echo "{}"
  exit 0
fi

DIRECTIVE="$REPO/.claude/continuous-directive.md"
TMP=$(mktemp -t pat.XXXXXX)
trap 'rm -f "$TMP"' EXIT

{
  echo "[autopilot] Brief acknowledgement — do not stop, do not summarize."
  echo ""
  if [ -f "$DIRECTIVE" ]; then
    n=$(grep -c '^- \[ \]' "$DIRECTIVE" 2>/dev/null || true)
    n=${n:-0}
    echo "$n .claude/continuous-directive.md items still open."
    echo ""
    echo "Top open items:"
    grep '^- \[ \]' "$DIRECTIVE" | head -5
  fi
  echo ""
  echo "Pick the next one and ship a commit. Do not ask what to do."
} > "$TMP"

python3 - "$TMP" <<'PY'
import json, sys
with open(sys.argv[1]) as f:
    context = f.read()
print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "UserPromptSubmit",
        "additionalContext": context
    }
}))
PY
