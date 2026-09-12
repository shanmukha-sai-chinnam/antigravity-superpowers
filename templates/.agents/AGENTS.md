# Superpowers for Antigravity

You have superpowers.

This profile adapts Superpowers workflows for modern Antigravity with disciplined task execution and native planning mode artifacts.

## Core Rules

1. Load skills via `view_file` from `.agents/skills/<skill-name>/SKILL.md` or `~/.gemini/config/skills/<skill-name>/SKILL.md`.
2. Follow disciplined single-flow execution for individual coding tasks with explicit verification gates.
3. Use Antigravity Planning Mode artifacts (`implementation_plan.md`, `walkthrough.md`) or `<project-root>/.agents/task.md` for task checklists.
4. Provide concrete command evidence before making completion assertions.

## Modern Antigravity Tool Translation Contract

When source skills or legacy prompts reference tools, use the current Antigravity tool surface:

- Assistant/Platform -> `Antigravity`
- `Skill` tool -> `view_file` on `SKILL.md`
- `Task` tool (browser) -> `browser_subagent`
- `Task` tool (background jobs) -> `run_command` (async) & `manage_task` (`status`, `kill`, `send_input`)
- `TodoWrite` -> Antigravity Planning Mode (`implementation_plan.md`) or `<project-root>/.agents/task.md`
- File inspection -> `view_file` (supports line ranges, byte offsets, text, and binary)
- File editing -> `replace_file_content` (single chunk), `multi_replace_file_content` (multi-chunk)
- File creation -> `write_to_file`
- Directory listing -> `list_dir`
- Fast code search -> `grep_search` (ripgrep)
- Shell execution -> `run_command` (supports synchronous wait, async background, and persistent terminals)
- Background task management -> `manage_task`
- Timers & Cron -> `schedule`
- Web extraction -> `read_url_content`
- Web search -> `search_web`
- User interaction & design feedback -> `ask_question`
- Visual assets & UI generation -> `generate_image`
- MCP integrations -> `mcp_*` tool family

## Customization Discovery Roots

Antigravity automatically discovers customizations from:

1. **Workspace Root**: `.agents/` (with `.agent/` backward-compatibility support)
   - `skills/<skill_name>/SKILL.md`
   - `rules/*.md` and `AGENTS.md`
   - `workflows/` and `agents/`
2. **Global Root**: `~/.gemini/config/`
   - `skills/<skill_name>/SKILL.md`
   - `rules/*.md` and `AGENTS.md`
   - `hooks.json` and `mcp_config.json`

## Execution Model: Disciplined Single-Flow Execution

- Decompose complex workflows into clear, sequential milestones using Planning Mode.
- Create or update `implementation_plan.md` before non-trivial modifications.
- Obtain user approval, execute iteratively, and verify each step.
- Update `walkthrough.md` with evidence and test outputs before claiming completion.

## Verification Discipline

Before claiming a task is done:
1. Run the project verification command(s) (tests, linters, builds).
2. Confirm exit status code `0` and verify output diffs.
3. Document concrete verification output in `walkthrough.md` or checklist.
4. Evidence before assertions always.
