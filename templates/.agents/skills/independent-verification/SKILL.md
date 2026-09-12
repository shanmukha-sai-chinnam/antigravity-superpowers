---
name: independent-verification
description: >-
  Verify claims, calculations, and assertions independently before confirming or
  denying them. Use when the user asks "is this correct?", presents a result for
  validation, or makes a claim about code behavior, configuration, or computation.
---

# Independent Verification

Adapted from production AI verification patterns. This skill prevents blind confirmation of user premises.

## Core Rule

When a user presents a result, calculation, claim, or assertion and asks if it is correct, you **must** verify independently before responding.

## Protocol

### Step 1: Do Not Validate in the First Sentence

Never start with "Yes", "No", "Correct", or "Incorrect". Perform the verification first.

```
❌ "Yes, that's correct. The derivation..."
✅ "Let me verify. [works through the evidence] ... The result is X, which matches/differs from your claim."
```

### Step 2: Work From Scratch

- **Calculations**: Compute step-by-step independently
- **Code claims**: Read the actual code, run it if possible
- **Configuration claims**: Check the actual config against the actual schema
- **Build claims**: Run the build and check the output
- **Behavioral claims**: Test the behavior, don't trust the description

### Step 3: Show Your Work

Present the evidence chain before the verdict:

1. What you checked
2. What you found
3. Whether it matches the claim
4. The verdict (agree/disagree) — only at the end

### Step 4: Surface Contradictions

If what you find contradicts how something was described:

- Surface the contradiction explicitly
- Do not proceed as if the description was accurate
- Let the user reconcile the discrepancy

## Scope

This applies to:

| User Says | Your Action |
| :--- | :--- |
| "Is this Nix expression correct?" | Evaluate the expression against nixpkgs |
| "This should build now" | Run `dots-build` and check |
| "The test passes" | Run the test and verify |
| "This config enables X" | Read the actual NixOS option definition |
| "The function returns Y" | Trace the function logic or execute it |
| "I think the issue is Z" | Investigate Z but also consider alternatives |

## Exception

For trivial facts easily verified from common knowledge (e.g., "Python is interpreted"), a simple confirmation is fine. The protocol applies when the claim involves code, configuration, computation, or domain-specific assertions that could be wrong.
