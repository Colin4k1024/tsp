---
name: evolve
description: Manage evolution lifecycle — analyze instincts, query genes, view stats, and run migrations
command: true
---

# Evolve Command

## Implementation

### Instinct Analysis (legacy)

Run the instinct CLI using the plugin root path:

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" evolve [--generate]
```

Or if `CLAUDE_PLUGIN_ROOT` is not set (manual installation):

```bash
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py evolve [--generate]
```

### Evolution Subcommands

```bash
# Migrate existing error patterns and instincts into evolution store
python3 "${CLAUDE_PLUGIN_ROOT}/scripts/evolution/migrate.py" --apply

# Query genes matching a signal
python3 "${CLAUDE_PLUGIN_ROOT}/scripts/evolution/replay.py"

# View governor session stats
python3 -c "from scripts.evolution.governor import Governor; import json; print(json.dumps(Governor().session_stats(), indent=2))"
```

## Usage

```
/evolve                      # Analyze instincts + genes, output cluster candidates
/evolve --generate           # Also generate files under evolved/{skills,commands,agents}
/evolve migrate              # Import error patterns + instincts into the evolution store
/evolve migrate --verbose    # Import with detailed output
/evolve migrate --reverse    # Reverse: convert promoted genes back to instinct YAML files
/evolve status               # Show evolution store stats (gene count, states, etc.)
/evolve query <signal>       # Query matching genes for a signal pattern
/evolve decay                # Apply time decay to stale genes
```

Note: The evolve analysis now reads from **both** instinct files (`~/.claude/homunculus/instincts/`)
and the evolution gene store (`~/.claude/evolution/genes.json`). Promoted genes are automatically
included as analysis items alongside native instincts.

Analyzes instincts and clusters related ones into higher-level structures:
- **Commands**: When instincts describe user-invoked actions
- **Skills**: When instincts describe auto-triggered behaviors
- **Agents**: When instincts describe complex, multi-step processes

## Usage

```
/evolve                    # Analyze all instincts and suggest evolutions
/evolve --generate         # Also generate files under evolved/{skills,commands,agents}
```

## Evolution Rules

### → Command (User-Invoked)
When instincts describe actions a user would explicitly request:
- Multiple instincts about "when user asks to..."
- Instincts with triggers like "when creating a new X"
- Instincts that follow a repeatable sequence

Example:
- `new-table-step1`: "when adding a database table, create migration"
- `new-table-step2`: "when adding a database table, update schema"
- `new-table-step3`: "when adding a database table, regenerate types"

→ Creates: **new-table** command

### → Skill (Auto-Triggered)
When instincts describe behaviors that should happen automatically:
- Pattern-matching triggers
- Error handling responses
- Code style enforcement

Example:
- `prefer-functional`: "when writing functions, prefer functional style"
- `use-immutable`: "when modifying state, use immutable patterns"
- `avoid-classes`: "when designing modules, avoid class-based design"

→ Creates: `functional-patterns` skill

### → Agent (Needs Depth/Isolation)
When instincts describe complex, multi-step processes that benefit from isolation:
- Debugging workflows
- Refactoring sequences
- Research tasks

Example:
- `debug-step1`: "when debugging, first check logs"
- `debug-step2`: "when debugging, isolate the failing component"
- `debug-step3`: "when debugging, create minimal reproduction"
- `debug-step4`: "when debugging, verify fix with test"

→ Creates: **debugger** agent

## What to Do

1. Detect current project context
2. Read project + global instincts (project takes precedence on ID conflicts)
3. Group instincts by trigger/domain patterns
4. Identify:
   - Skill candidates (trigger clusters with 2+ instincts)
   - Command candidates (high-confidence workflow instincts)
   - Agent candidates (larger, high-confidence clusters)
5. Show promotion candidates (project -> global) when applicable
6. If `--generate` is passed, write files to:
   - Project scope: `~/.claude/homunculus/projects/<project-id>/evolved/`
   - Global fallback: `~/.claude/homunculus/evolved/`

## Output Format

```
============================================================
  EVOLVE ANALYSIS - 12 instincts
  Project: my-app (a1b2c3d4e5f6)
  Project-scoped: 8 | Global: 4
============================================================

High confidence instincts (>=80%): 5

## SKILL CANDIDATES
1. Cluster: "adding tests"
   Instincts: 3
   Avg confidence: 82%
   Domains: testing
   Scopes: project

## COMMAND CANDIDATES (2)
  /adding-tests
    From: test-first-workflow [project]
    Confidence: 84%

## AGENT CANDIDATES (1)
  adding-tests-agent
    Covers 3 instincts
    Avg confidence: 82%
```

## Flags

- `--generate`: Generate evolved files in addition to analysis output

## Generated File Format

### Command
```markdown
---
name: new-table
description: Create a new database table with migration, schema update, and type generation
command: /new-table
evolved_from:
  - new-table-migration
  - update-schema
  - regenerate-types
---

# New Table Command

[Generated content based on clustered instincts]

## Steps
1. ...
2. ...
```

### Skill
```markdown
---
name: functional-patterns
description: Enforce functional programming patterns
evolved_from:
  - prefer-functional
  - use-immutable
  - avoid-classes
---

# Functional Patterns Skill

[Generated content based on clustered instincts]
```

### Agent
```markdown
---
name: debugger
description: Systematic debugging agent
model: sonnet
evolved_from:
  - debug-check-logs
  - debug-isolate
  - debug-reproduce
---

# Debugger Agent

[Generated content based on clustered instincts]
```
