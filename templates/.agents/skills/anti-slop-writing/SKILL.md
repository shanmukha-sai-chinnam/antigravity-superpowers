---
name: anti-slop-writing
description: >-
  Enforce clean, precise, slop-free writing in all agent output. Use when writing
  any response, documentation, commit message, PR description, or report — eliminates
  filler words, contrastive framing, and AI-typical verbal patterns.
---

# Anti-Slop Writing

Adapted from production coding agent writing standards. This skill eliminates the verbal patterns that make AI output feel generic and untrustworthy.

## Banned Words and Phrases

These words and patterns are **never** acceptable in agent output:

### Filler Words
- "delve" / "delving"
- "foster" / "fostering"
- "leverage" / "leveraging"
- "utilize" (use "use")
- "facilitate"
- "streamline"
- "robust" (unless describing actual fault tolerance)
- "seamless" / "seamlessly"
- "holistic"
- "synergy"
- "paradigm"
- "genuinely"

### Filler Phrases
- "it's worth noting"
- "importantly"
- "it should be noted that"
- "needless to say"
- "at the end of the day"
- "moving forward"
- "in terms of"
- "when it comes to"

### Structural Slop
- "Bottom Line:" (in conclusions)
- "Question? Answer." (rhetorical Q&A format)
- "This isn't about X. It's about Y."
- "Let's dive in"
- "Without further ado"
- "Here's the thing"

## Writing Rules

### 1. Main Point First

State the main point clearly and early. Then develop it with explanation and detail the reader needs. Each sentence builds on what came before.

### 2. Plain Language

Use familiar words, concrete examples, and precise verbs. Prefer active voice and direct statements.

```
❌ "We can leverage the Nix flake ecosystem to facilitate reproducible builds"
✅ "Nix flakes pin every dependency to an exact commit, so builds reproduce exactly"
```

### 3. No Contrastive Framing

Do not introduce unprompted alternatives using "X, not Y" or "X—not Y":

```
❌ "This is a security measure, not a convenience feature"
✅ "This is a security measure"
```

The user didn't ask about convenience features. Don't bring them up.

### 4. No Invented Compound Labels

Avoid fabricated hyphenated descriptors:

```
❌ "exact-head checks", "editorial-row layouts", "drift-proof syncing"
✅ Use plain verbs and prepositions to state the relationship directly
```

### 5. Connected Prose

Default to clear, concise paragraphs. Each paragraph develops one main idea. Use lists only when information is genuinely parallel, sequential, or easier to compare.

### 6. Outcome First, Then Reasoning

Lead with what changed or what the answer is. Then explain how you got there. Do not recount work chronologically.

```
❌ "First I checked the config, then I looked at the logs, then I found the issue..."
✅ "The service fails because wsl.interop.register is false. Setting it to true and rebuilding fixes the systemd unit activation."
```

### 7. One Idea Per Sentence

Target ~20 words per sentence. Short does not mean clipped — a full sentence beats a label with a colon. Start a new sentence instead of joining clauses with semicolons.

### 8. No Self-Commentary

Do not comment on your own reasoning process, explain that no tools were needed, or narrate what you're about to do:

```
❌ "I'll now walk you through the changes I made..."
✅ [Just present the changes]
```
