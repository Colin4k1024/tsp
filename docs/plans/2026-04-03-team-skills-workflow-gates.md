# Team Skills Workflow Gates Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> Historical snapshot: this plan records an earlier Python-first implementation path.  
> Command mapping for current runtime:  
> `python3 scripts/build_platform_artifacts.py` -> `node scripts/build-platform-artifacts.js`  
> `python3 scripts/validate_library.py` -> `node scripts/validate-library.js`

**Goal:** Prevent Team Skills from entering `/team-plan` or `/team-execute` before requirement analysis, dynamic discussion, design convergence, and structured handoff are complete.

**Architecture:** Promote workflow governance from documentation-only guidance into executable gates. The canonical source stays in `roles/*/role.yaml` and runbooks, but generated commands, generated role prompts, and a new workflow validator will enforce stage transitions before planning and execution can continue.

**Tech Stack:** Python generation scripts (historical context), Markdown templates, role YAML, command docs, runbook docs, repository validation scripts.

---

### Task 1: Define the target workflow state machine

**Files:**
- Modify: `docs/runbooks/sub-agent-invocation-map.md`
- Modify: `docs/runbooks/team-command-output-contracts.md`
- Modify: `rules/team-operating-model.md`
- Reference: `roles/tech-lead/role.yaml`

**Step 1: Add explicit workflow phases**

Define the required phase sequence and transition rules:

- `intake`
- `requirement-challenge`
- `design-swarm`
- `design-review`
- `handoff-ready`
- `execute`
- `review`
- `release`

Each phase must list:
- required artifacts
- required participants
- required challenge records
- allowed next phases
- blocking conditions

**Step 2: Define transition blockers**

Document that these conditions block transition:

- no `Requirement Challenge Session Log`
- no dynamic discussion output
- no `Design Review Board` conclusion
- no `/handoff`
- no downstream challenge record
- missing required artifacts for current phase

**Step 3: Make `/team-plan` and `/team-execute` phase-aware**

Update the docs so:

- `/team-plan` produces planning artifacts but cannot mark work as implementation-ready until challenge and design review are complete
- `/team-execute` requires workflow state `handoff-ready`

**Step 4: Verify documentation consistency**

Run:

```bash
rg -n "Requirement Challenge Session|Design Review Board|handoff-ready|dynamic discussion|design-swarm" docs/runbooks rules
```

Expected:
- the new workflow phases and blockers appear in the main governance docs

**Step 5: Commit**

```bash
git add docs/runbooks/sub-agent-invocation-map.md docs/runbooks/team-command-output-contracts.md rules/team-operating-model.md
git commit -m "docs: define workflow gates for team skills"
```

### Task 2: Extend canonical role schema with enforceable gate metadata

**Files:**
- Modify: `roles/tech-lead/role.yaml`
- Modify: `roles/architect/role.yaml`
- Modify: `roles/backend-engineer/role.yaml`
- Modify: `roles/frontend-engineer/role.yaml`
- Modify: `roles/qa-engineer/role.yaml`
- Modify: `roles/project-manager/role.yaml`
- Modify: `roles/product-manager/role.yaml`
- Modify: `roles/devops-engineer/role.yaml`
- Modify: `scripts/team_skills_platform.py`

**Step 1: Add normalized gate fields to role YAML**

Introduce structured fields such as:

```json
"workflow_gates": {
  "requires_input_artifacts": ["prd", "delivery-plan", "handoff"],
  "requires_phase": "design-review",
  "requires_handoff": true,
  "requires_downstream_challenge": true,
  "block_on_missing": [
    "requirement_challenge_log",
    "design_review_conclusion"
  ]
}
```

Use role-specific values instead of one shared default.

**Step 2: Normalize challenge metadata**

Keep `upstream_challenge`, but ensure every role has:

- trigger
- mandatory questions
- required output location
- blocking behavior

**Step 3: Update the Python loader**

Teach `scripts/team_skills_platform.py` to:

- validate the new schema
- fail generation when mandatory gate fields are absent
- expose normalized gate values to templates

**Step 4: Verify schema completeness**

Run:

```bash
python3 scripts/build_platform_artifacts.py (historical; current: node scripts/build-platform-artifacts.js) --check
```

Expected:
- generation check passes with the new schema

**Step 5: Commit**

```bash
git add roles scripts/team_skills_platform.py
git commit -m "feat: add enforceable workflow gate metadata to role schema"
```

### Task 3: Render hard gates into generated role prompts

**Files:**
- Modify: `templates/system/agent-role.md.tmpl`
- Modify: `scripts/team_skills_platform.py`
- Generated: `agents/roles/*.md`

**Step 1: Add a dedicated gate section to role prompts**

Render these blocks into every generated role prompt:

- workflow prerequisites
- mandatory challenge questions
- stop conditions
- escalation rules
- explicit “do not continue” instructions

