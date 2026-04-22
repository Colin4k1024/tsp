# Python Remnants Audit

**Date:** 2026-04-03  
**Scope:** `/scripts` remaining `.py` files after the JS-first migration waves  
**Goal:** classify every remaining Python file into one of three buckets:

- keep as compatibility shim
- migrate next to JS
- retire/delete

> Historical snapshot: this audit captures Python remnants at that date.  
> Current command equivalents for referenced core scripts:  
> `scripts/build_platform_artifacts.py` -> `scripts/build-platform-artifacts.js`  
> `scripts/validate_library.py` -> `scripts/validate-library.js`

## Executive Summary

The repository is **not yet Python-free**.

The current state is:

- the main operational path is already JS-first
- several Python files remain intentionally as compatibility shims for tests and legacy entrypoints
- a smaller set of Python files are still real implementations and should be considered the next migration targets
- a final set are one-off maintenance/debug utilities and should be retired rather than migrated unless there is a live owner for them

## Classification Rules

### A. Keep as Compatibility Shim

Use this bucket only when all of the following are true:

1. there is already a JS primary implementation
2. Python is still imported by tests, hooks, or legacy operators
3. removing the Python file now would create unnecessary churn

### B. Migrate Next to JS

Use this bucket when:

1. the Python file is still a real implementation
2. it belongs to an actively used path
3. the repository would be simpler if it moved into the Node toolchain

### C. Retire/Delete

Use this bucket when:

1. the file is a one-off migration/debug utility
2. it is not on the supported operational path
3. it has no active owner or runbook dependency

## Current Inventory

Remaining Python files under `/scripts`:

- `scripts/__init__.py`
- `scripts/_inspect_project_session.py`
- `scripts/_migrate_agent_governance.py`
- `scripts/_register_audit_hooks.py`
- `scripts/_ruoyi_audit_live.py`
- `scripts/_ruoyi_detail.py`
- `scripts/build_platform_artifacts.py`
- `scripts/hooks/__init__.py`
- `scripts/hooks/insaits-security-monitor.py`
- `scripts/hooks/mcp_health_check.py`
- `scripts/hooks/observe.py`
- `scripts/hooks/session_end.py`
- `scripts/hooks/session_start.py`
- `scripts/install_platform.py`
- `scripts/langfuse_trace.py`
- `scripts/lib/audit_logger.py`
- `scripts/lib/audit_query.py`
- `scripts/lib/hook_contract.py`
- `scripts/lib/memory_store.py`
- `scripts/lib/utils.py`
- `scripts/query_audit_logs.py`
- `scripts/run_e2e_test.py`
- `scripts/scan_leaked_keys.py`
- `scripts/team_skills_platform.py`
- `scripts/trigger_gitlab_pipeline.py`
- `scripts/validate_library.py`
- `scripts/validate_workflow_state.py`

## Bucket 1: Keep as Compatibility Shim

These files already have a JS-first runtime path and should remain temporarily as thin Python compatibility surfaces:

- `scripts/build_platform_artifacts.py`
- `scripts/install_platform.py`
- `scripts/langfuse_trace.py`
- `scripts/query_audit_logs.py`
- `scripts/scan_leaked_keys.py`
- `scripts/validate_library.py`
- `scripts/validate_workflow_state.py`

### Why

- they preserve old commands such as `python3 scripts/<name>.py`
- they protect existing imports in tests and legacy operator habits
- the real implementation now lives in JS

### Exit Criteria For Deletion

These shims can be removed only after:

1. docs no longer point to the Python entrypoints
2. tests no longer import these Python modules directly
3. shell and PowerShell wrappers are fully JS-native
4. at least one cleanup cycle confirms no active operators still rely on Python invocation

## Bucket 2: Keep as Python Compatibility Support For Now

These files are not the canonical runtime anymore, but they still provide compatibility for current tests and hook behavior:

- `scripts/hooks/mcp_health_check.py`
- `scripts/hooks/observe.py`
- `scripts/hooks/session_end.py`
- `scripts/hooks/session_start.py`
- `scripts/lib/audit_logger.py`
- `scripts/lib/audit_query.py`
- `scripts/lib/hook_contract.py`
- `scripts/lib/memory_store.py`
- `scripts/lib/utils.py`

### Why

- the current test suite imports these Python modules directly
- they provide a stable bridge while the repository transitions from Python hook semantics to JS hook semantics
- deleting them now would force a wider hook/test refactor than the main migration required

### Recommendation

Do **not** migrate these in the next wave by default.

Instead choose one of two intentional end states:

