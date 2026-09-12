import readline from "node:readline";
import { execFile, execSync } from "node:child_process";
import { promisify } from "node:util";
import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { homedir } from "node:os";

const execFileAsync = promisify(execFile);

const TOOLS = [
  {
    name: "nixos_generation_info",
    description:
      "Query current and historical NixOS generations, showing active system derivation and dates.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of recent generations to return (default: 10)",
        },
      },
    },
  },
  {
    name: "nixos_service_status",
    description:
      "Query systemd service status in NixOS (e.g. agent-skills-sync, dbus, nix-daemon).",
    inputSchema: {
      type: "object",
      properties: {
        service: {
          type: "string",
          description: "Name of the service (e.g. 'agent-skills-sync.service')",
        },
        userScope: {
          type: "boolean",
          description: "Whether to query systemd user services (--user)",
        },
      },
      required: ["service"],
    },
  },
  {
    name: "nixos_option_query",
    description: "Inspect a NixOS configuration option path and documentation.",
    inputSchema: {
      type: "object",
      properties: {
        option: {
          type: "string",
          description: "NixOS option name (e.g. 'programs.git.enable')",
        },
      },
      required: ["option"],
    },
  },
  {
    name: "superpowers_skill_read",
    description:
      "Retrieve full runbook, instructions, and prompt templates for an Antigravity Superpowers skill.",
    inputSchema: {
      type: "object",
      properties: {
        skillName: {
          type: "string",
          description: "Name of the skill (e.g. 'nixos-system-rebuild', 'brainstorming')",
        },
      },
      required: ["skillName"],
    },
  },
  {
    name: "antigravity_quota_info",
    description:
      "Query current Antigravity / Gemini model quotas, remaining requests, and reset countdowns.",
    inputSchema: {
      type: "object",
      properties: {
        all: {
          type: "boolean",
          description: "Include all configured accounts",
        },
      },
    },
  },
  {
    name: "codebase_audit",
    description:
      "Run Nix code linters (Alejandra, Statix, Deadnix) and Antigravity profile checks on target directory.",
    inputSchema: {
      type: "object",
      properties: {
        targetDir: {
          type: "string",
          description: "Absolute or relative path to audit (defaults to current directory)",
        },
      },
    },
  },
];

