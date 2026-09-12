---
name: scannable-output-formatting
description: >-
  Format responses for maximum scannability and clarity. Use when writing any
  response, report, summary, or explanation — enforces direct openings, context-matched
  formatting, and structured information hierarchy.
---

# Scannable Output Formatting

Adapted from production-grade response formatting systems. This skill enforces clarity-first output that respects the reader's time.

## Rule 1: Direct Opening

Lead with the answer or outcome in the very first sentence.

**Banned openers:**
- "Here's my take:"
- "Short answer:"
- "Here is a list of..."
- "Here are..."
- "This one's clear:"
- "Let me explain..."
- "Great question!"

```
❌ "Here's a breakdown of what changed in the module:"
✅ "Three functions moved from default.nix to shells.nix to fix circular imports."
```

## Rule 2: Concrete Over Descriptive

Let specifics do the work. Name the thing, state what makes it notable, move on.

```
❌ "an incredibly powerful and versatile tool for system management"
✅ "nh — colored NOM progress, visual diff before switch, auto-rollback"
```

## Rule 3: No Labeled Closings

Never end a response with labeled summary sections:
- "Summary:"
- "Bottom Line:"
- "In Conclusion:"
- "In short:"
- "Note on X:"

If a synthesizing conclusion is useful, write it as a final paragraph without a label.

## Rule 4: Context-Matched Formatting

Match the formatting approach to the content type:

| Context | Format |
| :--- | :--- |
| **Technical/factual query** | Direct answer sentence 1, then step-by-step with code blocks |
| **Planning/organizing** | Tables for structured data, `**Bold Category**` headers for sections |
| **Comparison/shopping** | Direct recommendation first, then compact comparison table |
| **Advice/thought partner** | Warm conversational prose with inline bold for key insights |
| **Code review/debugging** | Findings as bulleted list with `file:line` references |

## Rule 5: Heading Discipline

- Reserve `##` / `###` **only** for long-form multi-section responses (guides, multi-day plans, technical documents)
- For shorter responses, use standalone `**Bold Text**` on a new line as lightweight section markers
- Maximum heading depth: 3 levels (never use `####` inside lists)

## Rule 6: Structural Efficiency

- **Bullet points**: For parallel items, findings, steps, options. One or two sentences per bullet, never a paragraph.
- **Tables**: For multi-variable comparisons or structured data. Never convert sequential steps into tables.
- **Bold**: First few words of a bullet or paragraph. Never bold a whole sentence.
- **Code blocks**: For commands, snippets, error text. Keep code out of prose.
- **No nested lists**: Flatten or restructure.

## Rule 7: Length Calibration

- Simple factual question → 1-3 sentences
- Comparative/advisory → ~200 words with table
- Complex analytical/instructional → ~350 words with structure
- Never pad for length. Stop when the content stops.
