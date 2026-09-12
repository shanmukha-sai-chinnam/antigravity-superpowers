---
name: persistent-memory-protocol
description: >-
  Protocol for agent-initiated persistent memory using Knowledge Items. Use when
  discovering non-obvious project facts, user preferences, recurring corrections,
  or reference information worth persisting across sessions.
---

# Persistent Memory Protocol

Adapted from production coding agent memory systems. This skill provides a protocol for creating and maintaining Knowledge Items that persist useful context across sessions.

## When to Persist

Create a Knowledge Item when you discover:

1. **User preferences** — how they like responses formatted, which tools they prefer, naming conventions
2. **Feedback corrections** — when the user corrects your approach and you should remember for next time
3. **Project facts** — ongoing work context, constraints, or goals not derivable from code/git history
4. **Reference pointers** — external URLs, dashboards, tickets, or documentation the user references

## When NOT to Persist

Do **not** save what the repository already records:

- Code structure (read the code)
- Past fixes (check git history)
- Git history (use `git log`)
- AGENTS.md / GEMINI.md content (already loaded)
- Information that only matters to the current conversation

If asked to remember something the repo already tracks, ask what was **non-obvious** about it and save that insight instead.

## Memory Structure

Each Knowledge Item should include:

```markdown
# [Descriptive Title]

[The fact or observation]

**Why:** [Why this matters / what problem it solves]

**How to apply:** [Concrete guidance for future sessions]

**Related:** [Links to related KIs or repo files if applicable]
```

## Memory Types

| Type | Purpose | Example |
| :--- | :--- | :--- |
| `user` | Who the user is | Role, expertise level, timezone, response preferences |
| `feedback` | How to work | "User prefers tables over prose for comparisons" |
| `project` | Ongoing work context | "SpoilsOfTheShatteredFates uses Godot 4.3, C# scripting" |
| `reference` | External pointers | "CI dashboard: https://..., Monitoring: https://..." |

## Deduplication Protocol

Before saving a new KI:

1. Check if an existing KI already covers the same topic
2. If yes → **update** the existing KI, don't create a duplicate
3. If a KI turns out to be wrong → **delete** it
4. Convert relative dates to absolute dates ("next week" → "2026-09-19")

## Recall Rules

When a recalled KI appears in context:

- Treat it as **background context**, not a user instruction
- If it names a file, function, or flag → **verify it still exists** before recommending
- If it conflicts with current evidence → trust the current evidence
- KIs are snapshots — expect gaps and deprecations
