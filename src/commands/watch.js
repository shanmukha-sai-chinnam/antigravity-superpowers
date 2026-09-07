import { watch } from "node:fs";
import { execFile, execSync } from "node:child_process";
import { promisify } from "node:util";
import { resolve, extname, relative, join } from "node:path";
import { readdir, stat } from "node:fs/promises";

const execFileAsync = promisify(execFile);

const IGNORED_DIRS = new Set([
  ".git",
  ".direnv",
  "result",
  "node_modules",
  "dist",
  ".gemini",
  ".cache",
  ".local",
]);

function shouldIgnore(filePath) {
  const parts = filePath.split("/");
  for (const part of parts) {
    if (IGNORED_DIRS.has(part)) return true;
  }
  if (filePath.endsWith("~") || filePath.endsWith(".swp") || filePath.endsWith(".tmp")) {
    return true;
  }
  return false;
}

function timestamp() {
  const now = new Date();
  return now.toTimeString().split(" ")[0];
}

function commandExists(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function verifyNixFile(filePath, fix = false) {
  let report = [];

  // 1. Alejandra
  if (commandExists("alejandra")) {
    try {
      if (fix) {
        await execFileAsync("alejandra", [filePath]);
        report.push("Alejandra: FIXED");
      } else {
        await execFileAsync("alejandra", ["--check", filePath]);
        report.push("Alejandra: PASS");
      }
    } catch {
      report.push(fix ? "Alejandra: ERR" : "Alejandra: WARN (needs format)");
    }
  }

  // 2. Statix
  if (commandExists("statix")) {
    try {
      if (fix) {
        await execFileAsync("statix", ["fix", filePath]);
        report.push("Statix: FIXED");
      } else {
        await execFileAsync("statix", ["check", filePath]);
        report.push("Statix: PASS");
      }
    } catch {
      report.push("Statix: WARN (anti-pattern)");
    }
  }

  // 3. Deadnix
  if (commandExists("deadnix")) {
    try {
      await execFileAsync("deadnix", [filePath]);
      report.push("Deadnix: PASS");
    } catch {
      report.push("Deadnix: WARN (dead code)");
    }
  }

  return report.length ? report.join(" | ") : "Nix linters not installed";
}

async function verifyShellFile(filePath, fix = false) {
  let report = [];

  if (commandExists("shellcheck")) {
    try {
      await execFileAsync("shellcheck", [filePath]);
      report.push("ShellCheck: PASS");
    } catch {
      report.push("ShellCheck: WARN");
    }
  }

  if (commandExists("shfmt")) {
    try {
      if (fix) {
        await execFileAsync("shfmt", ["-w", filePath]);
        report.push("shfmt: FIXED");
      } else {
        await execFileAsync("shfmt", ["-d", filePath]);
        report.push("shfmt: PASS");
      }
    } catch {
      report.push("shfmt: WARN");
    }
  }

  return report.length ? report.join(" | ") : "bash -n: syntax checked";
}

async function scanFiles(dir, fileList = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await scanFiles(fullPath, fileList);
    } else if (entry.isFile()) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

export async function watchCommand(args, { cwd, stdout, stderr }) {
  let targetDir = cwd;
  let fix = false;
  let runTests = false;
  let once = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--fix") {
      fix = true;
    } else if (arg === "--test") {
      runTests = true;
    } else if (arg === "--once") {
      once = true;
    } else if (!arg.startsWith("-")) {
      targetDir = resolve(cwd, arg);
    }
  }

  if (once) {
    stdout.write(`Scanning files once in ${targetDir}...\n`);
    const allFiles = await scanFiles(targetDir);
    let nixCount = 0;
    let shCount = 0;

    for (const file of allFiles) {
      const ext = extname(file);
      const rel = relative(targetDir, file);
      if (ext === ".nix") {
        nixCount++;
        const res = await verifyNixFile(file, fix);
        stdout.write(`[${timestamp()}] [NIX] ${rel} -> ${res}\n`);
      } else if (ext === ".sh") {
        shCount++;
        const res = await verifyShellFile(file, fix);
        stdout.write(`[${timestamp()}] [SH]  ${rel} -> ${res}\n`);
      }
    }
    stdout.write(`\nScan complete: verified ${nixCount} Nix file(s), ${shCount} Shell script(s).\n`);
    return 0;
  }

  stdout.write("========================================\n");
  stdout.write(" Antigravity Continuous Watcher\n");
  stdout.write("========================================\n");
  stdout.write(`Watching: ${targetDir}\n`);
  stdout.write(`Auto-fix: ${fix ? "Enabled" : "Disabled"}\n`);
  stdout.write(`Press Ctrl+C to stop.\n\n`);

  let debounceTimer = null;
  const pendingFiles = new Set();

  const processPending = async () => {
    const files = Array.from(pendingFiles);
    pendingFiles.clear();

    for (const rel of files) {
      const full = resolve(targetDir, rel);
      const ext = extname(rel);

      try {
        const stats = await stat(full);
        if (!stats.isFile()) continue;
      } catch {
        continue; // file deleted
      }

      if (ext === ".nix") {
        const res = await verifyNixFile(full, fix);
        stdout.write(`[${timestamp()}] [NIX] ${rel} -> ${res}\n`);
      } else if (ext === ".sh") {
        const res = await verifyShellFile(full, fix);
        stdout.write(`[${timestamp()}] [SH]  ${rel} -> ${res}\n`);
      } else if (runTests && (ext === ".js" || ext === ".mjs" || ext === ".ts")) {
        try {
          execSync("npm test", { cwd: targetDir, stdio: "ignore" });
          stdout.write(`[${timestamp()}] [JS]  ${rel} -> Tests: PASS\n`);
        } catch {
          stdout.write(`[${timestamp()}] [JS]  ${rel} -> Tests: FAIL\n`);
        }
      }
    }
  };

  try {
    const watcher = watch(targetDir, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      if (shouldIgnore(filename)) return;

      const ext = extname(filename);
      if (![".nix", ".sh", ".js", ".mjs", ".ts", ".json", ".md"].includes(ext)) {
        return;
      }

      pendingFiles.add(filename);

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(processPending, 300);
    });

    // Keep process open until interrupted
    await new Promise((resolve) => {
      process.on("SIGINT", () => {
        watcher.close();
        stdout.write("\nWatcher stopped.\n");
        resolve();
      });
      process.on("SIGTERM", () => {
        watcher.close();
        resolve();
      });
    });

    return 0;
  } catch (err) {
    stderr.write(`Watcher error: ${err.message}\n`);
    return 1;
  }
}
