# Pure Host

AI-augmented task execution engine with dependency management, auto-fix retry, git revert points, and Markdown reporting.

## Overview

Pure Host executes a manifest of tasks using Claude CLI with:

- **Dependency management** — tasks run in topological order respecting dependencies
- **Parallel execution** — up to 2 tasks run concurrently when dependencies allow
- **Auto-fix retry** — on failure, generates fix prompts and retries automatically
- **Git revert points** — marks clean git state before each task for safe rollback
- **State persistence** — resume interrupted executions from `SHARED_TASK_NOTES.md`
- **Markdown reporting** — generates execution reports with status, blockers, and next steps

## Installation

```bash
# As part of tsp (already included)
npm install

# Standalone
npm install @colin4k1024/pure-host
```

## Quick Start

```bash
# Run a manifest
node pure-host/pure-host.js --manifest docs/artifacts/my-feature/

# Resume from interruption
node pure-host/pure-host.js --resume

# Check status
node pure-host/pure-host.js --status

# Generate report
node pure-host/pure-host.js --report

# Revert a failed task
node pure-host/pure-host.js --revert task-2
```

## Manifest Format

```yaml
model: sonnet  # or haiku, opus
tasks:
  - taskId: task-1
    description: Implement X module
    prompt: |
      Implement the X module according to...
    dependsOn: []
    timeout: 300000  # optional, default 5min
    verifyCommand: npm test  # optional verification command

  - taskId: task-2
    description: Implement Y module
    prompt: |
      Implement the Y module after X is complete...
    dependsOn:
      - task-1
    timeout: 300000
```

## Architecture

```
pure-host/
├── pure-host.js          # CLI entry point
├── package.json
├── lib/
│   ├── state-store.js    # Persists execution state
│   ├── manifest-loader.js # Loads manifest.yaml
│   ├── dependency-graph.js # DAG and topological sort
│   ├── executor.js       # Claude CLI subprocess
│   ├── retry-handler.js  # Auto-fix generation
│   ├── git-manager.js    # Revert points and commits
│   └── reporter.js       # Markdown report generation
├── commands/
│   └── pure-host.md      # Command documentation
└── examples/
    └── quick-start/
        └── manifest.yaml # Example manifest
```

## Execution Flow

1. **Load manifest** — parse `manifest.yaml` and validate structure
2. **Build DAG** — create dependency graph, detect cycles
3. **Topological sort** — determine execution order
4. **Main loop** — process tasks in batches of up to 2:
   - Execute task via Claude CLI
   - Verify output (error pattern check)
   - On failure: auto-fix retry (up to 3 attempts)
   - On success: mark git revert point, commit result
5. **Report** — generate markdown execution report

## State Persistence

State is saved to `SHARED_TASK_NOTES.md` in the project root as YAML frontmatter:

```markdown
# SHARED TASK NOTES

> Auto-managed by pure-host. Do not edit manually.

---
{"tasks":{"task-1":{"taskId":"task-1","status":"completed",...}},...}
---
```

## Auto-Fix

When a task fails, Pure Host generates a fix prompt containing:

- Task description and error details
- Error type and affected files
- Instructions to analyze root cause and apply fix
- Preservation of passing tests

The fix attempt runs Claude CLI with the generated prompt, and if successful, re-verifies before marking complete.

## Git Integration

- **Before each task**: `git add -A && git commit` creates a revert point
- **After each task**: `git add -A && git commit` marks completion
- **Revert**: `git revert --no-commit <sha>` or `git reset --hard <sha>`

Non-git environments are handled gracefully — tasks still complete but without commit history.

## Verification

By default, verification checks for error patterns in output:

- `Error:`
- `failed`
- `SyntaxError:`
- `TypeError:`
- `ReferenceError:`

For custom verification, provide a `verifyCommand` in the manifest task:

```yaml
tasks:
  - taskId: build
    verifyCommand: npm run build && npm test
```

## Model Selection

```bash
# Default: sonnet
node pure-host/pure-host.js --manifest ...

# Use haiku for fast tasks
node pure-host/pure-host.js --manifest ... --model haiku

# Use opus for complex tasks
node pure-host/pure-host.js --manifest ... --model opus
```

## Report Format

The execution report includes:

- **Header** — manifest source, model, timing, duration
- **Task Summary** — each task with status icon (✓ completed, ⊘ blocked, ◐ in-progress, ○ pending)
- **Blockers** — failed tasks with error messages and affected files
- **Revert Points** — git commit SHAs for each task
- **Next Steps** — recommended actions to resolve blockers or continue

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Cycle detected | Exit with error before execution |
| No manifest found | Exit with helpful message |
| Claude CLI not installed | Exit with install instructions |
| Task timeout | Mark blocked, continue to next |
| Auto-fix fails 3x | Mark blocked, continue to next |
| Git unavailable | Mark complete without commit |

## License

MIT