**Step 2: Make stop conditions operational**

The generated prompt should contain language like:

- if required artifacts are missing, stop and request them
- if challenge log is missing, stop
- if design review is incomplete, stop
- if no handoff exists, stop

**Step 3: Preserve existing quality gates**

Do not replace `质量门禁`; add a stronger `执行前检查` or `硬门禁` section ahead of execution instructions.

**Step 4: Regenerate and inspect prompts**

Run:

```bash
python3 scripts/build_platform_artifacts.py (historical; current: node scripts/build-platform-artifacts.js)
rg -n "缺少|停止|handoff|Requirement Challenge Session|Design Review Board|下游质疑" agents/roles
```

Expected:
- generated role prompts now include explicit blocking language

**Step 5: Commit**

```bash
git add templates/system/agent-role.md.tmpl scripts/team_skills_platform.py agents/roles
git commit -m "feat: render workflow stop-gates into generated role prompts"
```

### Task 4: Rewrite `/team-plan` as a gated design-convergence command

**Files:**
- Modify: `commands/team-plan.md`
- Modify: command definition in `scripts/team_skills_platform.py`
- Generated: `commands/team-plan.md`

**Step 1: Change `/team-plan` output contract**

Make `/team-plan` produce these sections in order:

1. readiness check
2. dynamic discussion group
3. Requirement Challenge Session Log
4. parallel design outputs
5. Design Review Board conclusion
6. delivery plan
7. handoff requirements for execute

**Step 2: Make dynamic grouping explicit**

Add a required matrix like:

| Trigger | Required roles |
|---------|----------------|
| backend/data/integration | tech-lead + architect + backend-engineer + project-manager |
| UI/frontend | tech-lead + product-manager + ui-ux-designer + frontend-engineer |
| fullstack/core flow | tech-lead + product-manager + architect + frontend-engineer + backend-engineer + project-manager |
| release/env risk | add devops-engineer |

**Step 3: Require challenge completion before plan freeze**

State clearly that delivery planning cannot be marked complete until:

- at least 3 core assumptions are challenged
- every required role returns a challenge result
- tech-lead writes a convergence decision

**Step 4: Keep parallel design, but move it after challenge**

Parallel design stays, but only after discussion framing is complete.

**Step 5: Regenerate and inspect**

Run:

```bash
python3 scripts/build_platform_artifacts.py (historical; current: node scripts/build-platform-artifacts.js)
sed -n '1,220p' commands/team-plan.md
```

Expected:
- `/team-plan` now reads like a gated convergence workflow, not a direct planning shortcut

**Step 6: Commit**

```bash
git add commands/team-plan.md scripts/team_skills_platform.py
git commit -m "feat: gate team-plan with challenge and design convergence"
```

### Task 5: Rewrite `/team-execute` to require readiness proof

**Files:**
- Modify: `commands/team-execute.md`
- Modify: command definition in `scripts/team_skills_platform.py`
- Generated: `commands/team-execute.md`

**Step 1: Add prerequisite checklist**

Before implementation, require proof of:

- `prd.md`
- `delivery-plan.md`
- `arch-design.md` when applicable
- `Requirement Challenge Session Log`
- `Design Review Board` conclusion
- latest `/handoff`
- downstream challenge record

**Step 2: Refuse execution if prerequisites are missing**

Add explicit blocking instructions:

- do not start code changes
- do not produce implementation steps
- return missing prerequisites and next owner

**Step 3: Force execute to start from handoff review**

The first execution step should be:

- read handoff
- write downstream challenge
- confirm design acceptance or escalate

Only then can implementation begin.

**Step 4: Regenerate and inspect**

Run:

```bash
python3 scripts/build_platform_artifacts.py (historical; current: node scripts/build-platform-artifacts.js)
sed -n '1,220p' commands/team-execute.md
```

Expected:
- `/team-execute` now requires readiness proof instead of assuming readiness

**Step 5: Commit**

```bash
git add commands/team-execute.md scripts/team_skills_platform.py
git commit -m "feat: require readiness proof before team-execute"
```

### Task 6: Turn handoff into a formal phase-transition artifact

**Files:**
- Modify: `commands/handoff.md`
- Modify: `rules/handoff-contract.md`
- Modify: `docs/runbooks/handoff-governance.md`
- Modify: `docs/runbooks/team-command-output-contracts.md`

**Step 1: Add phase-transition semantics**

Document that `/handoff` is not just a summary. It is the required transition proof between role-owned phases.

**Step 2: Add readiness fields**

Require fields such as:

- `current_phase`
- `target_phase`
- `readiness_status`
- `blocking_items`
- `accepted_by`
- `downstream_challenge_record`

**Step 3: Add rejection behavior**

Document that downstream can:

- accept
- request clarification
- reject and return
- escalate to tech-lead

