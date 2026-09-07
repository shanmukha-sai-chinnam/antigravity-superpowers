---
name: nixos-system-rebuild
description: Use when modifying NixOS configurations, testing system modules, or executing system switches. Enforces pre-flight checks, 5-stage validation pipeline, generation diffing, and automated rollback.
---

# NixOS System Rebuild & Safe Deployment

Disciplined workflow for safely rebuilding, evaluating, verifying, and activating NixOS systems in NixOS-WSL environments.

**Core Principle:** Always build and diff before switching. Never introduce unmanaged mutable state or commit broken flake configurations.

## The Rebuild Lifecycle

```dot
digraph nixos_rebuild {
    rankdir=TB;
    "Pre-flight Checks" [shape=box];
    "Clean Working Tree?" [shape=diamond];
    "Stash or Commit WIP" [shape=box];
    "Run 5-Stage Validation Pipeline" [shape=box];
    "Validation Passed?" [shape=diamond];
    "Fix Static Violations" [shape=box];
    "Build System Derivation (nixos-rebuild build)" [shape=box];
    "Build Succeeded?" [shape=diamond];
    "Isolate & Debug Derivation Error" [shape=box];
    "Inspect Closure Diff (nvd / diff-closures)" [shape=box];
    "Activate Switch (nixos-rebuild switch)" [shape=box];
    "Verify System & Services" [shape=box];
    "All Services Healthy?" [shape=diamond];
    "Auto-Rollback (nixos-rebuild switch --rollback)" [shape=box style=filled fillcolor=lightcoral];
    "Rebuild Complete" [shape=doublecircle style=filled fillcolor=lightgreen];

    "Pre-flight Checks" -> "Clean Working Tree?";
    "Clean Working Tree?" -> "Stash or Commit WIP" [label="no"];
    "Stash or Commit WIP" -> "Run 5-Stage Validation Pipeline";
    "Clean Working Tree?" -> "Run 5-Stage Validation Pipeline" [label="yes"];
    "Run 5-Stage Validation Pipeline" -> "Validation Passed?";
    "Validation Passed?" -> "Fix Static Violations" [label="no"];
    "Fix Static Violations" -> "Run 5-Stage Validation Pipeline";
    "Validation Passed?" -> "Build System Derivation (nixos-rebuild build)" [label="yes"];
    "Build System Derivation (nixos-rebuild build)" -> "Build Succeeded?";
    "Build Succeeded?" -> "Isolate & Debug Derivation Error" [label="no"];
    "Isolate & Debug Derivation Error" -> "Run 5-Stage Validation Pipeline";
    "Build Succeeded?" -> "Inspect Closure Diff (nvd / diff-closures)" [label="yes"];
    "Inspect Closure Diff (nvd / diff-closures)" -> "Activate Switch (nixos-rebuild switch)";
    "Activate Switch (nixos-rebuild switch)" -> "Verify System & Services";
    "Verify System & Services" -> "All Services Healthy?";
    "All Services Healthy?" -> "Auto-Rollback (nixos-rebuild switch --rollback)" [label="no"];
    "All Services Healthy?" -> "Rebuild Complete" [label="yes"];
}
```

## Phase 1: Pre-flight Checks

1. **Verify Git State**: Nix flakes only see files tracked by Git!
   ```bash
   git status
   ```
   If new files exist, stage them intent-to-add so the Nix evaluator can see them:
   ```bash
   git add -N <new-file>
   ```

2. **Verify Disk Space in Nix Store**:
   ```bash
   df -h /nix
   ```
   If disk usage exceeds 90%, run garbage collection before rebuilding:
   ```bash
   nix-collect-garbage -d
   ```

## Phase 2: 5-Stage Validation Pipeline

Run the validation suite before triggering any system build:

```bash
# 1. Code Formatting
nix fmt -- .

# 2. Anti-pattern Analysis
statix check .

# 3. Dead Code Detection
deadnix .

# 4. Flake Output & Derivation Evaluation
nix flake check --impure

# 5. Pipeline Runner (if available)
bash modules/scripts/validate.sh
```

**Rule:** Every violation must be fixed before proceeding. Do not bypass `--no-check` or force switches on failing evaluations.

## Phase 3: Build Before Switch

Always test compilation without activating:

```bash
sudo nixos-rebuild build --flake .#nixos --show-trace
```

This creates a `./result` symlink pointing to the newly generated system closure in `/nix/store/` without touching running services or switching the boot loader.

## Phase 4: Inspect Closure Diff

Before activating, inspect what packages and versions are changing:

```bash
# Using nvd (if installed):
nvd diff /run/current-system ./result

# Or using native nix store diff:
nix store diff-closures /run/current-system ./result
```

Verify that only expected changes are being introduced.

## Phase 5: Safe Activation & Health Verification

Activate the new configuration:

```bash
sudo nixos-rebuild switch --flake .#nixos
```

Immediately test system health:

```bash
# Check user systemd units
systemctl --user --failed

# Check system systemd units
systemctl --failed

# Check active AI tools & Herdr hooks
herdr integration status
```

## Phase 6: Automated Rollback Procedure

If any critical unit or service fails to activate:

1. **Rollback instantly**:
   ```bash
   sudo nixos-rebuild switch --rollback
   ```
2. **Document failure logs**:
   ```bash
   journalctl -xe --no-pager -n 100
   ```
3. **Diagnose and remediate** using `nix-derivation-debugging` or `systematic-debugging`.
