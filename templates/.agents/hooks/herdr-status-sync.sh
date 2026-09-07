#!/usr/bin/env bash
set -euo pipefail

# Argument: task description or status
STATUS="${1:-Working}"

# Only execute when running inside a Herdr environment
if [ "${HERDR_ENV:-}" != "1" ]; then
  exit 0
fi

if command -v herdr >/dev/null 2>&1; then
  # Sanitize status title
  SAFE_STATUS=$(echo "$STATUS" | tr -cd '[:alnum:] _-.' | cut -c 1-32)
  # Update current pane title if possible
  herdr pane rename --current "AGY: $SAFE_STATUS" >/dev/null 2>&1 || true
fi

exit 0
