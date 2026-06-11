# Triage Command

View and act on findings that the loop could not auto-resolve. The triage inbox
is where issues land when they need human judgment.

## Usage

`/triage [subcommand] [args]`

## Subcommands

### List (default)

```
/triage
/triage list
/triage list --source heartbeat
/triage list --severity high
```

Show pending triage items with source, severity, and suggested actions.

### Act

```
/triage act <id> goal      # Promote to a goal (auto-fix)
/triage act <id> dismiss   # Dismiss (not actionable)
/triage act <id> defer     # Defer to next session
```

Take action on a triage item. `goal` creates a goal from the finding.

### Stats

```
/triage stats
```

Show inbox health metrics: pending count, sources breakdown, age distribution.

### Clear

```
/triage clear --resolved
/triage clear --older-than 7d
```

Remove resolved or stale items.

## Triage Item Structure

Each item in the inbox has:

| Field | Description |
|-------|-------------|
| `id` | Unique identifier (e.g., `triage-lq4x8`) |
| `source` | Where it came from (e.g., `heartbeat:lint-drift`, `goal:escalated`) |
| `severity` | `high`, `medium`, `low` |
| `summary` | One-line description |
| `detail` | Full scan output or error context |
| `suggestedActions` | What the system recommends |
| `createdAt` | When the item was created |
| `status` | `pending`, `acted`, `dismissed`, `deferred` |

## Sources

Items enter triage from:

1. **Heartbeat scans** with `onFailure: "triage"` classification
2. **Escalated goals** that exhausted their budget without converging
3. **Manual** items added by the user
4. **Connectors** (MCP) that discover issues from external tools

## Flow

```
┌──────────────┐     ┌─────────┐     ┌──────────────┐
│  Heartbeat   │────▶│ TRIAGE  │────▶│  /triage act │
│  Goal escape │     │  INBOX  │     │  goal/dismiss│
│  Connectors  │     │ (.jsonl)│     │  /defer      │
└──────────────┘     └─────────┘     └──────────────┘
                          │
                          ▼
                    Statusline: [Triage: N]
```

## Storage

Inbox is stored as newline-delimited JSON at `~/.claude/triage/inbox.jsonl`.
This format is:
- Append-only (safe for concurrent writes)
- Human-readable (one JSON object per line)
- Easy to grep and filter

## Integration

- **`/heartbeat`**: Primary source of triage items
- **`/goal`**: Escalated goals create triage items; triage items can become goals
- **Statusline**: Hook shows `[Triage: N]` count when items are pending
- **Session start**: Active triage items mentioned in session context

## Arguments

$ARGUMENTS:
- `list [--source name] [--severity level]` — List pending items (default)
- `act <id> goal|dismiss|defer` — Take action on an item
- `stats` — Show inbox metrics
- `clear --resolved|--older-than Nd` — Clean up resolved/stale items
