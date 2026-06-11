# Dashboard Command

Real-time progress visibility for goals, waves, and triage. Shows what the loop
is doing, how much budget remains, and what needs human attention.

## Usage

`/dashboard`

## Output

```
╔══════════════════════════════════════════════════════════════╗
║  LOOP ENGINEERING DASHBOARD                                  ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ACTIVE GOALS                                                ║
║  ─────────────                                               ║
║  ▶ [goal-a1b2c3d4] "Fix all failing tests"                  ║
║    Iteration: 3/15 | Budget: $1.20/$10 | Time: 25m/2h       ║
║    Last oracle: FAIL — 2 tests still failing in auth module  ║
║    Next hint: Focus on token refresh mock                    ║
║                                                              ║
║  ⏸ [goal-e5f6g7h8] "Achieve 80% coverage"                   ║
║    Iteration: 7/15 | Budget: $3.50/$10 | Paused             ║
║                                                              ║
║  HEARTBEAT                                                   ║
║  ─────────────                                               ║
║  Status: Running (interval: 30m)                             ║
║  Last run: 12m ago — 2/3 passed, 1 goal created             ║
║  Next run: 18m                                               ║
║  Budget: $0.80/$2.00 per hour                                ║
║                                                              ║
║  TRIAGE INBOX                                                ║
║  ─────────────                                               ║
║  [3 pending] [1 high] [2 medium]                             ║
║  • HIGH: sentry — 5 unresolved errors (2h ago)               ║
║  • MED:  lint — 4 new lint errors (30m ago)                  ║
║  • MED:  deps — 2 moderate vulnerabilities (1d ago)          ║
║                                                              ║
║  WAVE EXECUTION                                              ║
║  ─────────────                                               ║
║  (No active waves)                                           ║
║                                                              ║
║  REWORK TRACKING                                             ║
║  ─────────────                                               ║
║  Persistent trouble spots: 1                                 ║
║  • src/auth/refresh.ts — 3 attempts, last: fail             ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

## Data Sources

The dashboard aggregates from:

| Source | Location |
|--------|----------|
| Active goals | `~/.claude/goals/*.json` |
| Heartbeat state | `~/.claude/heartbeat-last-run.json` |
| Triage inbox | `~/.claude/triage/inbox.jsonl` |
| Wave progress | Worker `status.md` files in coordination dirs |
| Rework tracking | `~/.claude/rework-tracking.json` |
| Cost tracking | Goal history `costDollars` fields |

## Sections

### Active Goals
- State icon: ▶ (active), ⏸ (paused), ✓ (converged), ⚠ (escalated)
- Progress: iteration/max, cost/budget, time/duration
- Last oracle verdict and hint

### Heartbeat
- Running/stopped status
- Last run results (passed/failed count)
- Time to next run
- Hourly budget usage

### Triage Inbox
- Pending count by severity
- Top 3 most recent items with source and age
- Action hint: "Use /triage to act on items"

### Wave Execution
- Active wave index / total waves
- Per-worker status and progress estimate
- Critical path and ETA (when workers report progress)

### Rework Tracking
- Persistent trouble spots (files with 3+ rework attempts)
- Escalation recommendations

## Integration

- **`/goal status`**: Dashboard includes goal details
- **`/heartbeat status`**: Dashboard includes heartbeat state
- **`/triage stats`**: Dashboard includes inbox summary
- **Wave execution**: Dashboard tracks parallel worker progress

## Arguments

$ARGUMENTS:
- (none) — Show full dashboard
- `--compact` — One-line summary per section
- `--json` — Machine-readable output
