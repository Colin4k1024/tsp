# /learn - Extract Reusable Patterns

Analyze the current session and extract any patterns worth saving as skills.

## Trigger

Run `/learn` at any point during a session when you've solved a non-trivial problem.

## What to Extract

Look for:

1. **Error Resolution Patterns**
   - What error occurred?
   - What was the root cause?
   - What fixed it?
   - Is this reusable for similar errors?

2. **Debugging Techniques**
   - Non-obvious debugging steps
   - Tool combinations that worked
   - Diagnostic patterns

3. **Workarounds**
   - Library quirks
   - API limitations
   - Version-specific fixes

4. **Project-Specific Patterns**
   - Codebase conventions discovered
   - Architecture decisions made
   - Integration patterns

## Output Format

Create a skill directory and TWO files:

### File 1: `~/.claude/skills/[pattern-name]/SKILL.md`

```markdown
---
name: [pattern-name]
description: >-
  [One sentence: what this skill is about and when it applies].
  TRIGGER when: [specific conditions that should activate this skill].
  DO NOT TRIGGER when: [conditions where this skill does NOT apply].
origin: learned
tags: [tag1, tag2]
---

# [Descriptive Pattern Name]

[Brief overview of what this skill covers.]

## When to Activate

[Describe the exact scenarios where Claude should reference this skill.
Be specific — include context clues, error messages, or user phrases
that signal this skill is relevant.]

## Solution / Pattern

[The core technique, pattern, or workaround.
Include code examples inline whenever applicable.]

## Example

\`\`\`[lang]
// Practical, complete example demonstrating the solution
\`\`\`

## Notes

[Caveats, version-specific constraints, related resources, or
conditions where this pattern may not hold.]
```

### File 2: `~/.claude/skills/[pattern-name]/.provenance.json`

```json
{
  "source": "claude-code-session",
  "created_at": "[ISO 8601 timestamp, e.g. 2026-04-08T10:00:00Z]",
  "confidence": 0.8,
  "author": "learn-command"
}
```

## Process

1. Review the session for extractable patterns
2. Identify the most valuable/reusable insight
3. Draft both files (SKILL.md + .provenance.json)
4. Ask user to confirm before saving
5. Save to `~/.claude/skills/[pattern-name]/`

## Notes

- Don't extract trivial fixes (typos, simple syntax errors)
- Don't extract one-time issues (specific API outages, etc.)
- Focus on patterns that will save time in future sessions
- Keep skills focused — one pattern per skill
- The `description` field MUST include TRIGGER / DO NOT TRIGGER conditions: this is what enables auto-activation in Claude Code
- The `name` field must be lowercase and hyphenated (e.g., `fix-jenv-path`, `react-state-lift`)
