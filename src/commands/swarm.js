import { execFile, execSync } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";

const execFileAsync = promisify(execFile);

function checkMuxAvailable() {
  try {
    execSync("which herdr || which tmux", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function runTmux(args) {
  return execFileAsync("tmux", args);
}

export async function swarmCommand(args, { cwd, stdout, stderr }) {
  const [action, ...flags] = args;

  if (!checkMuxAvailable()) {
    stderr.write(
      "Error: Neither 'herdr' nor 'tmux' was found in PATH. Please install Herdr or tmux.\n",
    );
    return 1;
  }

  const sessionName = "agsp-swarm";

  if (!action || action === "help" || action === "--help") {
    stdout.write(
      [
        "antigravity-superpowers swarm",
        "",
        "Manage multi-agent orchestrator swarms in Herdr / tmux.",
        "",
        "Usage:",
        "  antigravity-superpowers swarm start [--preset trio|pair|devops|review] [--workspace <dir>]",
        "  antigravity-superpowers swarm status",
        "  antigravity-superpowers swarm broadcast <message>",
        "  antigravity-superpowers swarm stop",
        "",
        "Presets:",
        "  trio     Architect (Planning) + Implementer (Nix DevShell) + Watcher (Continuous Verifier)",
        "  pair     Architect + Implementer",
        "  devops   Sysadmin (NixOS Rebuild) + System Journal (journalctl)",
        "  review   Auditor (Linters & Diff) + Test Runner",
        "",
      ].join("\n"),
    );
    return 0;
  }

  if (action === "status") {
    try {
      const { stdout: sessionOut } = await runTmux([
        "list-panes",
        "-t",
        sessionName,
        "-F",
        "Pane #{pane_index} (#{pane_id}): #{pane_title} [#{pane_width}x#{pane_height}] (PID: #{pane_pid})",
      ]);
      stdout.write(`========================================\n`);
      stdout.write(` Active Swarm Session: ${sessionName}\n`);
      stdout.write(`========================================\n\n`);
      stdout.write(`${sessionOut.trim()}\n\n`);

      try {
        const { stdout: herdrOut } = await execFileAsync("herdr", [
          "integration",
          "status",
        ]);
        stdout.write(`Herdr Integration Status:\n${herdrOut.trim()}\n`);
      } catch {
        // Herdr command optional
      }
      return 0;
    } catch {
      stdout.write(
        `No active swarm session found for '${sessionName}'.\nStart one with: antigravity-superpowers swarm start\n`,
      );
      return 0;
    }
  }

  if (action === "broadcast") {
    const message = flags.join(" ");
    if (!message) {
      stderr.write("Error: Please provide a message to broadcast.\n");
      return 1;
    }

    try {
      const { stdout: paneIds } = await runTmux([
        "list-panes",
        "-t",
        sessionName,
        "-F",
        "#{pane_id}",
      ]);
      const panes = paneIds.trim().split("\n");
      for (const pane of panes) {
        await runTmux([
          "send-keys",
          "-t",
          pane,
          `echo ">>> SWARM BROADCAST: ${message}"`,
          "C-m",
        ]);
      }
      stdout.write(`Broadcast sent to ${panes.length} pane(s) in '${sessionName}'.\n`);
      return 0;
    } catch (err) {
      stderr.write(`Failed to broadcast to session '${sessionName}': ${err.message}\n`);
      return 1;
    }
  }

  if (action === "stop") {
    try {
      await runTmux(["kill-session", "-t", sessionName]);
      stdout.write(`Swarm session '${sessionName}' stopped cleanly.\n`);
      return 0;
    } catch (err) {
      stdout.write(`No running swarm session '${sessionName}' found.\n`);
      return 0;
    }
  }

  if (action === "start") {
    let preset = "trio";
    let targetDir = cwd;

    for (let i = 0; i < flags.length; i++) {
      if (flags[i] === "--preset" && flags[i + 1]) {
        preset = flags[i + 1];
        i++;
      } else if (flags[i] === "--workspace" && flags[i + 1]) {
        targetDir = resolve(cwd, flags[i + 1]);
        i++;
      }
    }

    // Check if session already exists
    try {
      await runTmux(["has-session", "-t", sessionName]);
      stdout.write(
        `Swarm session '${sessionName}' is already active.\nRun 'antigravity-superpowers swarm status' or attach with 'tmux attach -t ${sessionName}'.\n`,
      );
      return 0;
    } catch {
      // Session does not exist, proceed
    }

    stdout.write(`Provisioning Herdr Swarm '${sessionName}' with preset: ${preset}...\n`);

    if (preset === "trio") {
      // 1. Create session with Pane 1: Architect
      await runTmux([
        "new-session",
        "-d",
        "-s",
        sessionName,
        "-c",
        targetDir,
        "-n",
        "trio-swarm",
      ]);
      await runTmux([
        "select-pane",
        "-t",
        `${sessionName}:0.0`,
        "-T",
        "Architect (Antigravity Planning)",
      ]);
      await runTmux([
        "send-keys",
        "-t",
        `${sessionName}:0.0`,
        `export HERDR_ROLE=architect; clear; echo '=== PANE 1: ARCHITECT (Antigravity Lead) ==='; echo 'Directory: ${targetDir}'; antigravity-superpowers doctor`,
        "C-m",
      ]);

      // 2. Split horizontally for Pane 3: Monitor (Right)
      await runTmux([
        "split-window",
        "-h",
        "-t",
        `${sessionName}:0.0`,
        "-c",
        targetDir,
      ]);
      await runTmux([
        "select-pane",
        "-t",
        `${sessionName}:0.1`,
        "-T",
        "Watcher (Continuous Verifier)",
      ]);
      await runTmux([
        "send-keys",
        "-t",
        `${sessionName}:0.1`,
        `export HERDR_ROLE=monitor; clear; echo '=== PANE 3: WATCHER ==='; antigravity-superpowers watch`,
        "C-m",
      ]);

      // 3. Split Pane 0 vertically for Pane 2: Implementer (Bottom Left)
      await runTmux([
        "split-window",
        "-v",
        "-t",
        `${sessionName}:0.0`,
        "-c",
        targetDir,
      ]);
      await runTmux([
        "select-pane",
        "-t",
        `${sessionName}:0.1`,
        "-T",
        "Implementer (Nix DevShell)",
      ]);
      await runTmux([
        "send-keys",
        "-t",
        `${sessionName}:0.1`,
        `export HERDR_ROLE=implementer; clear; echo '=== PANE 2: IMPLEMENTER (Worker) ==='; nix develop 2>/dev/null || bash`,
        "C-m",
      ]);

      // Focus back to Pane 0
      await runTmux(["select-pane", "-t", `${sessionName}:0.0`]);
    } else if (preset === "pair") {
      await runTmux([
        "new-session",
        "-d",
        "-s",
        sessionName,
        "-c",
        targetDir,
        "-n",
        "pair-swarm",
      ]);
      await runTmux([
        "select-pane",
        "-t",
        `${sessionName}:0.0`,
        "-T",
        "Architect (Antigravity Lead)",
      ]);
      await runTmux([
        "split-window",
        "-h",
        "-t",
        `${sessionName}:0.0`,
        "-c",
        targetDir,
      ]);
      await runTmux([
        "select-pane",
        "-t",
        `${sessionName}:0.1`,
        "-T",
        "Implementer (Worker)",
      ]);
    } else if (preset === "devops") {
      await runTmux([
        "new-session",
        "-d",
        "-s",
        sessionName,
        "-c",
        targetDir,
        "-n",
        "devops-swarm",
      ]);
      await runTmux([
        "select-pane",
        "-t",
        `${sessionName}:0.0`,
        "-T",
        "Sysadmin (NixOS Rebuild)",
      ]);
      await runTmux([
        "split-window",
        "-v",
        "-t",
        `${sessionName}:0.0`,
        "-c",
        targetDir,
      ]);
      await runTmux([
        "select-pane",
        "-t",
        `${sessionName}:0.1`,
        "-T",
        "Journal & Metrics",
      ]);
      await runTmux([
        "send-keys",
        "-t",
        `${sessionName}:0.1`,
        "journalctl --user -f",
        "C-m",
      ]);
    } else {
      stderr.write(`Unknown preset: ${preset}. Supported: trio, pair, devops, review\n`);
      return 1;
    }

    stdout.write(`\n[SUCCESS] Swarm '${sessionName}' successfully launched!\n`);
    stdout.write(`To attach to the swarm: tmux attach -t ${sessionName} (or 'herdr')\n`);
    stdout.write(`To check status: antigravity-superpowers swarm status\n`);
    return 0;
  }

  stderr.write(`Unknown swarm action: ${action}\n`);
  return 1;
}
