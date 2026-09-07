import { access, cp, mkdir, readdir, lstat, rm } from "node:fs/promises";
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

async function copyDirectoryOverwritingSymlinks(src, dest) {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    try {
      const destStat = await lstat(destPath);
      if (destStat.isSymbolicLink() || (destStat.isDirectory() && entry.isDirectory())) {
        await rm(destPath, { recursive: true, force: true });
      }
    } catch {
      // destPath does not exist, safe to copy
    }
    await cp(srcPath, destPath, { recursive: true });
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
      await copyDirectoryOverwritingSymlinks(join(templateDir, "skills"), join(globalConfigDir, "skills"));
      await copyDirectoryOverwritingSymlinks(join(templateDir, "rules"), join(globalConfigDir, "rules"));
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
    await copyDirectoryOverwritingSymlinks(join(templateDir, "skills"), join(agentsDir, "skills"));
    await copyDirectoryOverwritingSymlinks(join(templateDir, "rules"), join(agentsDir, "rules"));
    await copyDirectoryOverwritingSymlinks(join(templateDir, "workflows"), join(agentsDir, "workflows"));
    await copyDirectoryOverwritingSymlinks(join(templateDir, "tests"), join(agentsDir, "tests"));

    // Sync MCP templates and hooks if they exist in template
    if (await exists(join(templateDir, "mcp"))) {
      await copyDirectoryOverwritingSymlinks(join(templateDir, "mcp"), join(agentsDir, "mcp"));
    }
    if (await exists(join(templateDir, "hooks"))) {
      await copyDirectoryOverwritingSymlinks(join(templateDir, "hooks"), join(agentsDir, "hooks"));
    }

    stdout.write(`✅ Successfully synchronized Antigravity Superpowers profile at ${agentsDir}\n`);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    stderr.write(`Sync failed: ${message}\n`);
    return 1;
  }
}