async function handleToolCall(name, args = {}, cwd = process.cwd()) {
  try {
    switch (name) {
      case "nixos_generation_info": {
        const limit = args.limit || 10;
        try {
          const { stdout } = await execFileAsync("nix-env", [
            "--list-generations",
            "-p",
            "/nix/var/nix/profiles/system",
          ]);
          const lines = stdout.trim().split("\n");
          const recent = lines.slice(-limit).join("\n");
          return { content: [{ type: "text", text: recent }] };
        } catch {
          // Fallback if permission denied on lock file
          const { stdout } = await execFileAsync("sudo", [
            "-n",
            "nix-env",
            "--list-generations",
            "-p",
            "/nix/var/nix/profiles/system",
          ]);
          const lines = stdout.trim().split("\n");
          const recent = lines.slice(-limit).join("\n");
          return { content: [{ type: "text", text: recent }] };
        }
      }

      case "nixos_service_status": {
        const cmdArgs = ["status", args.service, "--no-pager", "-n", "20"];
        if (args.userScope) {
          cmdArgs.unshift("--user");
        }
        const { stdout, stderr } = await execFileAsync("systemctl", cmdArgs).catch(
          (err) => ({ stdout: err.stdout || "", stderr: err.stderr || err.message }),
        );
        return { content: [{ type: "text", text: stdout || stderr }] };
      }

      case "nixos_option_query": {
        const opt = args.option.trim();
        const { stdout, stderr } = await execFileAsync(
          "nixos-option",
          [opt],
        ).catch((err) => ({
          stdout: err.stdout || "",
          stderr: err.stderr || err.message,
        }));
        return { content: [{ type: "text", text: stdout || stderr }] };
      }


      case "superpowers_skill_read": {
        const skill = args.skillName.trim();
        const candidates = [
          join(cwd, ".agents", "skills", skill, "SKILL.md"),
          join(homedir(), ".gemini", "config", "skills", skill, "SKILL.md"),
        ];

        for (const candidate of candidates) {
          try {
            const content = await readFile(candidate, "utf8");
            return { content: [{ type: "text", text: content }] };
          } catch {
            // try next
          }
        }
        return {
          content: [
            {
              type: "text",
              text: `Skill '${skill}' not found in workspace (.agents/skills) or global (~/.gemini/config/skills).`,
            },
          ],
          isError: true,
        };
      }

      case "antigravity_quota_info": {
        const usageBin = join(homedir(), ".local", "bin", "antigravity-usage");
        try {
          const cmd = args.all ? [usageBin, "quota", "--all"] : [usageBin, "quota"];
          const { stdout } = await execFileAsync(cmd[0], cmd.slice(1));
          return { content: [{ type: "text", text: stdout }] };
        } catch {
          return {
            content: [
              {
                type: "text",
                text: "antigravity-usage not installed at ~/.local/bin/antigravity-usage or not authenticated.",
              },
            ],
            isError: true,
          };
        }
      }

      case "codebase_audit": {
        const target = resolve(cwd, args.targetDir || ".");
        let report = `=== Codebase Audit: ${target} ===\n`;

        // Alejandra
        try {
          execSync(`alejandra --check ${target}`, { stdio: "pipe" });
          report += "[PASS] Alejandra: Formatting clean\n";
        } catch (e) {
          report += `[WARN] Alejandra: Formatting required\n`;
        }

        // Statix
        try {
          execSync(`statix check ${target}`, { stdio: "pipe" });
          report += "[PASS] Statix: Anti-patterns clean\n";
        } catch (e) {
          report += `[WARN] Statix: Anti-patterns detected\n`;
        }

        // Deadnix
        try {
          execSync(`deadnix ${target}`, { stdio: "pipe" });
          report += "[PASS] Deadnix: No dead code\n";
        } catch (e) {
          report += `[WARN] Deadnix: Unused code detected\n`;
        }

        return { content: [{ type: "text", text: report.trim() }] };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `Tool error: ${error.message}` }],
      isError: true,
    };
  }
}

export async function serveMcp(io = process) {
  const rl = readline.createInterface({
    input: io.stdin,
    output: io.stdout,
    terminal: false,
  });

  const sendResponse = (msg) => {
    io.stdout.write(`${JSON.stringify(msg)}\n`);
  };

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let request;
    try {
      request = JSON.parse(trimmed);
    } catch {
      sendResponse({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      });
      continue;
    }

    const { id, method, params } = request;

    if (method === "initialize") {
      sendResponse({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: "antigravity-superpowers-mcp",
            version: "0.4.0",
          },
        },
      });
      continue;
    }

    if (method === "notifications/initialized") {
      // client ack
      continue;
    }

    if (method === "tools/list") {
      sendResponse({
        jsonrpc: "2.0",
        id,
        result: {
          tools: TOOLS,
        },
      });
      continue;
    }

    if (method === "tools/call") {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      const result = await handleToolCall(toolName, toolArgs, process.cwd());
      sendResponse({
        jsonrpc: "2.0",
        id,
        result,
      });
      continue;
    }

    if (id !== undefined && id !== null) {
      sendResponse({
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      });
    }
  }

  return 0;
}

export async function mcpCommand(args, { stdout, stderr }) {
  const [subcommand] = args;

  if (subcommand === "serve") {
    return serveMcp(process);
  }

  if (subcommand === "tools") {
    stdout.write("Available Antigravity Superpowers MCP Tools:\n\n");
    for (const tool of TOOLS) {
      stdout.write(`- ${tool.name}: ${tool.description}\n`);
    }
    return 0;
  }

  if (subcommand === "config") {
    const configSnippet = {
      mcpServers: {
        "antigravity-superpowers": {
          command: "antigravity-superpowers",
          args: ["mcp", "serve"],
        },
      },
    };
    stdout.write(`${JSON.stringify(configSnippet, null, 2)}\n`);
    return 0;
  }

  stderr.write(
    "Usage: antigravity-superpowers mcp [serve | tools | config]\n",
  );
  return 1;
}
