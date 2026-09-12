---
name: continuous-codebase-watching
description: Use when setting up background verification, auto-formatting, and static analysis watchers during implementation. Enforces immediate feedback on Nix, Shell, and JavaScript/TypeScript changes.
---

# Continuous Codebase Watching Runbook

Keep codebases formatted, validated, and verified continuously while editing code.

## Why Continuous Watching

Catching errors early prevents large-scale refactoring and debug cycles. The Antigravity Superpowers watcher monitors filesystem events and triggers the appropriate static linters and test suites with sub-second latency.

## Launching the Watcher

### 1. Interactive Watch Mode
Start the continuous watcher in your active workspace:
```bash
antigravity-superpowers watch
```

### 2. Auto-Fix Mode
To have the watcher automatically apply formatting (Alejandra, shfmt) and anti-pattern fixes (Statix fix):
```bash
antigravity-superpowers watch --fix
```

### 3. Watch with Unit Tests
To run unit tests whenever source files change:
```bash
antigravity-superpowers watch --test
```

### 4. Single-Pass Verification (`--once`)
Run a fast scan across all files in the project without staying resident:
```bash
antigravity-superpowers watch --once
```

## Language Pipelines

### Nix Expressions (`.nix`)
1. **Alejandra**: Checks formatting consistency.
2. **Statix**: Scans for anti-patterns and deprecated idioms (`statix check`).
3. **Deadnix**: Scans for unused variables and dead bindings.

### Shell Scripts (`.sh`)
1. **ShellCheck**: Static analysis for POSIX and bash scripts.
2. **shfmt**: Indentation and shell syntax formatting.

### JavaScript & TypeScript (`.js`, `.mjs`, `.ts`)
1. **node --test / npm test**: Runs test suite on code modifications.

