import { execFile, execSync } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";

const execFileAsync = promisify(execFile);

function checkHerdrAvailable() {
  try {
    execSync("which herdr", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function runHerdr(args) {
  return execFileAsync("herdr", args);
}

async function ensureHerdrServerRunning() {
  try {
    const { stdout } = await runHerdr(["status"]);
    if (stdout.includes("status: running")) {
      return true;
    }
  } catch {
    // not running
  }

  // Start background headless server
  try {
    const child = execSync("nohup herdr server > ~/.config/herdr/herdr-server.log 2>&1 &", {
      stdio: "ignore",
    });
    // Give it a brief moment to bind socket
    for (let i = 0; i < 5; i++) {
      try {
        const { stdout } = await runHerdr(["status"]);
        if (stdout.includes("status: running")) return true;
      } catch {
        // retry
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    return true;
  } catch {
    return false;
  }
}

export async function swarmCommand(args, { cwd, stdout, stderr }) {
  const [action, ...flags] = args;

  if (!checkHerdrAvailable()) {
    stderr.write(
      "Error: 'herdr' was not found in PATH. Please install Herdr (https://herdr.dev).\n",
    );
    return 1;
  }

  if (!action || action === "help" || action === "--help") {
    stdout.write(
      [
        "antigravity-superpowers swarm",
        "",
        "Manage multi-agent orchestrator swarms exclusively via Herdr.",
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

  await ensureHerdrServerRunning();

  if (action === "status") {
    try {
      const { stdout: paneListJson } = await runHerdr(["pane", "list"]);
      const parsed = JSON.parse(paneListJson);
      const panes = parsed.result?.panes || [];

      stdout.write(`========================================\n`);
      stdout.write(` Active Herdr Swarm Topology\n`);
      stdout.write(`========================================\n\n`);

      if (panes.length === 0) {
        stdout.write("No active panes detected in Herdr workspace.\n");
      } else {
        for (const p of panes) {
          const title = p.terminal_title || p.label || "terminal";
          const focus = p.focused ? " (FOCUSED)" : "";
          stdout.write(`- Pane [${p.pane_id}] ${title}${focus}\n`);
          stdout.write(`  CWD: ${p.cwd}\n`);
          stdout.write(`  Agent Status: ${p.agent_status || "idle"}\n\n`);
        }
      }

      try {
        const { stdout: agentListJson } = await runHerdr(["agent", "list"]);
        const agentParsed = JSON.parse(agentListJson);
        const agents = agentParsed.result?.agents || [];
        if (agents.length > 0) {
          stdout.write("Active Recognized AI Agents:\n");
          for (const a of agents) {
            stdout.write(`  * ${a.name} (${a.kind}) on ${a.pane_id}: status=${a.state}\n`);
          }
          stdout.write("\n");
        }
      } catch {
        // agent list optional
      }

      try {
        const { stdout: integOut } = await runHerdr(["integration", "status"]);
        stdout.write(`Herdr Agent Integrations:\n${integOut.trim()}\n`);
      } catch {
        // integration list optional
      }

      return 0;
    } catch (err) {
      stderr.write(`Failed to query Herdr status: ${err.message}\n`);
      return 1;
    }
  }

  if (action === "broadcast") {
    const message = flags.join(" ");
    if (!message) {
      stderr.write("Error: Please provide a message to broadcast.\n");
      return 1;
    }

    try {
      const { stdout: paneListJson } = await runHerdr(["pane", "list"]);
      const parsed = JSON.parse(paneListJson);
      const panes = parsed.result?.panes || [];

      if (panes.length === 0) {
        stderr.write("No active Herdr panes to broadcast to.\n");
        return 1;
      }

      for (const p of panes) {
        await runHerdr([
          "pane",
          "send-text",
          p.pane_id,
          `\necho ">>> HERDR SWARM BROADCAST: ${message}"\n`,
        ]);
      }
      stdout.write(`Broadcast delivered to ${panes.length} Herdr pane(s).\n`);
      return 0;
    } catch (err) {
      stderr.write(`Broadcast failed: ${err.message}\n`);
      return 1;
    }
  }

  if (action === "stop") {
    try {
      const { stdout: paneListJson } = await runHerdr(["pane", "list"]);
      const parsed = JSON.parse(paneListJson);
      const panes = parsed.result?.panes || [];

      // Close all but the primary pane
      let closed = 0;
      for (let i = 1; i < panes.length; i++) {
        await runHerdr(["pane", "close", panes[i].pane_id]);
        closed++;
      }
      stdout.write(`Closed ${closed} swarm pane(s). Primary Herdr workspace preserved.\n`);
      return 0;
    } catch (err) {
      stderr.write(`Failed to close swarm panes: ${err.message}\n`);
      return 1;
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

    stdout.write(`Provisioning Herdr Swarm with preset: ${preset} in ${targetDir}...\n`);

    try {
      const { stdout: paneListJson } = await runHerdr(["pane", "list"]);
      const parsed = JSON.parse(paneListJson);
      const panes = parsed.result?.panes || [];

      let primaryPaneId = panes[0]?.pane_id;

      if (!primaryPaneId) {
        stdout.write("Herdr server is running. Launch 'herdr' to open the workspace TUI.\n");
        return 0;
      }

      if (preset === "trio") {
        // 1. Label primary pane as Architect
        await runHerdr(["pane", "rename", primaryPaneId, "Architect (Antigravity Lead)"]);

        // 2. Split right for Watcher (Pane 3)
        const splitWatcher = await runHerdr([
          "pane",
          "split",
          "--direction",
          "right",
          "--cwd",
          targetDir,
          "--env",
          "HERDR_ROLE=monitor",
          "--no-focus",
          primaryPaneId,
        ]);
        let watcherPaneId = null;
        try {
          const wParsed = JSON.parse(splitWatcher.stdout);
          watcherPaneId = wParsed.result?.pane?.pane_id || wParsed.result?.pane_id;
        } catch {
          // ignore
        }

        if (watcherPaneId) {
          await runHerdr(["pane", "rename", watcherPaneId, "Watcher (Continuous Verifier)"]);
          await runHerdr([
            "pane",
            "run",
            watcherPaneId,
            "antigravity-superpowers watch",
          ]);
        }

        // 3. Split down from Architect for Implementer (Pane 2)
        const splitWorker = await runHerdr([
          "pane",
          "split",
          "--direction",
          "down",
          "--cwd",
          targetDir,
          "--env",
          "HERDR_ROLE=implementer",
          "--no-focus",
          primaryPaneId,
        ]);
        let workerPaneId = null;
        try {
          const workerParsed = JSON.parse(splitWorker.stdout);
          workerPaneId = workerParsed.result?.pane?.pane_id || workerParsed.result?.pane_id;
        } catch {
          // ignore
        }

        if (workerPaneId) {
          await runHerdr(["pane", "rename", workerPaneId, "Implementer (Nix DevShell)"]);
          await runHerdr([
            "pane",
            "run",
            workerPaneId,
            "nix develop 2>/dev/null || bash",
          ]);
        }

        stdout.write(`\n[SUCCESS] Herdr Trio Swarm successfully configured!\n`);
        stdout.write(`- Pane [${primaryPaneId}]: Architect (Antigravity Lead)\n`);
        if (workerPaneId) stdout.write(`- Pane [${workerPaneId}]: Implementer (Nix DevShell)\n`);
        if (watcherPaneId) stdout.write(`- Pane [${watcherPaneId}]: Watcher (Continuous Verifier)\n`);
        stdout.write(`\nUse 'herdr' to view the TUI, or 'antigravity-superpowers swarm status'.\n`);
        return 0;
      }

      if (preset === "pair") {
        await runHerdr(["pane", "rename", primaryPaneId, "Architect (Antigravity Lead)"]);
        const splitWorker = await runHerdr([
          "pane",
          "split",
          "--direction",
          "right",
          "--cwd",
          targetDir,
          "--no-focus",
          primaryPaneId,
        ]);
        let workerPaneId = null;
        try {
          const wParsed = JSON.parse(splitWorker.stdout);
          workerPaneId = wParsed.result?.pane?.pane_id || wParsed.result?.pane_id;
        } catch {
          // ignore
        }
        if (workerPaneId) {
          await runHerdr(["pane", "rename", workerPaneId, "Implementer (Worker)"]);
          await runHerdr([
            "pane",
            "run",
            workerPaneId,
            "nix develop 2>/dev/null || bash",
          ]);
        }
        stdout.write(`\n[SUCCESS] Herdr Pair Swarm configured!\n`);
        return 0;
      }

      if (preset === "devops") {
        await runHerdr(["pane", "rename", primaryPaneId, "Sysadmin (NixOS Rebuild)"]);
        const splitJournal = await runHerdr([
          "pane",
          "split",
          "--direction",
          "down",
          "--cwd",
          targetDir,
          "--no-focus",
          primaryPaneId,
        ]);
        let journalPaneId = null;
        try {
          const jParsed = JSON.parse(splitJournal.stdout);
          journalPaneId = jParsed.result?.pane?.pane_id || jParsed.result?.pane_id;
        } catch {
          // ignore
        }
        if (journalPaneId) {
          await runHerdr(["pane", "rename", journalPaneId, "Journal Stream"]);
          await runHerdr([
            "pane",
            "run",
            journalPaneId,
            "journalctl --user -f",
          ]);
        }
        stdout.write(`\n[SUCCESS] Herdr DevOps Swarm configured!\n`);
        return 0;
      }

      stderr.write(`Unknown preset: ${preset}. Supported: trio, pair, devops, review\n`);
      return 1;
    } catch (err) {
      stderr.write(`Failed to provision swarm: ${err.message}\n`);
      return 1;
    }
  }

  stderr.write(`Unknown swarm action: ${action}\n`);
  return 1;
}
