---
name: nix-derivation-debugging
description: Use when diagnosing failing Nix builds, compilation errors, missing shared libraries, or packaging issues. Guides stdenv phase isolation, patchelf/rpath resolution, and wrapProgram wrappers.
---

# Nix Derivation Debugging

Systematic approach to debugging failing Nix derivations, build phases, dynamic linker errors, and missing runtime assets.

## The Stdenv Build Phases

Every standard Nix build progresses through sequential phases:

| Phase | Purpose | Common Failures & Fixes |
| :--- | :--- | :--- |
| `unpackPhase` | Unpacks source tarball or copies Git tree | Dirty working tree, files not tracked in Git (`git add -N`) |
| `patchPhase` | Applies patches, fixes shebangs | Hardcoded `/bin/bash` or `/usr/bin/env` (`patchShebangs .`) |
| `configurePhase` | Runs `./configure` or CMake/Meson | Missing `nativeBuildInputs` (e.g. `pkg-config`, `cmake`) |
| `buildPhase` | Compiles sources (`make`, `cargo build`) | Missing headers, wrong compiler flags |
| `installPhase` | Copies artifacts into `$out` | Missing `$out` directory (`mkdir -p $out/bin`), wrong paths |
| `fixupPhase` | Shrinks rpaths, strips binaries, patchelf | Unresolved dynamic libraries, invalid ELF rpaths |

## Phase 1: Inspect Build Logs

Always fetch the complete build failure log:

```bash
# Build with full trace
nix build .#package --show-trace --print-build-logs

# Or inspect previous failed build log
nix log /nix/store/<hash>-package-name.drv
```

## Phase 2: Debugging the Top 4 Nix Build Issues

### 1. Hardcoded Shebangs (`/bin/bash` / `/usr/bin/env: No such file`)
NixOS does not have `/bin/bash` or `/usr/bin`. Scripts must be patched.

**Fix:**
```nix
postPatch = ''
  patchShebangs scripts/ bin/
'';
```

### 2. Missing Build Tools vs. Runtime Dependencies
- **`nativeBuildInputs`**: Tools needed at BUILD time on the build machine (e.g. `pkg-config`, `cmake`, `makeWrapper`, `nodejs`).
- **`buildInputs`**: Libraries needed at RUNTIME or linked into the executable (e.g. `openssl`, `zlib`, `glibc`).

### 3. Missing Dynamic Libraries at Runtime (`cannot open shared object file`)
Binaries built outside NixOS or compiled dynamically cannot find shared libraries in standard paths like `/usr/lib`.

**Fix with `autoPatchelfHook`:**
```nix
nativeBuildInputs = [ pkgs.autoPatchelfHook ];
buildInputs = [ pkgs.zlib pkgs.libGL pkgs.xorg.libX11 ];
```

**Manual `patchelf` injection:**
```nix
postFixup = ''
  patchelf --add-rpath "${pkgs.lib.makeLibraryPath [ pkgs.zlib ]}" $out/bin/my-binary
'';
```

### 4. Missing PATH or Environment in Wrappers
Executables that call other CLI tools (e.g. git, curl, ripgrep) need wrapped PATHs.

**Fix with `makeWrapper`:**
```nix
nativeBuildInputs = [ pkgs.makeWrapper ];

postInstall = ''
  wrapProgram $out/bin/my-app \
    --prefix PATH : ${pkgs.lib.makeBinPath [ pkgs.git pkgs.ripgrep pkgs.bash ]} \
    --set APP_ENV "production"
'';
```

## Phase 3: Interactive Breakpoint Debugging

When a build fails cryptically, enter the build environment interactively:

```bash
nix develop .#package
```

Once in the environment, run individual phases manually:

```bash
unpackPhase
cd $sourceRoot
patchPhase
configurePhase
buildPhase
```

Inspect compiler errors, test flag adjustments, and verify fixes in real time.
