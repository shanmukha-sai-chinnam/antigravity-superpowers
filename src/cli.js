import { initCommand } from "./commands/init.js";
import { checkCommand } from "./commands/check.js";
import { doctorCommand } from "./commands/doctor.js";
import { syncCommand } from "./commands/sync.js";
import { mcpCommand } from "./commands/mcp.js";
import { swarmCommand } from "./commands/swarm.js";
import { watchCommand } from "./commands/watch.js";
import { quotaCommand } from "./commands/quota.js";
import { presetCommand } from "./commands/preset.js";

function helpText() {
  return [
    "antigravity-superpowers",
    "",
    "Usage:",
    "  antigravity-superpowers init [target] [--force] [--global] [--nix] [--mcp] [--hooks]",
    "  antigravity-superpowers check [target]",
    "  antigravity-superpowers doctor [target]",
    "  antigravity-superpowers sync [target] [--global]",
    "  antigravity-superpowers mcp [serve | tools | config]",
    "  antigravity-superpowers swarm [start | status | broadcast | stop]",
    "  antigravity-superpowers watch [target] [--fix] [--test] [--once]",
    "  antigravity-superpowers quota [--json] [--all] [--refresh]",
    "  antigravity-superpowers preset <nixos|web|rust|python> [target]",
    "",
    "Commands:",
    "  init      Initialize .agents profile in a project (or ~/.gemini/config with --global)",
    "  check     Validate installed Antigravity Superpowers profile integrity",
    "  doctor    Run diagnostic healthcheck on Nix, Node, Git, and AGY environment",
    "  sync      Synchronize latest skills and rules without overwriting custom project files",
    "  mcp       Model Context Protocol server (tools for NixOS, Quotas, Skills)",
    "  watch     Continuous filesystem watcher with automated Nix, Shell, and JS linters",
    "  quota     Inspect Antigravity / Gemini token quotas and reset countdowns",
    "  preset    Scaffold full language/stack profile (NixOS, Web, Rust, Python)",
    "",
    "Options:",
    "  -f, --force    Overwrite existing profile",
    "  -g, --global   Target global configuration (~/.gemini/config)",
    "  -n, --nix      Include template flake.nix and .envrc for Nix developer shell",
    "  -m, --mcp      Provision declarative MCP server configuration",
    "      --hooks    Provision lifecycle automation hooks (linting, verification)",
    "  -h, --help     Show help",
  ].join("\n");
}

export async function runCli(args, io = process) {
  const [command, ...rest] = args;

  if (!command || command === "-h" || command === "--help" || command === "help") {
    io.stdout.write(`${helpText()}\n`);
    return 0;
  }

  const context = {
    cwd: io.cwd?.() ?? process.cwd(),
    stdout: io.stdout,
    stderr: io.stderr,
  };

  switch (command) {
    case "init":
      return initCommand(rest, context);
    case "check":
      return checkCommand(rest, context);
    case "doctor":
      return doctorCommand(rest, context);
    case "sync":
      return syncCommand(rest, context);
    case "mcp":
      return mcpCommand(rest, context);
    case "swarm":
      return swarmCommand(rest, context);
    case "watch":
      return watchCommand(rest, context);
    case "quota":
      return quotaCommand(rest, context);
    case "preset":
      return presetCommand(rest, context);
    default:
      io.stderr.write(`Unknown command: ${command}\n\n${helpText()}\n`);
      return 1;
  }
}
