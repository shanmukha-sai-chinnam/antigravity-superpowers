---
name: nix-flake-management
description: Use when creating, updating, auditing, or refactoring Nix flakes, inputs, overlays, devShells, or package outputs. Enforces lockfile hygiene and reproducibility.
---

# Nix Flake Management

A disciplined guide to authoring, pinning, maintaining, and auditing Nix flakes.

## Flake Schema Architecture

Every well-architected flake adheres to standard output schemas:

```nix
{
  description = "Project Description";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in {
        # 1. Packages
        packages.default = pkgs.callPackage ./package.nix { };

        # 2. Developer Shells
        devShells.default = pkgs.mkShell {
          packages = [ pkgs.git pkgs.ripgrep ];
        };

        # 3. Flake Checks
        checks = {
          default = self.packages.${system}.default;
        };

        # 4. Apps / Executable runners
        apps.default = flake-utils.lib.mkApp {
          drv = self.packages.${system}.default;
        };
      }
    ) // {
      # 5. Overlays (System-independent)
      overlays.default = final: prev: {
        my-project = self.packages.${final.system}.default;
      };

      # 6. NixOS / Home Manager Modules
      nixosModules.default = import ./nixos-module.nix self;
    };
}
```

## Input Management & Hygiene

1. **Deduplicate Dependencies with `follows`**:
   Prevent multiple incompatible versions of nixpkgs from ballooning closure size:
   ```nix
   inputs.my-dep = {
     url = "github:user/repo";
     inputs.nixpkgs.follows = "nixpkgs";
   };
   ```

2. **Selective Input Updates**:
   Do NOT run generic `nix flake update` indiscriminately on complex production environments. Update specific targets:
   ```bash
   nix flake lock --update-input <input-name>
   ```

3. **Verify Lockfile Status**:
   ```bash
   nix flake metadata
   nix flake check
   ```

## Creating Multi-Architecture DevShells

DevShells should be reproducible, minimal, and provide clear shell hooks:

```nix
devShells.default = pkgs.mkShell {
  packages = with pkgs; [
    nodejs_22
    git
    ripgrep
  ];

  env = {
    PROJECT_ENV = "development";
  };

  shellHook = ''
    echo "⚡ Development environment loaded."
  '';
};
```

Pair every devShell with a `.envrc` containing:
```bash
use flake
```

## Pure vs. Impure Boundary Rules

- Flake builds MUST be pure by default. Avoid reading from `/etc`, `~`, or relying on environment variables during evaluation.
- When `--impure` is strictly necessary (e.g. system host paths or proprietary hardware state), isolate the impurity in a dedicated module with explicit documentation.
