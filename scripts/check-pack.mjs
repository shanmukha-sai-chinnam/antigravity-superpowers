import { execFileSync } from "node:child_process";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";

const raw = execFileSync("npm", ["pack", "--json"], {
  cwd: process.cwd(),
  encoding: "utf8",
});
const packResult = JSON.parse(raw);

if (!Array.isArray(packResult) || packResult.length === 0) {
  throw new Error("npm pack did not return package metadata");
}

const [{ filename, files }] = packResult;
if (!filename || !Array.isArray(files)) {
  throw new Error("npm pack output is missing filename or files");
}

const packagedPaths = new Set(files.map((file) => file.path));
const required = [
  "bin/antigravity-superpowers.js",
  "src/cli.js",
  "src/commands/init.js",
  "templates/.agents/AGENTS.md",
  "templates/.agents/rules/workflow-discipline.md",
  "templates/.agents/INSTALL.md",
  "templates/.agents/task.md",
  "templates/.agents/workflows/brainstorm.md",
  "templates/.agents/workflows/write-plan.md",
  "templates/.agents/workflows/execute-plan.md",
  "templates/.agents/agents/code-reviewer.md",
  "templates/.agents/tests/run-tests.sh",
  "templates/.agents/tests/check-antigravity-profile.sh",
  "templates/.agents/skills/single-flow-task-execution/SKILL.md",
  "templates/.agents/skills/single-flow-task-execution/implementer-prompt.md",
  "templates/.agents/skills/single-flow-task-execution/spec-reviewer-prompt.md",
  "templates/.agents/skills/single-flow-task-execution/code-quality-reviewer-prompt.md",
  "templates/.agents/skills/executing-plans/SKILL.md",
  "templates/.agents/skills/verification-before-completion/SKILL.md",
  "templates/.agents/skills/writing-plans/SKILL.md",
  "templates/.agents/skills/test-driven-development/SKILL.md",
  "templates/.agents/skills/herdr/SKILL.md",
];

const missing = required.filter((path) => !packagedPaths.has(path));
if (missing.length > 0) {
  throw new Error(
    `Packaged tarball is missing required files: ${missing.join(", ")}`,
  );
}

await rm(resolve(process.cwd(), filename), { force: true });

process.stdout.write("Pack smoke check passed.\n");
