import { access, cp, rm, stat, symlink, mkdir } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

function getTemplateDir() {
  return fileURLToPath(new URL("../../templates/.agents", import.meta.url));
}

async function exists(path) {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function parseInitArgs(args) {
  const parsed = {
    target: ".",
    force: false,
    global: false,
  };
  let targetSet = false;

  for (const arg of args) {
    if (arg === "--force" || arg === "-f") {
      parsed.force = true;
      continue;
    }

    if (arg === "--global" || arg === "-g") {
      parsed.global = true;
      continue;
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option for init: ${arg}`);
    }

    if (targetSet) {
      throw new Error("Too many positional arguments. Only one target directory is supported.");
    }

    parsed.target = arg;
    targetSet = true;
  }

  return parsed;
}

async function validateTargetDir(targetDir) {
  let targetStat;
  try {
    targetStat = await stat(targetDir);
  } catch {
    throw new Error(`Target directory does not exist: ${targetDir}`);
  }

  if (!targetStat.isDirectory()) {
    throw new Error(`Target path is not a directory: ${targetDir}`);
  }
}

export async function initCommand(args, { cwd, stdout, stderr }) {
  let parsed;
  try {
    parsed = parseInitArgs(args);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    stderr.write(`${message}\n`);
    return 1;
  }

  const templateDir = getTemplateDir();
  const templateExists = await exists(templateDir);
  if (!templateExists) {
    stderr.write(
      "Bundled template is missing. Run `npm run sync:template` before using init from source.\n",
    );
    return 1;
  }

  if (parsed.global) {
    const globalConfigDir = process.env.GEMINI_CONFIG_DIR || join(homedir(), ".gemini", "config");
    try {
      await mkdir(globalConfigDir, { recursive: true });
      const skillsSrc = join(templateDir, "skills");
      const rulesSrc = join(templateDir, "rules");

      if (await exists(skillsSrc)) {
        await cp(skillsSrc, join(globalConfigDir, "skills"), { recursive: true });
      }
      if (await exists(rulesSrc)) {
        await cp(rulesSrc, join(globalConfigDir, "rules"), { recursive: true });
      }
      stdout.write(`Installed Antigravity Superpowers globally at ${globalConfigDir}\n`);
      return 0;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      stderr.write(`Global init failed: ${message}\n`);
      return 1;
    }
  }

  const targetDir = resolve(cwd, parsed.target);
  const agentsDir = join(targetDir, ".agents");
  const legacyAgentDir = join(targetDir, ".agent");

  try {
    await validateTargetDir(targetDir);

    const agentsExists = await exists(agentsDir);
    const legacyExists = await exists(legacyAgentDir);

    if ((agentsExists || legacyExists) && !parsed.force) {
      stderr.write(
        `.agents already exists at ${agentsDir}. Re-run with --force to replace it.\n`,
      );
      return 1;
    }

    if (agentsExists && parsed.force) {
      await rm(agentsDir, { recursive: true, force: true });
    }
    if (legacyExists && parsed.force) {
      await rm(legacyAgentDir, { recursive: true, force: true });
    }

    await cp(templateDir, agentsDir, { recursive: true });

    // Provide .agent backward-compatibility symlink
    try {
      await symlink(".agents", legacyAgentDir, "dir");
    } catch {
      // If symlinking fails (e.g. host permission constraints), copy as fallback
      await cp(agentsDir, legacyAgentDir, { recursive: true });
    }

    stdout.write(`Initialized Antigravity Superpowers profile at ${agentsDir}\n`);
    stdout.write("Next step: bash .agents/tests/run-tests.sh\n");
    stdout.write(
      "Note: docs/plans/task.md is created at runtime by skills when task tracking starts.\n",
    );
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    stderr.write(`Init failed: ${message}\n`);
    return 1;
  }
}
