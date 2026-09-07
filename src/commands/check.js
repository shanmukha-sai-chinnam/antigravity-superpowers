import { spawnSync } from "node:child_process";
import { access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { join, resolve } from "node:path";

async function exists(path) {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function checkCommand(args, { cwd, stdout, stderr }) {
  const targetDir = resolve(cwd, args[0] || ".");
  const scriptInAgents = join(targetDir, ".agents", "tests", "check-antigravity-profile.sh");
  const scriptInAgent = join(targetDir, ".agent", "tests", "check-antigravity-profile.sh");

  let testScript = scriptInAgents;
  if (!(await exists(scriptInAgents))) {
    if (await exists(scriptInAgent)) {
      testScript = scriptInAgent;
    } else {
      stderr.write(
        `Error: Could not find check-antigravity-profile.sh in ${join(targetDir, ".agents")} or ${join(targetDir, ".agent")}\n`,
      );
      return 1;
    }
  }

  const result = spawnSync("bash", [testScript], {
    cwd: targetDir,
    stdio: "inherit",
  });

  return result.status ?? 1;
}
