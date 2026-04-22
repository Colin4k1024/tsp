# Scripts Python-to-JS Migration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the Team Skills Platform's core `scripts/` execution path from Python to JavaScript so that build, generation, and validation workflows run natively in the repository's existing Node.js toolchain.

**Architecture:** Replace the current Python-centered platform pipeline with a JS-first pipeline in layers. First migrate shared runtime utilities, then the artifact generator, then the validation chain, while keeping generated output and workflow-gate behavior equivalent to the current implementation.

**Tech Stack:** Node.js 18+, existing `package.json` scripts, repository markdown/templates/roles/commands, filesystem-based code generation, audit logging, validation fixtures.

---

## 1. Background

The repository already uses Node.js as its primary package/tooling surface, but the platform core still depends on Python for:

- artifact generation
- library validation
- workflow-gate validation
- local audit logging

This creates three problems:

1. The build and validation path is split across two runtimes.
2. The platform's most critical governance logic now lives in Python, while the surrounding repo tooling is JS-first.
3. Every future platform change risks duplicating utility logic across Python and JS.

This migration formalizes a JS-first platform core.

## 2. Migration Scope

### 2.1 In Scope

This migration covers the core platform path only:

- [scripts/lib/team-skills-platform.js](../../scripts/lib/team-skills-platform.js)
- [scripts/build-platform-artifacts.js](../../scripts/build-platform-artifacts.js)
- [scripts/validate-library.js](../../scripts/validate-library.js)
- [scripts/validate-workflow-state.js](../../scripts/validate-workflow-state.js)
- [scripts/lib/audit-logger.js](../../scripts/lib/audit-logger.js)

### 2.2 Out of Scope

These Python scripts are not part of the first migration wave:

- [scripts/install-platform.js](../../scripts/install-platform.js)
- [scripts/query-audit-logs.js](../../scripts/query-audit-logs.js)
- [scripts/scan-leaked-keys.js](../../scripts/scan-leaked-keys.js)
- [scripts/langfuse-trace.js](../../scripts/langfuse-trace.js)
- [scripts/trigger-gitlab-pipeline.js](../../scripts/trigger-gitlab-pipeline.js)
- `scripts/run-e2e-test.js` (已废弃，无 JS 等价物)

These can be migrated later after the platform core is stable.

## 3. Target End State

After this migration:

- `npm run build` uses JS only
- `npm run validate` uses JS only
- core platform generation no longer depends on Python
- workflow-gate validation no longer depends on Python
- generated artifacts remain equivalent to the current implementation
- Python entrypoints for the migrated path can be removed or retained only as thin compatibility shims during transition

## 4. Success Criteria

The migration is complete only when all of the following are true:

1. A JS artifact generator can compute and write all expected generated files.
2. A JS validation entrypoint can replace the current Python validation path.
3. Workflow-state validation behaves the same as the current fixture-based Python validator.
4. `package.json` no longer routes core build/validate through Python.
5. Repository docs no longer instruct users to run Python for the migrated scripts.
6. Generated output diff is either identical or intentionally reviewed and accepted.

## 5. Proposed File Layout

Recommended JS replacements:

- `scripts/lib/audit-logger.js`
- `scripts/lib/team-skills-platform.js`
- `scripts/build-platform-artifacts.js`
- `scripts/validate-library.js`
- `scripts/validate-workflow-state.js`

Optional compatibility wrappers during transition:

- keep Python files temporarily, but reduce them to delegating wrappers
- or update shell/PowerShell wrappers directly to JS and retire Python immediately

## 6. Execution Strategy

Use an incremental migration instead of a big-bang rewrite.

### Phase 1: Shared Utility Layer

Build the common JS foundation first.

Deliverables:

- JS audit logger with writable-root fallback behavior
- reusable file IO helpers
- reusable frontmatter parsing helpers
- reusable markdown/link/path validation helpers

Primary outputs:

- `scripts/lib/audit-logger.js`
- utility helpers colocated under `scripts/lib/`

Acceptance:

- audit events can be emitted from JS scripts
- local fallback behavior matches the current Python behavior

### Phase 2: Core Generator Migration

Migrate the platform generator logic from Python into JS.

Deliverables:

- JS implementation of role loading
- JS rendering of generated role prompts
- JS rendering of generated commands
- JS expected-artifacts computation
- JS write/check mode equivalent to the current generator

Primary outputs:

- `scripts/lib/team-skills-platform.js`
- `scripts/build-platform-artifacts.js`

Acceptance:

- generated artifact check passes
- regenerated output matches current expected output

### Phase 3: Workflow Validator Migration

Migrate workflow-state validation into JS without changing behavior.

Deliverables:

- JS validation for:
  - required artifact presence
  - delivery-plan gate markers
  - arch-design presence when applicable
  - handoff readiness fields
  - legal phase transition rules

Primary outputs:

- `scripts/validate-workflow-state.js`

Acceptance:

- current valid fixture passes
- current invalid fixtures fail with clear errors

