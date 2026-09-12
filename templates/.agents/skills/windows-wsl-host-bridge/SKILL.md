---
name: windows-wsl-host-bridge
description: Safe, structured interoperability between NixOS-WSL and the Windows host without polluting either environment. Guides path translation, clipboard bridging, browser launches, Windows Terminal profiles, and remote server lifecycle.
---

# Windows-WSL Host Bridge Runbook

Protocols for bridging the NixOS-WSL guest and the Windows host safely and deterministically.

## Core Directives

1. **WSL-First Rule**: All development, compilers, package installations, and git actions occur inside NixOS-WSL.
2. **Host Bridge Boundary**: The Windows host is only touched for:
   - Launching host web browsers (for OAuth flows or web UI testing).
   - Clipboard synchronization (`clip.exe` or `wl-copy`).
   - Windows Terminal profile integration.
   - Path translations between Windows and Linux formats.
3. **No Direct Host Pollution**: Do not install global Windows binaries or write unmanaged files to `C:\` or `%USERPROFILE%` directly.

## Path Translation (`wslpath`)

Convert paths safely between Linux and Windows format:

```bash
# Convert Linux path to Windows format (UNC format)
wslpath -w /home/damathryxx64/repositories/damathryxx64
# Output: \\wsl.localhost\NixOS\home\damathryxx64\repositories\damathryxx64

# Convert Windows path to Linux mount format
wslpath -u 'C:\Users\shanm\.config'
# Output: /mnt/c/Users/shanm/.config
```

## Clipboard Synchronization

Synchronize clipboard content between NixOS and Windows:

```bash
# Copy from NixOS to Windows Clipboard:
printf '%s' "$TEXT" | /mnt/c/WINDOWS/system32/clip.exe
# Or with wl-copy (if WSLg is active):
printf '%s' "$TEXT" | wl-copy

# Paste from Windows Clipboard into NixOS:
powershell.exe -NoProfile -Command "Get-Clipboard"
# Or with wl-paste:
wl-paste
```

## Launching Windows Host Browser

When an authentication workflow or dev server requires browser verification (such as Google Cloud Code OAuth or web application previews):

```bash
# Launch URL in default Windows host browser:
open_windows_url() {
  local url="$1"
  /mnt/c/WINDOWS/system32/rundll32.exe url.dll,FileProtocolHandler "$url" 2>/dev/null || \
  powershell.exe -NoProfile -Command "Start-Process '$url'"
}

open_windows_url "http://localhost:5173"
```

## Windows Terminal Integration

To launch directly into NixOS-WSL with the Herdr persistent session, configure the Windows Terminal profile (`settings.json`):

```json
{
  "guid": "{58dae4c9-5a10-4e4d-a2f0-63aee93b76a8}",
  "name": "NixOS",
  "commandline": "wsl.exe -d NixOS -u damathryxx64 -e bash -l",
  "startingDirectory": "\\\\wsl.localhost\\NixOS\\home\\damathryxx64\\repositories",
  "font": {
    "face": "Cascadia Code NF",
    "size": 11
  },
  "icon": "ms-appx:///ProfileIcons/{58dae4c9-5a10-4e4d-a2f0-63aee93b76a8}.png"
}
```

## Antigravity IDE Remote WSL Server Lifecycle

Antigravity IDE runs its remote agent server inside NixOS-WSL:
- Server binaries: `~/.antigravity-ide-server/`
- Socket locks: if a session hangs, clean stale sockets:
  ```bash
  rm -f /tmp/antigravity-remote-cli-*.sock
  ```
- Memory check: ensure remote server process has sufficient file descriptors:
  ```bash
  ulimit -n 65536
  ```

## Passing Environment Variables (`WSLENV`)

When passing variables across the WSL boundary:
```bash
# Set in Windows or Linux with conversion flags:
# /p = path translation
# /u = only when invoking from WSL to Win32
# /w = only when invoking from Win32 to WSL
export WSLENV="NODE_ENV:GIT_DIR/p:ANTIGRAVITY_PROFILE"
```
