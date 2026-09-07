import { spawnSync } from "node:child_process";
import { access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

async function exists(path) {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function runCheck(cmd, args) {
  try {
    const res = spawnSync(cmd, args, { encoding: "utf8" });
    return { ok: res.status === 0, output: (res.stdout || res.stderr || "").trim() };
  } catch (err) {
    return { ok: false, output: err.message };
  }
}

export async function doctorCommand(args, { cwd, stdout, stderr }) {
  stdout.write("========================================\n");
  stdout.write(" Antigravity Superpowers Doctor\n");
  stdout.write("========================================\n\n");

  let passes = 0;
  let warnings = 0;
  let failures = 0;

  function report(status, label, detail) {
    if (status === "PASS") {
      stdout.write(`  [PASS] ${label}: ${detail}\n`);
      passes++;
    } else if (status === "WARN") {
      stdout.write(`  [WARN] ${label}: ${detail}\n`);
      warnings++;
    } else {
      stderr.write(`  [FAIL] ${label}: ${detail}\n`);
      failures++;
    }
  }

  // 1. Node.js environment
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split(".")[0], 10);
  if (major >= 20) {
    report("PASS", "Node.js Runtime", `${nodeVersion} (Supported >=20)`);
  } else {
    report("FAIL", "Node.js Runtime", `${nodeVersion} (Requires >=20)`);
  }

  // 2. Git Identity
  const gitUser = runCheck("git", ["config", "user.name"]);
  const gitEmail = runCheck("git", ["config", "user.email"]);
  if (gitUser.ok && gitEmail.ok && gitUser.output && gitEmail.output) {
    report("PASS", "Git Author Identity", `${gitUser.output} <${gitEmail.output}>`);
  } else {
    report("WARN", "Git Author Identity", "Git user.name or user.email not configured");
  }

  // 3. Nix Environment
  const nixCheck = runCheck("nix", ["--version"]);
  if (nixCheck.ok) {
    report("PASS", "Nix Toolchain", nixCheck.output);
  } else {
    report("WARN", "Nix Toolchain", "Nix not found in PATH");
  }

  // 4. Herdr Multiplexer
  const herdrCheck = runCheck("herdr", ["--version"]);
  if (herdrCheck.ok) {
    report("PASS", "Herdr Multiplexer", herdrCheck.output);
    const herdrIntegrations = runCheck("herdr", ["integration", "status"]);
    if (herdrIntegrations.ok) {
      report("PASS", "Herdr Agent Hooks", "Agent integrations active");
    } else {
      report("WARN", "Herdr Agent Hooks", "Run 'herdr integration install' to register hooks");
    }
  } else {
    report("WARN", "Herdr Multiplexer", "Herdr not installed (multi-agent swarms disabled)");
  }

  // 5. Antigravity / Gemini CLI
  const agyCheck = runCheck("antigravity-cli", ["--version"]);
  const geminiCheck = runCheck("gemini-cli", ["--version"]);
  if (agyCheck.ok) {
    report("PASS", "Antigravity CLI", agyCheck.output);
  } else if (geminiCheck.ok) {
    report("PASS", "Gemini CLI", geminiCheck.output);
  } else {
    report("WARN", "AI Agent CLI", "Neither antigravity-cli nor gemini-cli found in PATH");
  }

  // 6. Target Project Profile
  const targetDir = resolve(cwd, args[0] || ".");
  const agentsDir = join(targetDir, ".agents");
  const globalConfigDir = process.env.GEMINI_CONFIG_DIR || join(homedir(), ".gemini", "config");

  if (await exists(join(agentsDir, "AGENTS.md"))) {
    report("PASS", "Workspace Profile", `Active at ${agentsDir}`);
  } else if (await exists(join(globalConfigDir, "skills", "using-superpowers"))) {
    report("PASS", "Global Profile", `Active at ${globalConfigDir}`);
  } else {
    report("WARN", "Superpowers Profile", "No .agents profile found in target (run 'init' to scaffold)");
  }

  stdout.write("\n========================================\n");
  stdout.write(` Doctor Summary: ${passes} Passed, ${warnings} Warnings, ${failures} Failures\n`);
  stdout.write("========================================\n\n");

  return failures > 0 ? 1 : 0;
}
