---
name: replay
description: Query the evolution store for verified strategies matching a signal
command: true
---

# Replay Command

## Implementation

Query the evolution store for genes matching a given signal pattern:

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/scripts/evolution/replay.py"
```

The Replay-First executor intercepts tool calls and checks if a verified strategy (gene)
already exists for the detected signal pattern before falling through to LLM execution.

## Usage

```
/replay                        # Show replay status and recent matches
/replay --signal "npm test"    # Query for matching genes
/replay --stats                # Show replay hit/miss statistics
```

## How Replay-First Works

1. **Signal Detection**: Extract a matchable signal from the tool call (command, error output, etc.)
2. **Gene Query**: Search the evolution store for genes matching the signal + environment
3. **Candidate Scoring**: Rank matches by composite score (signal match × confidence × env similarity)
4. **Replay or Passthrough**: If a high-confidence match exists, suggest the verified strategy; otherwise pass through to normal LLM execution

## Configuration

| Environment Variable | Default | Description |
|---|---|---|
| `EVOLUTION_DISABLED` | `false` | Set to `1` to disable evolution replay |
| `EVOLUTION_MIN_CONFIDENCE` | `0.40` | Minimum gene confidence for replay |
| `EVOLUTION_MAX_CANDIDATES` | `3` | Maximum candidate genes to return |

## Prerequisites

- Evolution store initialized at `~/.claude/evolution/`
- Run `/evolve migrate` to import existing error patterns and instincts
