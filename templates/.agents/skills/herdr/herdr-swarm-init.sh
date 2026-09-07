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

# Split Pane 1 horizontally for the Implementer (Pane 2)
PANE2_JSON=$(herdr pane split --current --direction right --no-focus --format json)
PANE2_ID=$(echo "$PANE2_JSON" | grep -o '"id": *"[^"]*"' | head -1 | cut -d'"' -f4)

# Split Pane 2 vertically for the Watcher / Test Runner (Pane 3)
PANE3_JSON=$(herdr pane split --pane "$PANE2_ID" --direction down --no-focus --format json)
PANE3_ID=$(echo "$PANE3_JSON" | grep -o '"id": *"[^"]*"' | head -1 | cut -d'"' -f4)

echo "Created Worker Pane: $PANE2_ID"
echo "Created Watcher Pane: $PANE3_ID"

# Rename panes
herdr pane rename --current "Architect (Lead)"
herdr pane rename --pane "$PANE2_ID" "Implementer (Nix Shell)"
herdr pane rename --pane "$PANE3_ID" "Continuous Watcher (Tests)"

# If flake.nix exists, launch nix develop in the worker pane
if [ -f "flake.nix" ]; then
  herdr pane run --pane "$PANE2_ID" "nix develop"
fi

echo "✅ Swarm initialized successfully."
