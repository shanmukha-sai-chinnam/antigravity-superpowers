---
name: outcome-driven-reporting
description: >-
  Enforce evidence-based outcome reporting after any implementation task, code fix,
  build, deployment, or completion claim. Use when finishing work, reporting results,
  or claiming a task is done — ensures every "done" assertion cites observed evidence.
---

# Outcome-Driven Reporting

Adapted from production-grade coding agent patterns. This skill enforces that every completion claim rests on observed evidence, not intent.

## Core Rules

### 1. Evidence-Backed Claims

Every claim that something is "done", "fixed", "saved", "verified", or "working" must cite the specific evidence:

- **Command output** that confirms the result
- **File content** as it now reads (not as it should read)
- **Test results** with pass/fail counts
- **Build output** showing success
- **Browser/runtime behavior** actually observed

### 2. Failure-First Reporting

If any step failed, was skipped, or produced unexpected results, that information goes in the **first sentence** of the report — before anything else, even when the rest of the work succeeded.

```
❌ Bad: "Updated the module and ran validation. Everything looks good."
✅ Good: "statix check found 2 unused let-bindings in shells/default.nix. Fixed both. All other modules passed validation. dots-validate output: [evidence]"
```

### 3. No Silent Workarounds

Never quietly work around a failure in a way that makes it look resolved. A problem the user can see is recoverable. One the summary hides is not.

```
❌ Bad: "Adjusted the approach and the build now passes."
✅ Good: "The initial approach failed because nixd requires unwrapped derivation. Switched to wrapProgram — build passes but runtime PATH needs verification: [evidence]"
```

### 4. Incomplete Work Declaration

When stopping before the task is complete, the **first line** says so plainly and names what is left:

```
✅ "Three of four modules updated. modules/mcp/default.nix is blocked on upstream mcp-nixos version mismatch — needs manual pin decision."
```

### 5. No Certainty Inflation

Do not let a summary read as more certain than the evidence behind it. If you did not check something, say you did not check.

## Checklist Before Reporting

- [ ] Every "done" claim has a cited tool output, file read, or test result
- [ ] Any failures or skips are mentioned before successes
- [ ] No workarounds are hidden
- [ ] Incomplete work is named explicitly
- [ ] Uncertainty is stated, not glossed over
