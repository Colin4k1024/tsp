# Goal Command

Define and run a goal-oriented autonomous loop with an external completion oracle.

The goal primitive keeps iterating until verifiable stopping conditions are met,
checked by a SEPARATE model (the oracle) to eliminate author-bias.

## Usage

`/goal <subcommand> [args]`

## Subcommands

### Create & Start

```
/goal "make all tests pass"
/goal "achieve 80% coverage" --budget-iterations 10 --budget-dollars 5
/goal "fix lint errors in src/" --checker sonnet
```

Creates a new goal, infers stopping conditions from the objective, and starts
the maker-oracle loop immediately.

**Auto-inferred stopping conditions:**
- "tests pass" → `npm test` exit code 0
- "coverage N%" → coverage report >= N
- "lint clean" → `npm run lint` exit code 0
- "build passes" → `npm run build` exit code 0
- Custom: specify with `--condition "command"`

### Status

```
/goal status
/goal status <goalId>
```

Show active goals with current iteration, oracle verdict history, budget usage,
and estimated remaining iterations.

### Resume

```
/goal resume
/goal resume <goalId>
```

Resume an active goal from a previous session. Reads state from
`~/.claude/goals/{goalId}.json` and re-enters the maker loop with the oracle's
last `nextHint` as guidance.

### Pause

```
/goal pause
/goal pause <goalId>
```

Pause without abandoning. State is persisted for later `/goal resume`.

### List

```
/goal list
```

Show all goals (active, paused, converged, escalated) with summary stats.

## The Maker-Oracle Loop

```
┌─────────────────────────────────────────────────────┐
│  /goal "fix all tests"                              │
│                                                     │
│  ┌─────────┐    ┌─────────┐    ┌──────────┐       │
│  │  MAKER  │───▶│ ORACLE  │───▶│ CONVERGE │       │
│  │(primary)│    │(checker)│    │  or LOOP │       │
│  └─────────┘    └─────────┘    └──────────┘       │
│       ▲              │                   │          │
│       │         verdict: fail            │          │
│       │         + nextHint               │          │
│       └──────────────┘                   │          │
│                                          │          │
│  Budget exhausted? ──▶ ESCALATE to triage│          │
└─────────────────────────────────────────────────────┘
```

1. **Maker** (your primary model) executes one iteration toward the objective
2. **Oracle** (different model, read-only) evaluates ALL stopping conditions
3. If all pass → goal state becomes `converged`
4. If any fail → oracle provides `nextHint` → maker iterates again
5. If budget exhausted → goal becomes `escalated` → lands in triage inbox

## Oracle Behavior

The oracle:
- Uses a DIFFERENT model than the maker (default: haiku for speed/cost)
- Has READ-ONLY tool access (Read, Bash without writes)
- Cannot modify code — only evaluate conditions
- Returns structured verdict: `{converged, reasons[], nextHint}`
- Is the reason you can walk away from a running loop

## Budget Controls

| Control | Default | Flag |
|---------|---------|------|
| Max iterations | 15 | `--budget-iterations N` |
| Max duration | 2h | `--budget-duration Nh` |
| Max cost | $10 | `--budget-dollars N` |
| Checker model | haiku | `--checker model` |

When ANY budget limit is hit, the goal escalates rather than continuing blindly.

## State Persistence

Goals persist through the shared loop state store:

- `TSP_LOOP_STATE_DIR/goals/{goalId}.json` when `TSP_LOOP_STATE_DIR` is set
- `.tsp/loops/goals/{goalId}.json` for project-local loop state
- target defaults such as `~/.claude/loops/goals/{goalId}.json` or `~/.codex/loops/goals/{goalId}.json`

Legacy `~/.claude/goals/{goalId}.json` remains readable during migration.

- Active goals survive session restarts
- SessionStart hook displays active goal reminder
- Full iteration history is preserved for debugging

## Integration

- **Triage inbox:** Escalated goals create triage items (`/triage`)
- **Heartbeat:** Heartbeat scans can auto-create goals (`/heartbeat`)
- **Checkpoint:** Each iteration creates an implicit checkpoint
- **Verification loop:** Oracle uses verification-loop patterns internally

## Arguments

$ARGUMENTS:
- `<objective>` — Natural language goal description (quoted string)
- `--budget-iterations N` — Max iterations (default 15)
- `--budget-duration Nm|Nh` — Max wall time (default 2h)
- `--budget-dollars N` — Max cost USD (default 10)
- `--checker model` — Oracle model (default haiku)
- `--condition "command"` — Additional stopping condition command
- `status [goalId]` — Show goal status
- `resume [goalId]` — Resume paused/interrupted goal
- `pause [goalId]` — Pause active goal
- `list` — List all goals
