# Loop Start Command

Start a managed autonomous loop pattern with safety defaults.

## Usage

`/loop-start [pattern] [--mode safe|fast] [--spec .tsp/loop.yaml]`

- `pattern`: `sequential`, `continuous-pr`, `rfc-dag`, `infinite`
- `--mode`:
  - `safe` (default): strict quality gates and checkpoints
  - `fast`: reduced gates for speed
- `--spec`: loop spec path, default `.tsp/loop.yaml`

## Loop Engineering Intake

Do not start a scheduled loop until all four conditions hold:

1. The task repeats often enough to amortize loop setup.
2. Verification is automated with at least one hard gate.
3. Budget is explicit: iterations, wall-clock time, and cost.
4. Tool access is sufficient and bounded for the intended work.

If any condition fails, use `/quick`, `/verify`, or a one-shot script instead of
creating a loop.

## Flow

1. Confirm repository state and branch strategy.
2. Validate `.tsp/loop.yaml` against `schemas/loop-spec.schema.json`.
3. Initialize loop state under `TSP_LOOP_STATE_DIR`, `.tsp/loops/`, or the target adapter default.
4. Select loop pattern and model tier strategy.
5. Enable required hooks/profile for the chosen mode.
6. Print commands to start and monitor the loop.

## Required Safety Checks

- Verify tests pass before first loop iteration.
- Ensure `ECC_HOOK_PROFILE` is not disabled globally.
- Ensure loop has at least one objective gate.
- Ensure loop has explicit stop conditions and budget limits.
- Ensure maker and checker are separate roles or agents.
- Ensure loop writes go through a branch or worktree, not protected main.

## State

Loop runtime state is target-neutral:

- `TSP_LOOP_STATE_DIR` when set
- project-local `.tsp/loops/`
- target default, such as `~/.claude/loops/` or `~/.codex/loops/`

Legacy Claude goal and triage paths remain readable for migration.

## Arguments

$ARGUMENTS:
- `<pattern>` optional (`sequential|continuous-pr|rfc-dag|infinite`)
- `--mode safe|fast` optional
- `--spec <path>` optional
