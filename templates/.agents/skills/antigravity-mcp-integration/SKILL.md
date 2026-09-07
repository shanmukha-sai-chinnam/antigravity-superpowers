---
name: antigravity-mcp-integration
description: Use when configuring, developing, debugging, or invoking Model Context Protocol (MCP) servers in Antigravity or Herdr. Guides STDIO JSON-RPC 2.0 tool schemas, resource templating, and server diagnostics.
---

# Antigravity Model Context Protocol (MCP) Integration Runbook

Connect AI coding agents to external developer tools, systems, and telemetry using the Model Context Protocol.

## Architecture

Model Context Protocol (MCP) exposes tools, resources, and prompt templates over standard I/O using JSON-RPC 2.0:

```
┌────────────────────────────────────────┐
│ Antigravity / Gemini / Herdr Agent     │
└───────────────────┬────────────────────┘
                    │ JSON-RPC 2.0 (stdio)
┌───────────────────▼────────────────────┐
│ Antigravity Superpowers MCP Server     │
│ (`antigravity-superpowers mcp serve`)  │
├───────────────────┬────────────────────┤
│ NixOS Tools       │ Herdr Mux          │
│ - nixos_options   │ - herdr_pane_list  │
│ - nixos_diff      │ - herdr_send_cmd   │
│ - nixos_service   │ - quota_info       │
└───────────────────┴────────────────────┘
```

## Quick Configuration

### 1. Workspace Configuration
Add the server to `.agents/mcp/mcp_config.json`:
```json
{
  "mcpServers": {
    "antigravity-superpowers": {
      "command": "antigravity-superpowers",
      "args": ["mcp", "serve"]
    }
  }
}
```

### 2. Inspect Available Tools
To see all registered tools provided by the superpowers server:
```bash
antigravity-superpowers mcp tools
```

### 3. Generate Config Snippet
```bash
antigravity-superpowers mcp config
```

## Available Superpowers Tools

1. **`nixos_generation_info`**:
   - Lists recent NixOS system generations, active profile, and switch timestamps.
2. **`nixos_service_status`**:
   - Queries `systemctl status` or `systemctl --user status` for any system service with journal logs.
3. **`nixos_option_query`**:
   - Retrieves NixOS option documentation and schemas.
4. **`herdr_pane_list`**:
   - Lists active Herdr panes, processes, and agent integration state.
5. **`herdr_send_command`**:
   - Sends shell commands or keystrokes to a target Herdr pane.
6. **`superpowers_skill_read`**:
   - Reads the complete SKILL.md for any installed skill on-demand.
7. **`antigravity_quota_info`**:
   - Retrieves active model quotas, remaining request allowances, and countdown timers.
8. **`codebase_audit`**:
   - Runs Alejandra, Statix, Deadnix, and profile checks in one call.

## Debugging MCP Servers

If an MCP server fails to connect:
1. Verify executable exists and is runnable:
   ```bash
   which antigravity-superpowers
   ```
2. Test stdio handshake manually:
   ```bash
   echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | antigravity-superpowers mcp serve
   ```
3. Check for unexpected output on stdout:
   - MCP protocol requires stdout to contain strictly valid JSON-RPC lines. Any debugging output must be routed to `stderr`.
