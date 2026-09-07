import { execFile, execSync } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { homedir } from "node:os";

const execFileAsync = promisify(execFile);

function findUsageBinary() {
  const defaultLocal = join(homedir(), ".local", "bin", "antigravity-usage");
  try {
    execSync(`test -x "${defaultLocal}"`, { stdio: "ignore" });
    return defaultLocal;
  } catch {
    // continue
  }

  try {
    const bin = execSync("which antigravity-usage", { encoding: "utf8" }).trim();
    if (bin) return bin;
  } catch {
    // continue
  }

  return "npx";
}

export async function quotaCommand(args, { stdout, stderr }) {
  const usageBin = findUsageBinary();
  const cmdArgs = [];

  if (usageBin === "npx") {
    cmdArgs.push("-y", "antigravity-usage");
  }

  cmdArgs.push("quota");

  let isJson = false;

  for (const arg of args) {
    if (arg === "--json") {
      isJson = true;
      cmdArgs.push("--json");
    } else if (arg === "--all") {
      cmdArgs.push("--all");
    } else if (arg === "--refresh") {
      cmdArgs.push("--refresh");
    } else if (arg === "--all-models") {
      cmdArgs.push("--all-models");
    }
  }

  try {
    const { stdout: out, stderr: errOut } = await execFileAsync(usageBin, cmdArgs);
    if (isJson) {
      stdout.write(`${out.trim()}\n`);
    } else {
      stdout.write("========================================\n");
      stdout.write(" Antigravity Model Quota & Usage\n");
      stdout.write("========================================\n\n");
      stdout.write(`${out.trim()}\n\n`);
    }
    return 0;
  } catch (err) {
    const errorOutput = (err.stdout || "") + "\n" + (err.stderr || err.message);

    if (errorOutput.includes("Not logged in") || errorOutput.includes("login")) {
      stderr.write("========================================\n");
      stderr.write(" Antigravity Quota: Authentication Required\n");
      stderr.write("========================================\n\n");
      stderr.write("Status: Not logged in.\n\n");
      stderr.write("To authenticate with Google Cloud Code API:\n");
      stderr.write("  antigravity-usage login --no-browser\n");
      stderr.write("or run in browser if graphical display is available:\n");
      stderr.write("  antigravity-usage login\n\n");
      return 1;
    }

    stderr.write(`Failed to check quota: ${err.message}\n`);
    return 1;
  }
}
