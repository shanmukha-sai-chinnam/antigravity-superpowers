<p align="center">
  <img src="asset/banner.png" alt="antigravity-superpowers" width="100%" />
</p>

<h1 align="center">antigravity-superpowers</h1>

<p align="center">
  <strong>Bring the power of <a href="https://github.com/obra/superpowers">Superpowers</a> to <a href="https://antigravity.google/">Antigravity</a>.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/antigravity-superpowers"><img src="https://img.shields.io/npm/v/antigravity-superpowers.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/antigravity-superpowers"><img src="https://img.shields.io/npm/dm/antigravity-superpowers.svg" alt="npm downloads" /></a>
  <img src="https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg" alt="node version" />
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license" />
</p>

---

Superpowers is an incredible skill-based workflow system that gives AI coding assistants structured, reliable behavior — brainstorming, planning, test-driven development, code review, debugging, and more. It was originally designed for Claude Code, but the workflows themselves are platform-agnostic gold.

**This project ports that entire system to modern Antigravity 2.0**, preserving the original flow as faithfully as possible while leveraging modern Antigravity capabilities: native Planning Mode artifacts, rich tool translation contracts, `.agents` discovery, and Herdr multi-agent orchestration.

> **One command. Full profile. Ready to go.**

```bash
npx antigravity-superpowers init
```

---

## Why This Exists

The original Superpowers repo doesn't support Antigravity, and there's no official port planned. I wanted to use Superpowers workflows in Antigravity projects, so I built this myself.

This is my attempt to bring the full Superpowers skill set to Antigravity — as close to the original as possible. The goal was never to fork and diverge; it was to translate just enough to make everything work natively on a different platform. Superpowers skills bring real structure to AI-assisted development — brainstorming before implementation, planning before coding, verification before completion claims — and that discipline shouldn't be locked to one platform.

This port brings **14 skills** covering the full development lifecycle, updated for modern Antigravity 2.0:

---

## What's Included

**14 skills** covering the full development lifecycle:

| Skill                            | Description                                             |
| -------------------------------- | ------------------------------------------------------- |
| `brainstorming`                  | Structured exploration before committing to an approach |
| `writing-plans`                  | Detailed, step-by-step implementation plans             |
| `executing-plans`                | Disciplined plan execution with progress tracking       |
| `single-flow-task-execution`     | Ordered task decomposition with review gates            |
| `herdr`                          | Terminal multiplexer & multi-agent orchestration _(new)_|
| `test-driven-development`        | Write tests first, implement second                     |
| `systematic-debugging`           | Root cause tracing with supporting techniques           |
| `requesting-code-review`         | Structured review flow with checklists                  |
| `receiving-code-review`          | Handling feedback systematically                        |
| `verification-before-completion` | Prove it works before claiming it's done                |
| `finishing-a-development-branch` | Clean branch wrap-up with workflow options              |
| `using-git-worktrees`            | Parallel branch management                              |
| `using-superpowers`              | Skill routing and session bootstrap                     |
| `writing-skills`                 | Create new skills that follow the system's conventions  |

Plus supporting infrastructure: workflows, rules (`workflow-discipline.md`), agents, validation tests, and an `AGENTS.md` contract that ties it all together.

---

## Quick Start

```bash
# Scaffold the .agents profile into your project
npx antigravity-superpowers init
```

Or install globally into `~/.gemini/config`:

```bash
npx antigravity-superpowers init --global
```

### Options

```bash
# Initialize in current directory (.agents and .agent symlink)
antigravity-superpowers init

# Initialize in a specific project
antigravity-superpowers init /path/to/project

# Replace an existing profile
antigravity-superpowers init --force

# Install globally to ~/.gemini/config
antigravity-superpowers init --global

# Verify profile integrity
antigravity-superpowers check
```

After init, verify everything is wired up:

```bash
antigravity-superpowers check
# or
bash .agents/tests/run-tests.sh
```

---

## How It Works

The CLI copies a complete `.agents` profile into your project root (with `.agent` symlinked for backward compatibility). Once initialized, Antigravity picks up the profile automatically:

1. **Session starts** — loads `.agents/AGENTS.md` rules and `using-superpowers` skill
2. **Each request gets routed** to the most relevant skill
3. **Design work** flows through brainstorming → planning → execution
4. **Every task** is tracked via native Planning Mode artifacts (`implementation_plan.md`, `walkthrough.md`) or `docs/plans/task.md`
5. **Nothing is marked done** without running verification commands first

