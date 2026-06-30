# Heartbeat Command

Run discovery scans on a schedule to find issues, auto-create goals, or surface
findings to the triage inbox. The heartbeat is what makes a loop an actual loop —
not a one-shot run.

## Usage

`/heartbeat <subcommand> [args]`

## Subcommands

### Start

```
/heartbeat start
/heartbeat start --interval 30m
/heartbeat start --scan test-health,lint-drift
```

Registers a recurring CronCreate job that runs configured scans. Empty runs
(all scans pass) archive themselves silently.

### Stop

```
/heartbeat stop
```

Cancels the recurring heartbeat job via CronDelete.

### Status

```
/heartbeat status
```

Shows:
- Last scan time and results
- Next scheduled run
- Budget usage (cost per hour)
- Active scan configurations

### Run Once

```
/heartbeat run
```

Execute all configured scans immediately (one-shot, no scheduling).

## Configuration

Heartbeat reads configuration in this order:

1. `.tsp/loop.yaml` — preferred Loop Engineering spec. Gates become discovery scans.
2. `.tsp/heartbeat.yaml` — heartbeat-only config.
3. `.claude/heartbeat.yaml` — legacy compatibility path.

Preferred `.tsp/loop.yaml`:

```yaml
loop:
  id: ci-triage
  description: Keep CI failures triaged and fix machine-checkable failures.
  cadence: 30m
  skill: loop-ci-triage
  stateFile: .tsp/loops/state/ci-triage.md
  gates:
    - name: library-validation
      command: node scripts/validate-library.js
    - name: tests
      command: npm test
  maker:
    role: backend-engineer
    writeAccess: true
  checker:
    role: qa-engineer
    writeAccess: false
  budget:
    maxIterations: 10
    maxDuration: 2h
    maxDollars: 5
```

Heartbeat-only config remains supported:

```yaml
heartbeat:
  interval: "30m"       # How often to tick (default: 30m)
  scans:
    - name: "test-health"
      command: "npm test 2>&1 | tail -10"
      onFailure: "auto-goal"    # auto-create a goal to fix it
      description: "Run test suite"
    - name: "lint-drift"
      command: "npm run lint -- --quiet 2>&1 | wc -l"
      threshold: 0               # numeric threshold: pass if output <= threshold
      onFailure: "triage"        # surface to triage inbox for human
      description: "Check lint errors"
    - name: "dependency-audit"
      command: "npm audit --production 2>&1 | grep -c 'vulnerabilities'"
      threshold: 0
      onFailure: "triage"
      description: "Audit dependencies"
    - name: "type-check"
      command: "npx tsc --noEmit 2>&1; echo EXIT:$?"
      onFailure: "auto-goal"
      description: "TypeScript type checking"
  budget:
    maxDollarsPerHour: 2.0      # Pause heartbeat if cost exceeds this
    pauseOnExhaust: true         # Pause vs stop on budget exhaust
```

## Scan Classification

Each scan result is classified into an action:

| Action | Behavior |
|--------|----------|
| `auto-goal` | Create a goal automatically from the failure (e.g., "fix 3 failing tests") |
| `triage` | Append to triage inbox for human review |
| `notify` | Desktop notification only (informational) |
| `ignore` | Log silently, take no action |

## Flow

```
┌────────────────────────────────────────────┐
│  /heartbeat start                          │
│                                            │
│  CronCreate (every 30m)                    │
│       │                                    │
│       ▼                                    │
│  Run all scans                             │
│       │                                    │
│  ┌────┼────────┬──────────┐               │
│  ▼    ▼        ▼          ▼               │
│ PASS  FAIL     FAIL       FAIL            │
│  │    (goal)   (triage)   (notify)        │
│  │      │        │          │             │
│  ▼      ▼        ▼          ▼             │
│ Skip  /goal    /triage    Desktop         │
│       create   inbox      notification    │
└────────────────────────────────────────────┘
```

## Integration

- **`/goal`**: Heartbeat auto-creates goals from `auto-goal` scan failures
- **`/triage`**: Heartbeat populates triage inbox from `triage` scan failures
- **Budget**: Integrates with cost tracking; pauses if hourly budget exceeded
- **Hooks**: Uses CronCreate/CronDelete for scheduling (7-day auto-expiry applies)
- **State**: Writes via the shared loop state store under `TSP_LOOP_STATE_DIR`, `.tsp/loops/`, or a target default

## Arguments

$ARGUMENTS:
- `start [--interval Nm|Nh] [--scan name1,name2]` — Start recurring heartbeat
- `stop` — Cancel heartbeat
- `status` — Show heartbeat state
- `run` — Execute scans once (no scheduling)
