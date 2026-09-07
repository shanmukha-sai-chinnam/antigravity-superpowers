import { access, cp, mkdir } from "node:fs/promises";
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

export async function syncCommand(args, { cwd, stdout, stderr }) {
  const isGlobal = args.includes("--global") || args.includes("-g");
  const templateDir = getTemplateDir();

  if (!(await exists(templateDir))) {
    stderr.write("Error: Bundled templates are missing.\n");
    return 1;
  }

  if (isGlobal) {
    const globalConfigDir = process.env.GEMINI_CONFIG_DIR || join(homedir(), ".gemini", "config");
    try {
      await mkdir(globalConfigDir, { recursive: true });
      await cp(join(templateDir, "skills"), join(globalConfigDir, "skills"), { recursive: true });
      await cp(join(templateDir, "rules"), join(globalConfigDir, "rules"), { recursive: true });
      stdout.write(`✅ Successfully synchronized Antigravity Superpowers into ${globalConfigDir}\n`);
      return 0;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      stderr.write(`Sync failed: ${message}\n`);
      return 1;
    }
  }

  const targetDir = resolve(cwd, args.find((a) => !a.startsWith("-")) || ".");
  const agentsDir = join(targetDir, ".agents");

  if (!(await exists(agentsDir))) {
    stderr.write(`Error: No .agents directory found at ${agentsDir}. Run 'init' first.\n`);
    return 1;
  }

  try {
    // Sync skills, rules, workflows, and test suites
    await cp(join(templateDir, "skills"), join(agentsDir, "skills"), { recursive: true });
    await cp(join(templateDir, "rules"), join(agentsDir, "rules"), { recursive: true });
    await cp(join(templateDir, "workflows"), join(agentsDir, "workflows"), { recursive: true });
    await cp(join(templateDir, "tests"), join(agentsDir, "tests"), { recursive: true });

    // Sync MCP templates and hooks if they exist in template
    if (await exists(join(templateDir, "mcp"))) {
      await cp(join(templateDir, "mcp"), join(agentsDir, "mcp"), { recursive: true });
    }
    if (await exists(join(templateDir, "hooks"))) {
      await cp(join(templateDir, "hooks"), join(agentsDir, "hooks"), { recursive: true });
    }

    stdout.write(`✅ Successfully synchronized Antigravity Superpowers profile at ${agentsDir}\n`);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    stderr.write(`Sync failed: ${message}\n`);
    return 1;
  }
}
