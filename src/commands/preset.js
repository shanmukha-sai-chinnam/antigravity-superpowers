import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { initCommand } from "./init.js";

const PRESETS = {
  nixos: {
    description: "NixOS & Nix flakes development with Alejandra, Statix, Deadnix, and system skills",
    flake: `{
  description = "NixOS Developer Flake";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.\${system};
      in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            git
            ripgrep
            alejandra
            statix
            deadnix
            nvd
            shellcheck
            shfmt
          ];
        };
        formatter = pkgs.alejandra;
      });
}
`,
  },
  web: {
    description: "Modern Web & TypeScript development with Node 22, Prettier, and MCP tools",
    flake: `{
  description = "Web & TypeScript Developer Flake";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.\${system};
      in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_22
            corepack
            git
            ripgrep
          ];
        };
      });
}
`,
  },
  rust: {
    description: "Systems programming with Rust, Cargo, Clippy, rust-analyzer, and TDD skills",
    flake: `{
  description = "Rust Systems Developer Flake";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.\${system};
      in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            rustc
            cargo
            clippy
            rustfmt
            rust-analyzer
            git
          ];
        };
      });
}
`,
  },
  python: {
    description: "Python AI & systems development with Python 3.12, UV, Pyright, and Ruff",
    flake: `{
  description = "Python AI Developer Flake";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.\${system};
      in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            python312Full
            uv
            pyright
            ruff
            git
          ];
        };
      });
}
`,
  },
};

export async function presetCommand(args, { cwd, stdout, stderr }) {
  const [presetName, ...rest] = args;

  if (!presetName || presetName === "help" || presetName === "--help") {
    stdout.write("antigravity-superpowers preset <name> [target]\n\n");
    stdout.write("Available Presets:\n\n");
    for (const [name, info] of Object.entries(PRESETS)) {
      stdout.write(`- ${name}: ${info.description}\n`);
    }
    return 0;
  }

  const preset = PRESETS[presetName];
  if (!preset) {
    stderr.write(`Unknown preset: ${presetName}\n`);
    stderr.write(`Supported presets: ${Object.keys(PRESETS).join(", ")}\n`);
    return 1;
  }

  let targetDir = cwd;
  let force = false;

  for (const arg of rest) {
    if (arg === "-f" || arg === "--force") {
      force = true;
    } else if (!arg.startsWith("-")) {
      targetDir = resolve(cwd, arg);
    }
  }

  stdout.write(`Applying preset '${presetName}' to ${targetDir}...\n`);

  // 1. Initialize profile with --nix, --mcp, --hooks
  const initArgs = [targetDir, "--nix", "--mcp", "--hooks"];
  if (force) initArgs.push("--force");

  const initExit = await initCommand(initArgs, { cwd, stdout, stderr });
  if (initExit !== 0) {
    return initExit;
  }

  // 2. Overwrite flake.nix with preset-specific flake
  const flakePath = join(targetDir, "flake.nix");
  await writeFile(flakePath, preset.flake, "utf8");
  stdout.write(`Configured preset flake: ${flakePath}\n`);

  stdout.write(`\n[SUCCESS] Preset '${presetName}' ready at ${targetDir}!\n`);
  stdout.write("Next steps:\n");
  stdout.write("  direnv allow           # Enable dev environment\n");
  stdout.write("  nix develop            # Or enter shell manually\n");
  stdout.write("  antigravity-superpowers doctor\n");

  return 0;
}