**Step 4: Verify consistency**

Run:

```bash
rg -n "readiness_status|target_phase|accepted_by|downstream_challenge_record" commands rules docs/runbooks
```

Expected:
- handoff docs consistently define the new transition semantics

**Step 5: Commit**

```bash
git add commands/handoff.md rules/handoff-contract.md docs/runbooks/handoff-governance.md docs/runbooks/team-command-output-contracts.md
git commit -m "feat: make handoff a formal workflow transition artifact"
```

### Task 7: Add a machine-checkable workflow validator

**Files:**
- Create: `scripts/validate_workflow_state.py`
- Create or Modify: `tests/` or `scripts/` validation tests matching repo conventions
- Modify: `scripts/validate_library.py` (historical; current path: `scripts/validate-library.js`)
- Modify: `docs/runbooks/team-skills-usage.md`

**Step 1: Implement validator inputs**

The validator should inspect:

- artifact directory contents
- handoff files
- required frontmatter
- presence of challenge/design-review sections
- phase transition legality

**Step 2: Implement failure modes**

Examples:

- execute requested without handoff
- design review missing for fullstack task
- downstream challenge missing
- plan marked ready while blockers remain

**Step 3: Integrate with repository validation**

Make `python3 scripts/validate_library.py (historical; current: node scripts/validate-library.js)` call the workflow validator against representative examples or fixtures.

**Step 4: Verify**

Run:

```bash
python3 scripts/validate_library.py (historical; current: node scripts/validate-library.js)
```

Expected:
- validator passes on valid examples
- validator fails on broken fixtures

**Step 5: Commit**

```bash
git add scripts/validate_workflow_state.py scripts/validate_library.py docs/runbooks/team-skills-usage.md
git commit -m "feat: add workflow-state validation for team skills"
```

### Task 8: Add fixtures and regression tests for legal and illegal flows

**Files:**
- Create: `tests/fixtures/workflow-valid/` or repo-appropriate fixture path
- Create: `tests/fixtures/workflow-invalid-missing-handoff/`
- Create: `tests/fixtures/workflow-invalid-missing-challenge/`
- Create: `tests/fixtures/workflow-invalid-missing-design-review/`
- Create: matching tests in repo test convention

**Step 1: Build a minimal valid fixture**

Include:

- `prd.md`
- `delivery-plan.md`
- `arch-design.md` where needed
- a valid handoff
- challenge log
- design review conclusion

**Step 2: Build invalid fixtures**

One fixture per broken condition:

- missing handoff
- missing challenge
- missing design review
- missing downstream challenge

**Step 3: Add tests**

Assert:

- valid fixture passes
- invalid fixtures fail with specific messages

**Step 4: Verify**

Run the repository test command that covers script validation.

Expected:
- clear pass/fail behavior for workflow governance regressions

**Step 5: Commit**

```bash
git add tests
git commit -m "test: add workflow gate regression coverage"
```

### Task 9: Add example artifacts that demonstrate the new flow

**Files:**
- Modify: `docs/runbooks/team-intake-example.md`
- Modify: `docs/runbooks/team-plan-example.md`
- Modify: `docs/runbooks/team-handoff-example.md`
- Modify: `docs/runbooks/team-execute-example.md`
- Modify: `docs/runbooks/first-team-workflow-walkthrough.md`

**Step 1: Update examples to show the new phases**

Make examples demonstrate:

- challenge before plan freeze
- dynamic group composition
- design review before execute
- downstream challenge after handoff

**Step 2: Add one “blocked flow” example**

Show what the system should output when someone tries to execute too early.

**Step 3: Verify**

Run:

```bash
rg -n "blocked|Requirement Challenge Session|Design Review Board|下游质疑" docs/runbooks
```

Expected:
- examples reinforce the desired behavior instead of the old shortcut flow

**Step 4: Commit**

```bash
git add docs/runbooks
git commit -m "docs: update examples for gated workflow behavior"
```

### Task 10: Final regeneration and full verification

**Files:**
- Modify: generated artifacts as needed

**Step 1: Rebuild generated artifacts**

Run:

```bash
python3 scripts/build_platform_artifacts.py (historical; current: node scripts/build-platform-artifacts.js)
```

Expected:
- generated commands and agents reflect the new gates

**Step 2: Run repository validation**

Run:

```bash
python3 scripts/validate_library.py (historical; current: node scripts/validate-library.js)
```

Expected:
- library validation passes

**Step 3: Review diff**

Run:

```bash
git diff --stat
git diff -- commands roles scripts templates docs/runbooks
```

Expected:
- all governance changes are coherent across canonical, generated, and docs layers

**Step 4: Final commit**

```bash
git add commands roles scripts templates docs/runbooks tests
git commit -m "feat: enforce gated team-skills workflow"
```
