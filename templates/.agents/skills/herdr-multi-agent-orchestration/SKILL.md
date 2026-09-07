---
name: herdr-multi-agent-orchestration
description: Use when coordinating multi-agent swarms across Herdr panes (Trio architecture: Architect, Implementer, Watcher). Guides inter-agent messaging, role delegation, worktree isolation, and verification synchronization.
---

# Herdr Multi-Agent Orchestration Runbook

Coordinate concurrent AI coding agents and automated verification daemons across multiplexed Herdr / tmux panes.

## Core Swarm Architecture: The Trio Pattern

The Trio architecture separates concerns between strategy, implementation, and continuous verification:

```
┌────────────────────────────────────────┐
│ Pane 1: Lead Architect (Antigravity)   │
│ - Planning mode & task breakdown       │
│ - Design decisions & user review       │
│ - Git worktree coordination            │
├───────────────────┬────────────────────┤
│ Pane 2:           │ Pane 3:            │
│ Implementer       │ Watcher & Verifier │
│ - Nix devShell    │ - agsp watch       │
│ - Focused edits   │ - Live linters     │
│ - TDD cycle       │ - Test feedback    │
└───────────────────┴────────────────────┘
```

## Quick Start

### 1. Launch Swarm
To spin up the trio swarm in the current project:
```bash
antigravity-superpowers swarm start --preset trio
```
Or with custom workspace:
```bash
antigravity-superpowers swarm start --preset trio --workspace /path/to/project
```

### 2. Check Swarm Status
```bash
antigravity-superpowers swarm status
```

### 3. Broadcast Instructions Across Swarm
```bash
antigravity-superpowers swarm broadcast "Starting phase 2: Run verification on models"
```

## Role Responsibilities

### Role 1: Lead Architect (Pane 1)
- Keeps the high-level plan and task boundaries.
- Executes `using-git-worktrees` when isolating experimental changes.
- Reviews diffs and communicates with the user.

### Role 2: Implementer (Pane 2)
- Operates inside the project's native devShell (`nix develop`).
- Follows `test-driven-development` strictly: writes failing tests before production code.
- Executes single tasks sequentially without jumping ahead.

### Role 3: Continuous Watcher (Pane 3)
- Runs `antigravity-superpowers watch` or `antigravity-superpowers watch --fix`.
- Continuously runs Alejandra, Statix, Deadnix on Nix changes, ShellCheck on bash scripts, and unit tests.
- Provides immediate visual feedback if an edit breaks compilation or formatting.

## Inter-Pane Communication

When sending directives between panes:
```bash
# Send command to pane 2 (Implementer)
tmux send-keys -t agsp-swarm.1 "npm test" C-m

# Inspect pane output without switching focus
tmux capture-pane -pt agsp-swarm.1 -S -50
```

## Teardown and Cleanup

When the swarm workflow is complete:
```bash
antigravity-superpowers swarm stop
```
Ensure all git changes are verified and clean before exiting.