### Phase 4: Library Validator Migration

Migrate the repo-wide library validator to JS and wire in the workflow validator.

Deliverables:

- required file checks
- generated artifact consistency checks
- skill catalog checks
- markdown link checks
- workflow fixture checks

Primary outputs:

- `scripts/validate-library.js`

Acceptance:

- the JS validator covers the same effective validation surface as the Python path for migrated components

### Phase 5: Entry Point and Documentation Cutover

Switch repository entrypoints and docs to JS.

Deliverables:

- update [package.json](../../package.json)
- update:
  - [scripts/build-platform-artifacts.sh](../../scripts/build-platform-artifacts.sh)
  - [scripts/build-platform-artifacts.ps1](../../scripts/build-platform-artifacts.ps1)
  - [scripts/validate-library.sh](../../scripts/validate-library.sh)
  - [scripts/validate-library.ps1](../../scripts/validate-library.ps1)
- update all operational docs that still instruct Python use for the migrated scripts

Acceptance:

- build and validate commands shown to users are JS-native

### Phase 6: Python Retirement

Once the JS path is stable:

- remove migrated Python implementations
- or keep only temporary compatibility stubs with a clear removal deadline

Acceptance:

- there is a single authoritative implementation for core platform generation/validation

## 7. Recommended Task Breakdown

### Workstream A: Generator Path

Files:

- `scripts/lib/team-skills-platform.js`
- `scripts/build-platform-artifacts.js`
- `scripts/lib/audit-logger.js`

JS targets:

- `scripts/lib/team-skills-platform.js`
- `scripts/build-platform-artifacts.js`
- `scripts/lib/audit-logger.js`

Why first:

- highest leverage
- unblocks JS-native generation
- reduces future platform change cost the most

### Workstream B: Validation Path

Files:

- `scripts/validate-workflow-state.js`
- `scripts/validate-library.js`

JS targets:

- `scripts/validate-workflow-state.js`
- `scripts/validate-library.js`

Why second:

- depends on generator outputs
- easier to validate after generation parity exists

### Workstream C: Entry Point Cutover

Files:

- `package.json`
- shell wrappers
- PowerShell wrappers
- docs references

Why third:

- should happen only after JS scripts are already stable

## 8. Risks and Controls

### Risk 1: Output drift during generator migration

Problem:
- generated markdown/manifests may change subtly

Mitigation:
- keep snapshot/equivalence checks
- compare expected outputs before cutover
- treat any output delta as reviewable, not accidental

### Risk 2: Validation parity gaps

Problem:
- JS validator may miss checks the Python version had

Mitigation:
- port by category, not file-by-file intuition
- keep fixture-based tests
- verify each validation concern explicitly

### Risk 3: Mixed-runtime confusion during transition

Problem:
- contributors may keep using Python commands while JS becomes canonical

Mitigation:
- switch `package.json` early once stable
- update AGENTS/README/runbooks in the same cutover
- optionally leave deprecation shims with explicit warnings

### Risk 4: Regressions in workflow-gate enforcement

Problem:
- new gate logic was just introduced and must not be weakened

Mitigation:
- treat workflow fixtures as blocking regression tests
- do not rewrite gate semantics during migration
- migrate behavior first, refactor second

## 9. Testing and Verification Plan

The migration must include these checks:

1. Generator parity check
2. Workflow fixture validation
3. Library validation check
4. Targeted unit tests for parser/renderer helpers
5. Manual spot-check of generated:
- role prompts
- team commands
- plugin manifests

Suggested verification commands after JS cutover:

```bash
npm run build
npm run validate
npm test
```

## 10. Rollout Recommendation

Do this as two PRs or two tightly scoped implementation waves.

### Recommended Wave 1

Migrate:

- audit logger
- team skills generator core
- build entrypoint

Reason:
- smallest high-value slice
- immediately removes Python from the generation path

### Recommended Wave 2

Migrate:

- workflow validator
- library validator
- package/documentation cutover

Reason:
- depends on wave 1 parity
- lets validation migration build on the stable JS generator

## 11. Final Recommendation

The best first implementation slice is:

1. migrate [team-skills-platform.js](../../scripts/lib/team-skills-platform.js)
2. migrate [build-platform-artifacts.js](../../scripts/build-platform-artifacts.js)
3. migrate [audit-logger.js](../../scripts/lib/audit-logger.js)

This gives the repository a JS-native generation core with the least coordination risk. After that, migrate the validators and switch the user-facing commands.

## 12. Deliverable Checklist

- [ ] JS audit logger exists and is wired into JS entrypoints
- [ ] JS generator exists and produces equivalent outputs
- [ ] JS build entrypoint replaces Python build entrypoint
- [ ] JS workflow validator exists and passes current fixtures
- [ ] JS library validator exists and replaces Python validate entrypoint
- [ ] `package.json` scripts are JS-native for build/validate
- [ ] Docs no longer direct users to Python for migrated scripts
- [ ] Deprecated Python entrypoints are removed or explicitly marked temporary
