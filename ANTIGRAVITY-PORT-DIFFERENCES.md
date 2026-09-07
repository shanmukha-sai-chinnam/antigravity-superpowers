# Antigravity Port Differences vs Original Superpowers

This document details the architecture and evolution between:

- Original skill set: `skills/` (designed for Claude Code)
- Modern Antigravity Superpowers: `templates/.agents/` + CLI + Nix Flake + Herdr Orchestration

---

## 1) High-Level Architecture & Evolution

- **Skill Count**: Expanded from **14** (original) to **23 specialized skills**:
  - 14 Core Process & Quality skills ported and normalized for Antigravity 2.0.
  - 4 NixOS & Flake systems engineering skills (`nixos-system-rebuild`, `nix-flake-management`, `nix-derivation-debugging`, `nix-code-audit`).
  - 2 Herdr & Swarm orchestration skills (`herdr`, `herdr-multi-agent-orchestration`).
  - 1 Model Context Protocol skill (`antigravity-mcp-integration`).
  - 1 Real-time verification skill (`continuous-codebase-watching`).
  - 2 NixOS-WSL & Host interoperability skills (`nixos-wsl-interop`, `windows-wsl-host-bridge`).
- **Discovery Roots**: Migrated to `.agents/` as primary root (with `.agent/` backward compatibility). Global root is `~/.gemini/config/`.
- **Execution Model**:
  - Single-agent tasks leverage Antigravity Planning Mode (`implementation_plan.md`, `walkthrough.md`).
  - Multi-agent swarms leverage **Herdr** (`herdr pane split`, `herdr agent start`) for parallel worker and reviewer execution (zero tmux dependencies).
- **Task Tracking**:
  - Legacy `TodoWrite` replaced with native Planning Mode artifacts or project-root `<project-root>/.agents/task.md`.
- **Platform & Tool Vocabulary Translation**:
  - `Claude / Claude Code` -> `Antigravity`
  - `Skill tool` -> `view_file` on `SKILL.md`
  - `browser` tasks -> `browser_subagent`
  - `superpowers:<skill>` -> `.agents/skills/<skill>/SKILL.md`
  - `CLAUDE.md` -> `.agents/AGENTS.md`

---

## 2) Complete Skill Inventory (23 Skills)

| Skill | Category | Source / Evolution |
| :--- | :--- | :--- |
| `brainstorming` | Process | Preserved, path normalized |
| `writing-plans` | Process | Uses Antigravity Planning Mode & artifacts |
| `executing-plans` | Execution | Integrated with single-flow discipline |
| `single-flow-task-execution` | Execution | **New** — Merges `dispatching-parallel-agents` & `subagent-driven-development` |
| `herdr` | Orchestration | **New** — Terminal multiplexing & agent management |
| `herdr-multi-agent-orchestration` | Orchestration | **New** — Trio Architecture (Architect, Implementer, Watcher) |
| `antigravity-mcp-integration` | Protocol | **New** — STDIO JSON-RPC 2.0 Model Context Protocol |
| `continuous-codebase-watching` | Verifier | **New** — Sub-second automated linter & test feedback daemon |
| `nixos-system-rebuild` | Systems | **New** — Pre-flight checks, 5-stage validation, closure diffs, rollback |
| `nix-flake-management` | Packaging | **New** — Flake authoring, devShells, input pinning |
| `nix-derivation-debugging` | Packaging | **New** — 6-phase stdenv dissection, wrappers, patchelf |
| `nix-code-audit` | Linting | **New** — Alejandra, Statix, Deadnix pipeline |
| `nixos-wsl-interop` | WSL / Systems | **New** — Filesystem boundaries, systemd, memory reclaim, mirrored network |
| `windows-wsl-host-bridge` | WSL / Host | **New** — Path conversion (`wslpath`), clipboard, Windows Terminal, browser preview |
| `test-driven-development` | Quality | Preserved, path normalized |
| `systematic-debugging` | Debugging | Preserved, path normalized |
| `requesting-code-review` | Review | Checklist and review gate flow |
| `receiving-code-review` | Review | Rigorous verification without performative agreement |
| `verification-before-completion` | Quality | Evidence before assertions always |
| `finishing-a-development-branch` | Git | Clean branch options and merge verification |
| `using-git-worktrees` | Git | Isolated worktrees with safe directory selection |
| `using-superpowers` | Core | Automatic skill discovery and routing bootstrap |
| `writing-skills` | Authoring | Creating new skills following AGY standards |

---

## 3) Tool Surface Comparison

| Original Claude Code Tool | Antigravity Native Equivalent |
| :--- | :--- |
| `Skill` | `view_file` |
| `Task` (coding subagent) | Herdr multi-agent pane or Planning Mode task breakdown |
| `Task` (browser) | `browser_subagent` |
| `Bash` | `run_command` |
| `Glob` / `Grep` | `grep_search` (ripgrep) |
| `Read` / `View` | `view_file` |
| `Edit` | `replace_file_content` / `multi_replace_file_content` |
| `Write` | `write_to_file` |
| `TodoWrite` | `implementation_plan.md` / `task.md` |
| `mcp_*` | Native MCP tool execution over stdio JSON-RPC |
