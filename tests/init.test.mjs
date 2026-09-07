import { mkdtemp, mkdir, rm, access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import test from "node:test";
import assert from "node:assert/strict";

const cliPath = resolve(
  process.cwd(),
  "bin/antigravity-superpowers.js",
);

async function pathExists(path) {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function runCli(args, cwd, env = {}) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

async function createTempProject(prefix) {
  const baseTmp = tmpdir();
  await mkdir(baseTmp, { recursive: true });
  return mkdtemp(join(baseTmp, prefix));
}

test("init creates .agents and .agent compatibility symlink in a fresh project", async () => {
  const projectDir = await createTempProject("agsp-fresh-");

  try {
    const result = runCli(["init"], projectDir);
    assert.equal(result.status, 0);

    const hasAgents = await pathExists(join(projectDir, ".agents", "AGENTS.md"));
    assert.equal(hasAgents, true, ".agents/AGENTS.md should exist");

    const hasLegacyAgent = await pathExists(join(projectDir, ".agent", "AGENTS.md"));
    assert.equal(hasLegacyAgent, true, ".agent/AGENTS.md should exist for compatibility");

    const hasHerdrSkill = await pathExists(
      join(projectDir, ".agents", "skills", "herdr", "SKILL.md"),
    );
    assert.equal(hasHerdrSkill, true, "herdr skill should be installed");

    const hasNixSkill = await pathExists(
      join(projectDir, ".agents", "skills", "nixos-system-rebuild", "SKILL.md"),
    );
    assert.equal(hasNixSkill, true, "nixos-system-rebuild skill should be installed");
  } finally {
    await rm(projectDir, { recursive: true, force: true });
  }
});

test("init fails when .agents exists without --force", async () => {
  const projectDir = await createTempProject("agsp-existing-");

  try {
    await mkdir(join(projectDir, ".agents"), { recursive: true });

    const result = runCli(["init"], projectDir);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /already exists/i);
    assert.match(result.stderr, /--force/i);
  } finally {
    await rm(projectDir, { recursive: true, force: true });
  }
});

test("init replaces .agents and .agent with --force", async () => {
  const projectDir = await createTempProject("agsp-force-");

  try {
    await mkdir(join(projectDir, ".agents"), { recursive: true });

    const result = runCli(["init", "--force"], projectDir);
    assert.equal(result.status, 0);

    const hasTemplate = await pathExists(join(projectDir, ".agents", "AGENTS.md"));
    assert.equal(hasTemplate, true);
  } finally {
    await rm(projectDir, { recursive: true, force: true });
  }
});

test("init with --nix, --mcp, and --hooks provisions full toolset", async () => {
  const projectDir = await createTempProject("agsp-full-");

  try {
    const result = runCli(["init", "--nix", "--mcp", "--hooks"], projectDir);
    assert.equal(result.status, 0);

    const hasFlake = await pathExists(join(projectDir, "flake.nix"));
    assert.equal(hasFlake, true, "flake.nix should be created");

    const hasEnvrc = await pathExists(join(projectDir, ".envrc"));
    assert.equal(hasEnvrc, true, ".envrc should be created");

    const hasMcp = await pathExists(join(projectDir, ".agents", "mcp_config.json"));
    assert.equal(hasMcp, true, ".agents/mcp_config.json should be created");

    const hasHooks = await pathExists(join(projectDir, ".agents", "hooks", "hooks.json"));
    assert.equal(hasHooks, true, ".agents/hooks/hooks.json should be created");
  } finally {
    await rm(projectDir, { recursive: true, force: true });
  }
});

test("check command validates initialized project profile", async () => {
  const projectDir = await createTempProject("agsp-check-");

  try {
    const initResult = runCli(["init"], projectDir);
    assert.equal(initResult.status, 0);

    const checkResult = runCli(["check"], projectDir);
    assert.equal(checkResult.status, 0);
  } finally {
    await rm(projectDir, { recursive: true, force: true });
  }
});

test("doctor command executes diagnostic report", async () => {
  const result = runCli(["doctor"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Antigravity Superpowers Doctor/);
  assert.match(result.stdout, /Doctor Summary:/);
});

test("sync command updates skills in existing profile", async () => {
  const projectDir = await createTempProject("agsp-sync-");

  try {
    const initResult = runCli(["init"], projectDir);
    assert.equal(initResult.status, 0);

    // Remove a skill to test syncing
    await rm(join(projectDir, ".agents", "skills", "nixos-system-rebuild"), {
      recursive: true,
      force: true,
    });
    assert.equal(
      await pathExists(join(projectDir, ".agents", "skills", "nixos-system-rebuild")),
      false,
    );

    const syncResult = runCli(["sync"], projectDir);
    assert.equal(syncResult.status, 0);

    assert.equal(
      await pathExists(join(projectDir, ".agents", "skills", "nixos-system-rebuild", "SKILL.md")),
      true,
      "skill should be restored by sync",
    );
  } finally {
    await rm(projectDir, { recursive: true, force: true });
  }
});

test("init --global installs to GEMINI_CONFIG_DIR", async () => {
  const globalDir = await createTempProject("agsp-global-");

  try {
    const result = runCli(["init", "--global", "--mcp", "--hooks"], undefined, {
      GEMINI_CONFIG_DIR: globalDir,
    });
    assert.equal(result.status, 0);

    const hasHerdr = await pathExists(
      join(globalDir, "skills", "herdr", "SKILL.md"),
    );
    assert.equal(hasHerdr, true, "global herdr skill should exist");

    const hasNixSkill = await pathExists(
      join(globalDir, "skills", "nixos-system-rebuild", "SKILL.md"),
    );
    assert.equal(hasNixSkill, true, "global nixos-system-rebuild skill should exist");

    const hasRules = await pathExists(
      join(globalDir, "rules", "workflow-discipline.md"),
    );
    assert.equal(hasRules, true, "global rules should exist");

    const hasMcp = await pathExists(join(globalDir, "mcp_config.json"));
    assert.equal(hasMcp, true, "global mcp_config.json should exist");
  } finally {
    await rm(globalDir, { recursive: true, force: true });
  }
});
