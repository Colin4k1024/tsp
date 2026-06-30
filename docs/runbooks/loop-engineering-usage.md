---
version: "0.1.0"
status: draft
created: 2026-06-30
updated: 2026-06-30
owner: 工程团队
doc_tier: runbook
last_verified: 2026-06-30
source_of_truth:
  - ../../commands/loop-start.md
  - ../../commands/goal.md
  - ../../commands/heartbeat.md
  - ../../commands/triage.md
  - ../../schemas/loop-spec.schema.json
---

# Loop Engineering Usage

Loop engineering is for recurring, machine-checkable work. It is not the default path for ambiguous product, architecture, auth, payment, or release decisions.

## Intake Test

Start a loop only when all four checks pass:

| Check | Required evidence |
|-------|-------------------|
| Repeats | The task recurs weekly or more often, or is a known batch workflow |
| Automated verification | At least one test, build, lint, schema, or security gate can fail the work |
| Budget | Max iterations, duration, and cost are explicit |
| Tool access | The maker has enough bounded tools to act; the checker is read-only by default |

If any check fails, use `/quick`, `/verify`, `/team-execute`, or a one-shot script instead.

## Minimum Viable Loop

The first production-grade loop should have exactly these parts:

| Part | TSP surface |
|------|-------------|
| One automation | `/heartbeat` or target adapter scheduling |
| One skill | `SKILL.md` holding the project-specific loop instructions |
| One state file | `.tsp/loops/state/<loop-id>.md` plus JSON runtime state |
| One hard gate | A command exit, test report, build, lint, or scan result |

Do one manual run first, then turn the instructions into a skill, then wrap it in `/goal`, then schedule it with `/heartbeat`.

## Loop Spec

Use `.tsp/loop.yaml` for target-neutral loop configuration:

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

The schema is [loop-spec.schema.json](../../schemas/loop-spec.schema.json). Specs without gates or budgets are invalid.

## State Locations

Loop runtime state resolves in this order:

1. `TSP_LOOP_STATE_DIR`
2. project-local `.tsp/loops/`
3. target defaults such as `~/.claude/loops/`, `~/.codex/loops/`, or `~/.config/opencode/loops/`

State files:

| File | Purpose |
|------|---------|
| `goals/{goalId}.json` | `/goal` objective, budget, iterations, and oracle verdicts |
| `triage/inbox.jsonl` | heartbeat and escaped goal findings that need human decision |
| `heartbeat/last-run.json` | last heartbeat result |
| `state/{loopId}.md` | human-readable done/next/blockers/stop conditions |

Legacy Claude paths remain readable during migration:

- `~/.claude/goals`
- `~/.claude/triage/inbox.jsonl`
- `.claude/heartbeat.yaml`

## Roles

| Role | Responsibility |
|------|----------------|
| Maker | Implements one bounded iteration; may write only within the loop spec permission envelope |
| Checker | Evaluates gates and summarizes failures; read-only by default |
| Human reviewer | Reads diffs, checks gate quality, accepts or rejects changes |

The maker never certifies completion alone. A passing gate plus checker verdict is the minimum closeout signal.

## Safety Defaults

- No auto-merge in the first loop release.
- No permission broadening by the loop itself.
- No auto-install of community skills inside scheduled runs.
- All writes land on a branch or worktree.
- Budget exhaustion creates triage instead of continuing.
- Security findings route to a human by default.

## First Recommended Loop

Start with CI triage:

- repeats frequently
- has objective gates
- can run with bounded permissions
- produces reviewable branches or triage items
- avoids product and architecture judgment

Use `.tsp/loop.example.yaml` as the starting template.
