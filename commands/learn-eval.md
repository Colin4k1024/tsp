---
description: "Extract reusable patterns from the session, self-evaluate quality before saving, and determine the right save location (Global vs Project)."
---

# /learn-eval - Extract, Evaluate, then Save

Extends `/learn` with a quality gate, save-location decision, and knowledge-placement awareness before writing any skill file.

## What to Extract

Look for:

1. **Error Resolution Patterns** — root cause + fix + reusability
2. **Debugging Techniques** — non-obvious steps, tool combinations
3. **Workarounds** — library quirks, API limitations, version-specific fixes
4. **Project-Specific Patterns** — conventions, architecture decisions, integration patterns

## Process

1. Review the session for extractable patterns
2. Identify the most valuable/reusable insight

3. **Determine save location:**
   - Ask: "Would this pattern be useful in a different project?"
   - **Global** (`~/.claude/skills/[pattern-name]/`): Generic patterns usable across 2+ projects (bash compatibility, LLM API behavior, debugging techniques, etc.)
   - **Project** (`.claude/skills/[pattern-name]/` in current project root): Project-specific knowledge (quirks of a particular config file, project-specific architecture decisions, etc.)
   - When in doubt, choose Global (moving Global → Project is easier than the reverse)

4. Draft the TWO skill files using this format:

**File 1: `~/.claude/skills/[pattern-name]/SKILL.md`**

```markdown
---
name: [pattern-name]
description: >-
  [One sentence: what this skill is about and when it applies].
  TRIGGER when: [specific conditions that activate this skill].
  DO NOT TRIGGER when: [conditions where this skill does NOT apply].
origin: learned
tags: [tag1, tag2]
---

# [Descriptive Pattern Name]

[Brief overview of what this skill covers.]

## When to Activate

[Exact scenarios where Claude should reference this skill.
Include context clues, error messages, or user phrases that signal relevance.]

## Solution / Pattern

[Core technique or pattern — include inline code examples.]

## Example

\`\`\`[lang]
// Complete, runnable example
\`\`\`

## Notes

[Caveats, version constraints, edge cases, or related resources.]
```

**File 2: `~/.claude/skills/[pattern-name]/.provenance.json`**

```json
{
  "source": "claude-code-session",
  "created_at": "[ISO 8601 timestamp]",
  "confidence": [0.0–1.0, reflecting extraction confidence],
  "author": "learn-eval-command"
}
```

**Description field requirements:**
- Must include TRIGGER / DO NOT TRIGGER conditions for auto-activation in VS Code Claude Code
- Must be ≤ 200 characters total for the activation description line (the trigger block may extend beyond)
- Name must be lowercase hyphenated (e.g., `jenv-path-fix`, `react-context-split`)

5. **Quality gate — Checklist + Holistic verdict**

   ### 5a. Required checklist (verify by actually reading files)

   Execute **all** of the following before evaluating the draft:

   - [ ] Grep `~/.claude/skills/` and relevant project `.claude/skills/` files by keyword to check for content overlap
   - [ ] Check MEMORY.md (both project and global) for overlap
   - [ ] Consider whether appending to an existing skill would suffice
   - [ ] Confirm this is a reusable pattern, not a one-off fix

   ### 5b. Holistic verdict

   Synthesize the checklist results and draft quality, then choose **one** of the following:

   | Verdict | Meaning | Next Action |
   |---------|---------|-------------|
   | **Save** | Unique, specific, well-scoped | Proceed to Step 6 |
   | **Improve then Save** | Valuable but needs refinement | List improvements → revise → re-evaluate (once) |
   | **Absorb into [X]** | Should be appended to an existing skill | Show target skill and additions → Step 6 |
   | **Drop** | Trivial, redundant, or too abstract | Explain reasoning and stop |

**Guideline dimensions** (informing the verdict, not scored):

- **Specificity & Actionability**: Contains code examples or commands that are immediately usable
- **Scope Fit**: Name, trigger conditions, and content are aligned and focused on a single pattern
- **Uniqueness**: Provides value not covered by existing skills (informed by checklist results)
- **Reusability**: Realistic trigger scenarios exist in future sessions

6. **Verdict-specific confirmation flow**

- **Improve then Save**: Present the required improvements + revised draft + updated checklist/verdict after one re-evaluation; if the revised verdict is **Save**, save after user confirmation, otherwise follow the new verdict
- **Save**: Present save path + checklist results + 1-line verdict rationale + full draft → save after user confirmation
- **Absorb into [X]**: Present target path + additions (diff format) + checklist results + verdict rationale → append after user confirmation
- **Drop**: Show checklist results + reasoning only (no confirmation needed)

7. Save / Absorb to the determined location

   **For Save:** Create two files under the chosen root:
   - `[root]/[pattern-name]/SKILL.md` — the skill content
   - `[root]/[pattern-name]/.provenance.json` — provenance metadata

   **For Absorb:** Append content to the existing `SKILL.md` (no new directory needed — the existing skill's `.provenance.json` is preserved as-is).

## Output Format for Step 5

```
### Checklist
- [x] skills/ grep: no overlap (or: overlap found → details)
- [x] MEMORY.md: no overlap (or: overlap found → details)
- [x] Existing skill append: new file appropriate (or: should append to [X])
- [x] Reusability: confirmed (or: one-off → Drop)

### Verdict: Save / Improve then Save / Absorb into [X] / Drop

**Rationale:** (1-2 sentences explaining the verdict)
```

## Design Rationale

This version replaces the previous 5-dimension numeric scoring rubric (Specificity, Actionability, Scope Fit, Non-redundancy, Coverage scored 1-5) with a checklist-based holistic verdict system. Modern frontier models (Opus 4.6+) have strong contextual judgment — forcing rich qualitative signals into numeric scores loses nuance and can produce misleading totals. The holistic approach lets the model weigh all factors naturally, producing more accurate save/drop decisions while the explicit checklist ensures no critical check is skipped.

## Notes

- Don't extract trivial fixes (typos, simple syntax errors)
- Don't extract one-time issues (specific API outages, etc.)
- Focus on patterns that will save time in future sessions
- Keep skills focused — one pattern per skill
- When the verdict is Absorb, append to the existing skill rather than creating a new file
