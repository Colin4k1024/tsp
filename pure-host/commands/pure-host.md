# pure-host Command

## Description

Executes a manifest of tasks using Claude CLI with dependency management, auto-fix retry, git revert points, and Markdown reporting.

## Usage

```
node pure-host/pure-host.js --manifest <dir>
node pure-host/pure-host.js --resume
node pure-host/pure-host.js --revert <taskId>
node pure-host/pure-host.js --status
node pure-host/pure-host.js --report
```

## Arguments

| Flag | Description |
|------|-------------|
| `--manifest <dir>` | Path to manifest directory containing `manifest.yaml` |
| `--resume` | Resume execution from `SHARED_TASK_NOTES.md` |
| `--revert <taskId>` | Revert a specific task to its saved revert point |
| `--status` | Print current state and exit |
| `--report` | Generate report from saved state and exit |
| `--model <model>` | Claude model to use (default: sonnet) |
| `--help` | Show help message |

## Manifest Format

```yaml
model: sonnet
tasks:
  - taskId: task-1
    description: Implement X module
    prompt: Implement the X module according to ...
    dependsOn: []
    timeout: 300000
  - taskId: task-2
    description: Implement Y module
    prompt: Implement the Y module according to ...
    dependsOn:
      - task-1
```

## State Persistence

Execution state is persisted to `SHARED_TASK_NOTES.md` in the project root, enabling resume after interruption.

## Report Format

The execution report includes:
- Task summary with status icons (✓ completed, ⊘ blocked, ◐ in-progress, ○ pending)
- Blocker details with error messages and affected files
- Revert points (git commit SHAs)
- Next steps for manual resolution
