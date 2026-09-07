---
name: nixos-wsl-interop
description: Deep runbook for managing, diagnosing, and optimizing NixOS inside WSL 2. Enforces filesystem boundaries, systemd lifecycle, memory reclamation, mirrored networking, and WSL kernel configuration.
---

# NixOS-WSL Systems Engineering & Interoperability Runbook

Disciplined administration of NixOS running under the Windows Subsystem for Linux (WSL 2).

## WSL 2 & NixOS Architecture

NixOS-WSL runs as a lightweight virtual machine using a custom Linux kernel maintained by Microsoft, initializing systemd as PID 1 via the `nixos-wsl` module:

```
┌─────────────────────────────────────────────────────────────┐
│ Windows Host (Hyper-V Hypervisor / WSL2 Host)               │
│ Config: C:\Users\<user>\.wslconfig                          │
└──────────────────────────────┬──────────────────────────────┘
                               │ Virtual Machine Bus / 9P / VHDX
┌──────────────────────────────▼──────────────────────────────┐
│ NixOS-WSL Virtual Machine (PID 1: systemd)                   │
│ Config: /etc/nixos/flake.nix & /etc/wsl.conf                │
├──────────────────────────────┬──────────────────────────────┤
│ Native Linux ext4 (vhdx)     │ 9P Host Mounts (/mnt/c)      │
│ - Repositories: ~/repositories│ - Slow I/O (DO NOT USE FOR   │
│ - Nix Store: /nix/store      │   BUILDS OR CODEBASES)       │
└──────────────────────────────┴──────────────────────────────┘
```

## Critical Operational Rules

### 1. The Strict Filesystem Rule
- **ALL repositories, flakes, and build artifacts MUST reside in the Linux filesystem** (`/home/damathryxx64/...`).
- **NEVER** clone repositories into or run compilation from `/mnt/c/...`. The 9P virtual filesystem incurs a 10x-20x latency penalty, breaks inotify file watchers (breaking Antigravity continuous watcher and Vite dev servers), and corrupts git file permissions.

### 2. Global vs. Distribution Configuration
- **Host Configuration (`%USERPROFILE%\.wslconfig`)**:
  Controls VM-wide limits across all WSL distributions:
  ```ini
  [wsl2]
  memory=16GB
  processors=8
  autoMemoryReclaim=dropcache
  networkingMode=mirrored
  dnsTunneling=true
  firewall=true
  autoProxy=true

  [experimental]
  sparseVhd=true
  autoMemoryReclaim=gradual
  ```
- **Distribution Configuration (`/etc/wsl.conf` in NixOS)**:
  Configured declaratively in `modules/configuration.nix` via `wsl.wslConf`:
  ```nix
  wsl = {
    enable = true;
    defaultUser = "damathryxx64";
    interop.includePath = true;
    wslConf = {
      automount.enabled = true;
      interop.appendWindowsPath = true;
      network.generateResolvConf = true;
    };
  };
  ```

## Memory Management & VHDX Compaction

WSL2 allocates memory dynamically up to the configured limit.

### 1. Manual Cache Dropping
If memory consumption is high after intensive Nix derivations:
```bash
sudo sh -c 'echo 3 > /proc/sys/vm/drop_caches'
```

### 2. VHDX Disk Compaction
When extensive builds or garbage collections have run, reclaim disk space on the Windows host:
```powershell
# In Windows PowerShell:
wsl --manage NixOS --compact
```
Alternatively, shut down WSL and optimize via diskpart:
```powershell
wsl --shutdown
diskpart
# select vdisk file="<path-to-ext4.vhdx>"
# compact vdisk
```

## Mirrored Networking & Port Forwarding

In modern WSL (`networkingMode=mirrored`):
- Ports bound to `127.0.0.1` or `0.0.0.0` inside NixOS are immediately accessible on `http://localhost:<port>` on the Windows host.
- If accessing from an external device on the local LAN, add a port proxy on Windows:
  ```powershell
  netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=5173 connectaddress=127.0.0.1 connectport=5173
  ```

## Systemd in NixOS-WSL

NixOS-WSL runs native systemd. Ensure user lingering is enabled for persistent background services:
```bash
loginctl enable-linger damathryxx64
```
Verify user systemd units:
```bash
systemctl --user status herdr-integrations.service
systemctl --user status antigravity-superpowers-sync.service
```

## GUI & Display Integration (WSLg)

WSLg provides native Wayland and X11 display:
- `WAYLAND_DISPLAY`: typically `wayland-0`
- `DISPLAY`: typically `:0`
- Acceleration: `/usr/lib/wsl/lib/libd3d12.so` (mapped into NixOS via `nixos-wsl`)
- Audio: PulseAudio socket mapped via `/mnt/wslg/PulseServer`
