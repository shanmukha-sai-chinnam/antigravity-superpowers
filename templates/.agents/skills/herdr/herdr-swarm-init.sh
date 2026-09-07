#!/usr/bin/env bash
set -euo pipefail

# Herdr Swarm Preset: Trio Architecture
# Creates a 3-pane collaborative multi-agent workspace:
# - Pane 1: Architect / Lead Agent (Planning Mode & Orchestration)
# - Pane 2: Worker / Implementer (Nix Devshell / Build runner)
# - Pane 3: Continuous Watcher / Test Reviewer

if [ "${HERDR_ENV:-}" != "1" ]; then
  echo "Error: Must run inside a Herdr environment (HERDR_ENV=1)." >&2
  exit 1
fi

echo "🚀 Initializing Herdr Swarm: Trio Architecture..."

CURRENT_PANE="${HERDR_PANE_ID:-$(herdr pane list | grep -o '"pane_id":"[^"]*"' | head -1 | cut -d'"' -f4)}"

# Split right for Implementer (Pane 2)
PANE2_JSON=$(herdr pane split --current --direction right --no-focus)
PANE2_ID=$(echo "$PANE2_JSON" | grep -o '"pane_id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Split down for Watcher (Pane 3)
PANE3_JSON=$(herdr pane split --direction down --no-focus "$PANE2_ID")
PANE3_ID=$(echo "$PANE3_JSON" | grep -o '"pane_id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "Created Worker Pane: $PANE2_ID"
echo "Created Watcher Pane: $PANE3_ID"

# Rename panes using native Herdr syntax
herdr pane rename "$CURRENT_PANE" "Architect (Lead)"
herdr pane rename "$PANE2_ID" "Implementer (Nix Shell)"
herdr pane rename "$PANE3_ID" "Continuous Watcher (Tests)"

# Run commands in panes
if [ -f "flake.nix" ]; then
  herdr pane run "$PANE2_ID" "nix develop"
fi
herdr pane run "$PANE3_ID" "antigravity-superpowers watch"

echo "✅ Swarm initialized successfully."