1. keep them as a supported Python compatibility layer for legacy hook/tests
2. run a dedicated “hook/test runtime unification” project, then delete them together

### Warning

Migrating these one-by-one is the wrong shape of work. They are tightly coupled and should be handled as a single compatibility-surface decision.

## Bucket 3: Migrate Next to JS

These are the remaining Python files that still represent real implementation value and should be the next migration candidates.

### High Priority

- `scripts/team_skills_platform.py`
- `scripts/trigger_gitlab_pipeline.py`

### Medium Priority

- `scripts/run_e2e_test.py` only if we decide to keep a standalone script surface

### Why

#### `scripts/team_skills_platform.py`

- still contains the legacy Python source of truth for platform constants and generation logic
- even though JS generation now exists, leaving this as a large Python implementation keeps conceptual duplication alive
- this is the biggest remaining architectural inconsistency

#### `scripts/trigger_gitlab_pipeline.py`

- still performs real external automation work
- belongs on the same Node operational surface as the rest of the script toolchain

#### `scripts/run_e2e_test.py`

- duplicates what the repository now handles through standard test entrypoints
- is not part of the normal build / validate / install path
- should be retired unless a real operator still depends on it

## Bucket 4: Retire/Delete Instead of Migrating

These look like one-off maintenance, audit, or local debugging tools and should not be migrated unless a current owner explicitly claims them.

- `scripts/_inspect_project_session.py`
- `scripts/_migrate_agent_governance.py`
- `scripts/_register_audit_hooks.py`
- `scripts/_ruoyi_audit_live.py`
- `scripts/_ruoyi_detail.py`
- `scripts/run_e2e_test.py`

### Why

- they are prefixed like internal maintenance tools
- they are not part of the supported installation/build/validate path
- migrating them to JS would create more surface area, not less

### Default Action

1. confirm no runbook depends on them
2. move them to an archive or delete them
3. if retained, label them clearly as internal legacy utilities

## Bucket 5: Structural Python Files That Are Fine To Keep

These are packaging markers, not meaningful migration targets:

- `scripts/__init__.py`
- `scripts/hooks/__init__.py`

## Explicit Python Exception

`scripts/hooks/insaits-security-monitor.py` is now treated as an **explicit supported Python exception**.

### Why

- it is a third-party SDK-facing hook, not core platform generation logic
- the active integration surface is already JS-first through `scripts/hooks/insaits-security-wrapper.js`
- forcing an immediate port would couple this migration to the external InsAIts Python SDK behavior

### Required Guardrails

1. keep the JS wrapper as the canonical entrypoint
2. document clearly that the monitor is a Python implementation behind a JS wrapper
3. do not expand Python usage from this hook into the rest of the platform

### Recommendation

Ignore them until the Python compatibility layer is fully retired. At that point they can disappear with the rest of the Python package surface.

## Recommended Next Wave

If the goal is to reduce Python without destabilizing the repository, the next wave should be:

1. migrate `scripts/team_skills_platform.py`
2. migrate `scripts/trigger_gitlab_pipeline.py`
3. retire `scripts/run_e2e_test.py` unless an owner claims it
4. keep `scripts/hooks/insaits-security-monitor.py` as a documented Python exception behind the JS wrapper
5. explicitly defer the Python hook/lib compatibility layer until a dedicated cleanup pass

## Non-Goals For The Next Wave

The next wave should **not** try to:

- delete all Python immediately
- rewrite test imports and hook compatibility at the same time as generator migration
- migrate one-off `_*.py` utilities without confirming they are still needed

## Decision Table

| File Group | Status | Recommended Action |
|---|---|---|
| JS-backed entrypoint shims | acceptable temporary state | keep until callers are cleaned up |
| Python hook/lib compatibility layer | intentional technical debt | defer to dedicated hook/test cleanup |
| `team_skills_platform.py` | unresolved core duplication | migrate next |
| `trigger_gitlab_pipeline.py` | unresolved operational Python | migrate next |
| `run_e2e_test.py` | no longer justified on main path | retire unless reclaimed |
| `hooks/insaits-security-monitor.py` | explicit third-party exception | keep behind JS wrapper |
| `_*.py` maintenance scripts | likely dead weight | retire/delete unless owned |

## Suggested Acceptance Criteria For “Python Mostly Cleared”

We should only claim the repository is effectively JS-first when:

1. all active operational scripts use JS as the primary implementation
2. the only remaining Python files are either:
   - compatibility shims, or
   - explicitly documented exceptions
3. every remaining Python file has an owner and a stated reason to exist
