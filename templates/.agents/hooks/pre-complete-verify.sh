#!/usr/bin/env bash
set -euo pipefail

# Rule: Evidence before assertions always.
# Check if project test runner exists and verify it passes.

if [ -f "package.json" ] && command -v npm >/dev/null 2>&1; then
  echo "Running project tests before completion..."
  npm test
fi

if [ -f ".agents/tests/run-tests.sh" ]; then
  echo "Running .agents profile checks..."
  bash .agents/tests/run-tests.sh
fi

if [ -f "flake.nix" ] && command -v nix >/dev/null 2>&1; then
  echo "Running nix flake check..."
  nix flake check --no-build
fi

echo "All pre-completion verification gates passed."
exit 0
