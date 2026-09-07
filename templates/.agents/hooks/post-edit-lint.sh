#!/usr/bin/env bash
set -euo pipefail

# Argument: path to modified file
FILE="${1:-}"
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  exit 0
fi

case "$FILE" in
  *.nix)
    if command -v alejandra >/dev/null 2>&1; then
      alejandra -q "$FILE" || true
    fi
    if command -v statix >/dev/null 2>&1; then
      statix check "$FILE" || true
    fi
    ;;
  *.sh)
    if command -v shfmt >/dev/null 2>&1; then
      shfmt -w "$FILE" || true
    fi
    if command -v shellcheck >/dev/null 2>&1; then
      shellcheck "$FILE" || true
    fi
    ;;
  *.json|*.js|*.mjs|*.md)
    if command -v prettier >/dev/null 2>&1; then
      prettier --write "$FILE" >/dev/null 2>&1 || true
    fi
    ;;
  *)
    ;;
esac

exit 0
