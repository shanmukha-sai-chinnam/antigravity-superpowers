import { initCommand } from "./commands/init.js";
import { checkCommand } from "./commands/check.js";
import { doctorCommand } from "./commands/doctor.js";
import { syncCommand } from "./commands/sync.js";

function helpText() {
  return [
    "antigravity-superpowers",
    "",
    "Usage:",
    "  antigravity-superpowers init [target] [--force] [--global] [--nix] [--mcp] [--hooks]",
    "  antigravity-superpowers check [target]",
    "  antigravity-superpowers doctor [target]",
    "  antigravity-superpowers sync [target] [--global]",
    "",
    "Commands:",
    "  init      Initialize .agents profile in a project (or ~/.gemini/config with --global)",
    "  check     Validate installed Antigravity Superpowers profile integrity",
    "  doctor    Run diagnostic healthcheck on Nix, Herdr, Node, Git, and AGY environment",
    "  sync      Synchronize latest skills and rules without overwriting custom project files",
    "",
    "Options:",
    "  -f, --force    Overwrite existing profile",
    "  -g, --global   Target global configuration (~/.gemini/config)",
    "  -n, --nix      Include template flake.nix and .envrc for Nix developer shell",
    "  -m, --mcp      Provision declarative MCP server configuration (nix-search, git, fs)",
    "      --hooks    Provision lifecycle automation hooks (linting, herdr status, verification)",
    "  -h, --help     Show help",
  ].join("\n");
}

export async function runCli(args, io = process) {
  const [command, ...rest] = args;

  if (!command || command === "-h" || command === "--help" || command === "help") {
    io.stdout.write(`${helpText()}\n`);
    return 0;
  }

  if (command === "init") {
    return initCommand(rest, {
      cwd: io.cwd?.() ?? process.cwd(),
      stdout: io.stdout,
      stderr: io.stderr,
    });
  }

  if (command === "check") {
    return checkCommand(rest, {
      cwd: io.cwd?.() ?? process.cwd(),
      stdout: io.stdout,
      stderr: io.stderr,
    });
  }

  if (command === "doctor") {
    return doctorCommand(rest, {
      cwd: io.cwd?.() ?? process.cwd(),
      stdout: io.stdout,
      stderr: io.stderr,
    });
  }

  if (command === "sync") {
    return syncCommand(rest, {
      cwd: io.cwd?.() ?? process.cwd(),
      stdout: io.stdout,
      stderr: io.stderr,
    });
  }

  io.stderr.write(`Unknown command: ${command}\n\n${helpText()}\n`);
  return 1;
}