```
Session Start → Load AGENTS.md → Load using-superpowers
                                        ↓
                               Route to relevant skill
                                        ↓
                          ┌─── Design change? ───┐
                          │ yes                   │ no
                     Brainstorm            Single-flow execution
                          ↓                       ↓
                    Writing plans          Verify before completion
                          ↓                       ↓
                  Single-flow execution   Finish branch
                          ↓
                  Verify before completion
                          ↓
                     Finish branch
```

---

## What Changed from Original Superpowers

> This port aims to stay as close to the original Superpowers as possible. The changes are the minimum required to run natively on Antigravity.

### Execution Model

The one notable structural change. The original Superpowers dispatches multiple coding subagents in parallel — but Antigravity doesn't support parallel subagent execution. So the two skills that relied on that capability (`dispatching-parallel-agents` and `subagent-driven-development`) couldn't be ported as-is. Instead, they were consolidated into a single new skill — **`single-flow-task-execution`** — which preserves the same decomposition logic, task queuing, and review gates, just executed sequentially rather than in parallel. In addition, for environments with Herdr terminal multiplexing (`HERDR_ENV=1`), multi-agent delegation across sibling panes is natively available via the `herdr` skill.

| Original Skill                | What Happened                                                   |
| ----------------------------- | --------------------------------------------------------------- |
| `dispatching-parallel-agents` | Merged into `single-flow-task-execution`                        |
| `subagent-driven-development` | Merged into `single-flow-task-execution`                        |
| `single-flow-task-execution`  | **New** — consolidates decomposition, queuing, and review loops |
| `herdr`                       | **New** — terminal multiplexer & multi-agent orchestration      |

### Task Tracking

|              | Approach                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------- |
| **Original** | `TodoWrite` tool                                                                                |
| **Port**     | Native Planning Mode (`implementation_plan.md`) or live table at `<project-root>/docs/plans/task.md` |

### Tool & Platform Vocabulary

Platform-specific references were translated — the underlying behavior is unchanged:

| Original                 | Antigravity Port                               |
| ------------------------ | ---------------------------------------------- |
| `Claude` / `Claude Code` | `Antigravity`                                  |
| `Skill` tool             | `view_file`                                    |
| `TodoWrite`              | Planning Mode / `docs/plans/task.md`           |
| `superpowers:<skill>`    | `.agents/skills/<skill>/SKILL.md`              |
| `CLAUDE.md`              | `.agents/AGENTS.md`                            |

### Skill Adaptations

Most skills required only terminology and path updates. A few needed slightly more work:

- **`requesting-code-review`** — uses a checklist-based review flow instead of subagent dispatch
- **`writing-plans`** / **`executing-plans`** — handoff paths and tracker references updated for Antigravity conventions

The rest — `brainstorming`, `test-driven-development`, `verification-before-completion`, `finishing-a-development-branch`, and others — preserve their original behavior with only naming and path normalization.

### Antigravity-Native Additions

Infrastructure added to make the profile work as a first-class Antigravity citizen:

- `.agents/AGENTS.md` — tool translation contract and execution rules
- `.agents/rules/workflow-discipline.md` — persistent agent behavioral guidelines
- `.agents/workflows/` — workflow entrypoints (`brainstorm.md`, `execute-plan.md`, `write-plan.md`)
- `.agents/agents/code-reviewer.md` — reviewer agent profile
- `.agents/tests/` — automated profile validation (skill presence, frontmatter, legacy pattern detection)

> **Full Diff:** See [ANTIGRAVITY-PORT-DIFFERENCES.md](ANTIGRAVITY-PORT-DIFFERENCES.md) for the exhaustive skill-by-skill comparison and [CURRENT-FLOW.md](CURRENT-FLOW.md) for the complete workflow diagram.

---

## Contributing

Contributions are welcome! If you find a skill that could be ported more faithfully, a translation that's off, or an Antigravity convention that's not followed — open an issue or PR.

When making changes, run the validation suite to make sure everything still checks out:

```bash
npm test
bash .agent/tests/run-tests.sh
```

---

## Development

```bash
npm test              # Run tests
npm run smoke:pack    # Verify package contents
```

### Publishing

```bash
npm version patch
npm publish
```

`prepublishOnly` runs `npm test` and `npm run smoke:pack` automatically.

---

## License

MIT
