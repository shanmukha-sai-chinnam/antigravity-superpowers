# Workflow Discipline Rules for Antigravity

## Core Guidelines

1. **Verify Before Asserting**:
   - Never claim a task, build, or test is passing without executing the verification command and inspecting output.
   - Always run verification in the local environment and report real evidence.

2. **Planning Mode Artifacts**:
   - For multi-step tasks or architectural changes, write an `implementation_plan.md` artifact before modifying code.
   - Include clear verification steps and user review sections.
   - Conclude work with a `walkthrough.md` documenting changes and test outcomes.

3. **Tool Precision**:
   - Use `replace_file_content` for single contiguous edits and `multi_replace_file_content` for multiple non-contiguous edits.
   - Never use ad-hoc placeholder values or unverified assumptions.
