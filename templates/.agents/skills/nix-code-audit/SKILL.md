---
name: nix-code-audit
description: Use before committing Nix code or when auditing NixOS modules for code quality, formatting, dead declarations, and antipatterns.
---

# Nix Code Quality & Static Audit

Standardized audit workflow for Nix expressions, NixOS modules, and flakes.

## The Triple-Linter Pipeline

Every Nix repository must run and pass three static checks:

```bash
# 1. Opinionated Code Formatter
nix fmt -- .

# 2. Anti-pattern & Idiom Checker
statix check .

# 3. Dead / Unused Declaration Detection
deadnix .
```

## Common Anti-patterns and Remediations

### 1. The `with pkgs;` Scope Pollution
**Bad:**
```nix
environment.systemPackages = with pkgs; [
  git
  vim
];
```
*Why bad:* Obscures package origins, breaks static analysis, and introduces namespace collisions.

**Better:**
```nix
environment.systemPackages = [
  pkgs.git
  pkgs.vim
];
```
*(Exception: Local lists within dedicated `let ... in` bindings or `with pkgs; [...]` in single package arrays where scoped cleanly.)*

### 2. Unneeded `rec` Sets
**Bad:**
```nix
rec {
  a = 1;
  b = 2; # Does not reference 'a'
}
```
*Fix:* Remove `rec` if attributes don't reference other attributes in the same set.

### 3. Redundant `let ... in` Bindings
**Bad:**
```nix
let
  myVal = 123;
in
myVal
```
*Fix:* Simplify directly to `123`.

### 4. Dead / Unused Arguments
**Bad:**
```nix
{ pkgs, lib, config, ... }:
{
  environment.systemPackages = [ pkgs.git ];
}
```
*Fix:* Remove unused arguments (`lib`, `config`).

## Module Option Schema Standards

When writing NixOS or Home Manager modules:

1. Always provide explicit types (`types.bool`, `types.str`, `types.listOf types.package`, `types.submodule`).
2. Use `mkEnableOption "feature name"` for simple booleans.
3. Provide descriptive `description = "..."` on every option.
4. Wrap module configuration blocks in `lib.mkIf cfg.enable { ... }`.
