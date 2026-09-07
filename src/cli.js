import { initCommand } from "./commands/init.js";
import { checkCommand } from "./commands/check.js";

function helpText() {
  return [
    "antigravity-superpowers",
    "",
    "Usage:",
    "  antigravity-superpowers init [target-directory] [--force] [--global]",
    "  antigravity-superpowers check [target-directory]",
    "",
    "Commands:",
    "  init      Initialize .agents profile in a project (or ~/.gemini/config with --global)",
    "  check     Validate installed Antigravity Superpowers profile integrity",
    "",
    "Options:",
    "  -f, --force    Overwrite existing .agents directory",
    "  -g, --global   Install globally to ~/.gemini/config",
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

  io.stderr.write(`Unknown command: ${command}\n\n${helpText()}\n`);
  return 1;
}
