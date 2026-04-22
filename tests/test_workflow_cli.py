from __future__ import annotations

import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

READINESS_STATUS_BY_TARGET = {
    "execute": "handoff-ready",
    "review": "ready-for-review",
    "release": "release-ready",
    "closeout": "accepted",
}
FIXTURES = ROOT / "tests" / "fixtures" / "workflow-engine"


def run_node(args: list[str]) -> subprocess.CompletedProcess[str]:
    with tempfile.TemporaryDirectory() as home_dir:
        env = os.environ.copy()
        env["HOME"] = home_dir
        env["USERPROFILE"] = home_dir
        return subprocess.run(
            ["node", *args],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
            env=env,
        )


def create_phase_ready_task_dir(
    tmpdir: str,
    *,
    current_phase: str,
    target_phase: str,
    include_release_artifacts: bool = False,
) -> Path:
    source_dir = ROOT / "tests" / "fixtures" / "workflow-valid"
    task_dir = Path(tmpdir) / f"workflow-{target_phase}-valid"
    shutil.copytree(source_dir, task_dir)

    handoff_path = task_dir / "handoffs" / "001-tech-lead-to-backend-engineer.md"
    handoff_text = handoff_path.read_text(encoding="utf-8")
    handoff_text = handoff_text.replace(
        "current_phase: handoff-ready",
        f"current_phase: {current_phase}",
        1,
    )
    handoff_text = handoff_text.replace(
        "target_phase: execute",
        f"target_phase: {target_phase}",
        1,
    )
    handoff_text = handoff_text.replace(
        "readiness_status: handoff-ready",
        f"readiness_status: {READINESS_STATUS_BY_TARGET[target_phase]}",
        1,
    )
    handoff_text = handoff_text.replace(
        "## current_phase\n\nhandoff-ready",
        f"## current_phase\n\n{current_phase}",
        1,
    )
    handoff_text = handoff_text.replace(
        "## target_phase\n\nexecute",
        f"## target_phase\n\n{target_phase}",
        1,
    )
    handoff_text = handoff_text.replace(
        "## readiness_status\n\nhandoff-ready",
        f"## readiness_status\n\n{READINESS_STATUS_BY_TARGET[target_phase]}",
        1,
    )
    handoff_path.write_text(handoff_text, encoding="utf-8")

    if target_phase in {"review", "release", "closeout"}:
        (task_dir / "execute-log.md").write_text(
            "---\nartifact: execute-log\ntask: workflow-valid\ndate: 2026-04-11\nrole: backend-engineer\nstatus: finalized\n---\n\n# Execute Log\n",
            encoding="utf-8",
        )

    if target_phase in {"release", "closeout"} or include_release_artifacts:
        (task_dir / "test-plan.md").write_text(
            "---\nartifact: test-plan\ntask: workflow-valid\ndate: 2026-04-11\nrole: qa-engineer\nstatus: finalized\n---\n\n# Test Plan\n",
            encoding="utf-8",
        )
        (task_dir / "launch-acceptance.md").write_text(
            "---\nartifact: launch-acceptance\ntask: workflow-valid\ndate: 2026-04-11\nrole: qa-engineer\nstatus: accepted\n---\n\n# Launch Acceptance\n",
            encoding="utf-8",
        )

    if include_release_artifacts:
        (task_dir / "deployment-context.md").write_text(
            "---\nartifact: deployment-context\ntask: workflow-valid\ndate: 2026-04-11\nrole: devops-engineer\nstatus: finalized\n---\n\n# Deployment Context\n",
            encoding="utf-8",
        )
        (task_dir / "release-plan.md").write_text(
            "---\nartifact: release-plan\ntask: workflow-valid\ndate: 2026-04-11\nrole: devops-engineer\nstatus: finalized\n---\n\n# Release Plan\n",
            encoding="utf-8",
        )

    return task_dir


class WorkflowCliTest(unittest.TestCase):
    def test_workflow_run_script_executes_and_persists(self) -> None:
        workflow_path = FIXTURES / "valid" / "cli-smoke.yaml"
        with tempfile.TemporaryDirectory() as tmpdir:
            state_db = Path(tmpdir) / "workflow-state.db"
            result = run_node([
                "scripts/workflow-run.js",
                "--file",
                str(workflow_path),
                "--state-db",
                str(state_db),
                "--run-id",
                "cli-run-1",
                "--json",
            ])
            self.assertEqual(result.returncode, 0, result.stderr)
            payload = json.loads(result.stdout)
            self.assertEqual(payload["runId"], "cli-run-1")
            self.assertEqual(payload["workflowName"], "cli-smoke")
            self.assertEqual(payload["inputContext"], {})
            self.assertEqual(payload["status"], "succeeded")
            self.assertEqual(payload["nodeStatuses"]["shell-check"], "succeeded")
            self.assertEqual(payload["nodeStatuses"]["handoff"], "succeeded")

            list_result = run_node([
                "scripts/workflow-runs.js",
                "--state-db",
                str(state_db),
            ])
            self.assertEqual(list_result.returncode, 0, list_result.stderr)
            self.assertIn("Workflow runs:", list_result.stdout)
            self.assertIn("cli-run-1 cli-smoke [succeeded]", list_result.stdout)
            self.assertIn("vars=none", list_result.stdout)
            self.assertIn("started=", list_result.stdout)

            list_json_result = run_node([
                "scripts/workflow-runs.js",
                "--state-db",
                str(state_db),
                "--workflow-name",
                "cli-smoke",
                "--status",
                "succeeded",
                "--json",
            ])
            self.assertEqual(list_json_result.returncode, 0, list_json_result.stderr)
            list_payload = json.loads(list_json_result.stdout)
            self.assertEqual(len(list_payload), 1)
            self.assertEqual(list_payload[0]["id"], "cli-run-1")

            empty_filter_result = run_node([
                "scripts/workflow-runs.js",
                "--state-db",
                str(state_db),
                "--workflow-name",
                "missing-workflow",
                "--json",
            ])
            self.assertEqual(empty_filter_result.returncode, 0, empty_filter_result.stderr)
            self.assertEqual(json.loads(empty_filter_result.stdout), [])

            detail_result = run_node([
                "scripts/workflow-runs.js",
                "--state-db",
                str(state_db),
                "--run-id",
                "cli-run-1",
            ])
            self.assertEqual(detail_result.returncode, 0, detail_result.stderr)
            self.assertIn("Workflow run cli-run-1: cli-smoke [succeeded]", detail_result.stdout)
            self.assertIn("Input context: none", detail_result.stdout)
            self.assertIn("Started:", detail_result.stdout)
            self.assertIn("Finished:", detail_result.stdout)
            self.assertIn("Events:", detail_result.stdout)

            detail_json_result = run_node([
                "scripts/workflow-runs.js",
                "--state-db",
                str(state_db),
                "--run-id",
                "cli-run-1",
                "--json",
            ])
            self.assertEqual(detail_json_result.returncode, 0, detail_json_result.stderr)
            detail_payload = json.loads(detail_json_result.stdout)
            self.assertEqual(detail_payload["id"], "cli-run-1")
            self.assertEqual(detail_payload["workflowName"], "cli-smoke")
            self.assertTrue(detail_payload["workflowFingerprint"])
            self.assertEqual(detail_payload["inputContext"], {})
            self.assertEqual(detail_payload["status"], "succeeded")

    def test_workflow_run_preview_renders_input_context_without_execution(self) -> None:
        task_dir = ROOT / "tests" / "fixtures" / "workflow-valid"
        result = run_node([
            "scripts/workflow-run.js",
            "--name",
            "team-release-readiness",
            "--preview",
            "--var",
            f"taskDir={task_dir}",
            "--var",
            "targetPhase=release",
            "--json",
        ])
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertEqual(payload["workflowName"], "team-release-readiness")
        self.assertEqual(payload["inputContext"]["taskDir"], str(task_dir))
        self.assertEqual(payload["inputContext"]["targetPhase"], "release")
        self.assertEqual(payload["requiredVars"], ["targetPhase", "taskDir"])
        self.assertGreaterEqual(payload["nodeCount"], 1)

    def test_workflow_run_preview_human_output(self) -> None:
        task_dir = ROOT / "tests" / "fixtures" / "workflow-valid"
        result = run_node([
            "scripts/workflow-run.js",
            "--name",
            "team-release-readiness",
            "--preview",
            "--var",
            f"taskDir={task_dir}",
            "--var",
            "targetPhase=release",
        ])
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Workflow preview: team-release-readiness [bundled]", result.stdout)
        self.assertIn("Input context:", result.stdout)
        self.assertIn("taskDir=", result.stdout)
        self.assertIn("targetPhase=release", result.stdout)
        self.assertIn("Nodes:", result.stdout)

    def test_workflow_runs_rejects_invalid_limit(self) -> None:
        negative_result = run_node([
            "scripts/workflow-runs.js",
            "--limit",
            "-5",
        ])
        self.assertNotEqual(negative_result.returncode, 0)
        self.assertIn("--limit must be a positive integer", negative_result.stderr)

        nan_result = run_node([
            "scripts/workflow-runs.js",
            "--limit",
            "abc",
        ])
        self.assertNotEqual(nan_result.returncode, 0)
        self.assertIn("--limit must be a positive integer", nan_result.stderr)

    def test_workflow_run_reports_bash_timeout_failure(self) -> None:
        workflow_path = FIXTURES / "valid" / "timeout-smoke.yaml"
        result = run_node([
            "scripts/workflow-run.js",
            "--file",
            str(workflow_path),
            "--json",
        ])
        self.assertNotEqual(result.returncode, 0)
        payload = json.loads(result.stdout)
        self.assertEqual(payload["workflowName"], "timeout-smoke")
        self.assertEqual(payload["status"], "failed")
        self.assertEqual(payload["nodeStatuses"]["slow-bash"], "failed")

    def test_workflow_run_script_can_resume_failed_run(self) -> None:
        workflow_path = FIXTURES / "valid" / "resume-smoke.yaml"
        fail_handlers = FIXTURES / "handlers" / "resume-fail.js"
        pass_handlers = FIXTURES / "handlers" / "resume-pass.js"
        with tempfile.TemporaryDirectory() as tmpdir:
            state_db = Path(tmpdir) / "workflow-state.db"

            failed_run = run_node([
                "scripts/workflow-run.js",
                "--file",
                str(workflow_path),
                "--handlers",
                str(fail_handlers),
                "--state-db",
                str(state_db),
                "--run-id",
                "resume-run-1",
                "--json",
            ])
            self.assertNotEqual(failed_run.returncode, 0)
            failed_payload = json.loads(failed_run.stdout)
            self.assertEqual(failed_payload["status"], "failed")
            self.assertEqual(failed_payload["nodeStatuses"]["plan"], "succeeded")
            self.assertEqual(failed_payload["nodeStatuses"]["backend"], "failed")
            self.assertEqual(failed_payload["nodeStatuses"]["frontend"], "succeeded")
            self.assertEqual(failed_payload["nodeStatuses"]["review"], "skipped")

            resumed_run = run_node([
                "scripts/workflow-run.js",
                "--resume-run-id",
                "resume-run-1",
                "--handlers",
                str(pass_handlers),
                "--state-db",
                str(state_db),
                "--run-id",
                "resume-run-2",
                "--json",
            ])
            self.assertEqual(resumed_run.returncode, 0, resumed_run.stderr)
            resumed_payload = json.loads(resumed_run.stdout)
            self.assertEqual(resumed_payload["inputContext"], {})
            self.assertEqual(resumed_payload["status"], "succeeded")
            self.assertEqual(resumed_payload["nodeStatuses"]["plan"], "succeeded")
            self.assertEqual(resumed_payload["nodeStatuses"]["backend"], "succeeded")
            self.assertEqual(resumed_payload["nodeStatuses"]["frontend"], "succeeded")
            self.assertEqual(resumed_payload["nodeStatuses"]["review"], "succeeded")

            detail_result = run_node([
                "scripts/workflow-runs.js",
                "--state-db",
                str(state_db),
                "--run-id",
                "resume-run-2",
            ])
            self.assertEqual(detail_result.returncode, 0, detail_result.stderr)
            self.assertIn("Workflow run resume-run-2: resume-smoke [succeeded]", detail_result.stdout)
            self.assertIn("Resumed from: resume-run-1", detail_result.stdout)

            detail_json_result = run_node([
                "scripts/workflow-runs.js",
                "--state-db",
                str(state_db),
                "--run-id",
                "resume-run-2",
                "--json",
            ])
            self.assertEqual(detail_json_result.returncode, 0, detail_json_result.stderr)
            detail_payload = json.loads(detail_json_result.stdout)
            self.assertEqual(detail_payload["resumedFromRunId"], "resume-run-1")
            self.assertEqual(detail_payload["filePath"], str(workflow_path))
            self.assertTrue(detail_payload["workflowFingerprint"])
            self.assertEqual(detail_payload["status"], "succeeded")

    def test_workflow_run_script_rejects_non_failed_resume_run(self) -> None:
        workflow_path = FIXTURES / "valid" / "resume-smoke.yaml"
        pass_handlers = FIXTURES / "handlers" / "resume-pass.js"
        with tempfile.TemporaryDirectory() as tmpdir:
            state_db = Path(tmpdir) / "workflow-state.db"

            initial_run = run_node([
                "scripts/workflow-run.js",
                "--file",
                str(workflow_path),
                "--handlers",
                str(pass_handlers),
                "--state-db",
                str(state_db),
                "--run-id",
                "resume-ok-1",
                "--json",
            ])
            self.assertEqual(initial_run.returncode, 0, initial_run.stderr)

            resumed_run = run_node([
                "scripts/workflow-run.js",
                "--resume-run-id",
                "resume-ok-1",
                "--var",
                "taskDir=changed",
                "--handlers",
                str(pass_handlers),
                "--state-db",
                str(state_db),
                "--run-id",
                "resume-ok-2",
                "--json",
            ])
            self.assertNotEqual(resumed_run.returncode, 0)
            self.assertIn("is not resumable", resumed_run.stderr)

    def test_workflow_run_script_executes_default_readiness_workflow_with_vars(self) -> None:
        task_dir = ROOT / "tests" / "fixtures" / "workflow-valid"
        with tempfile.TemporaryDirectory() as tmpdir:
            state_db = Path(tmpdir) / "workflow-state.db"
            result = run_node([
                "scripts/workflow-run.js",
                "--name",
                "team-execute-readiness",
                "--state-db",
                str(state_db),
                "--run-id",
                "cli-vars-1",
                "--var",
                f"taskDir={task_dir}",
                "--var",
                "targetPhase=execute",
                "--json",
            ])
            self.assertEqual(result.returncode, 0, result.stderr)
            payload = json.loads(result.stdout)
            self.assertEqual(payload["workflowName"], "team-execute-readiness")
            self.assertEqual(payload["inputContext"]["taskDir"], str(task_dir))
            self.assertEqual(payload["inputContext"]["targetPhase"], "execute")
            self.assertEqual(payload["nodeStatuses"]["validate-readiness"], "succeeded")

    def test_workflow_run_script_executes_default_review_readiness_workflow_with_vars(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            task_dir = create_phase_ready_task_dir(tmpdir, current_phase="execute", target_phase="review")
            state_db = Path(tmpdir) / "workflow-state.db"
            result = run_node([
                "scripts/workflow-run.js",
                "--name",
                "team-review-readiness",
                "--state-db",
                str(state_db),
                "--run-id",
                "cli-review-vars-1",
                "--var",
                f"taskDir={task_dir}",
                "--var",
                "targetPhase=review",
                "--json",
            ])
            self.assertEqual(result.returncode, 0, result.stderr)
            payload = json.loads(result.stdout)
            self.assertEqual(payload["workflowName"], "team-review-readiness")
            self.assertEqual(payload["inputContext"]["taskDir"], str(task_dir))
            self.assertEqual(payload["inputContext"]["targetPhase"], "review")
            self.assertEqual(payload["nodeStatuses"]["validate-readiness"], "succeeded")

    def test_workflow_run_script_executes_default_release_readiness_workflow_with_vars(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            task_dir = create_phase_ready_task_dir(tmpdir, current_phase="review", target_phase="release")
            state_db = Path(tmpdir) / "workflow-state.db"
            result = run_node([
                "scripts/workflow-run.js",
                "--name",
                "team-release-readiness",
                "--state-db",
                str(state_db),
                "--run-id",
                "cli-release-vars-1",
                "--var",
                f"taskDir={task_dir}",
                "--var",
                "targetPhase=release",
                "--json",
            ])
            self.assertEqual(result.returncode, 0, result.stderr)
            payload = json.loads(result.stdout)
            self.assertEqual(payload["workflowName"], "team-release-readiness")
            self.assertEqual(payload["inputContext"]["taskDir"], str(task_dir))
            self.assertEqual(payload["inputContext"]["targetPhase"], "release")
            self.assertEqual(payload["nodeStatuses"]["validate-readiness"], "succeeded")

    def test_workflow_run_script_executes_default_closeout_readiness_workflow_with_vars(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            task_dir = create_phase_ready_task_dir(
                tmpdir,
                current_phase="release",
                target_phase="closeout",
                include_release_artifacts=True,
            )
            state_db = Path(tmpdir) / "workflow-state.db"
            result = run_node([
                "scripts/workflow-run.js",
                "--name",
                "team-closeout-readiness",
                "--state-db",
                str(state_db),
                "--run-id",
                "cli-closeout-vars-1",
                "--var",
                f"taskDir={task_dir}",
                "--var",
                "targetPhase=closeout",
                "--json",
            ])
            self.assertEqual(result.returncode, 0, result.stderr)
            payload = json.loads(result.stdout)
            self.assertEqual(payload["workflowName"], "team-closeout-readiness")
            self.assertEqual(payload["inputContext"]["taskDir"], str(task_dir))
            self.assertEqual(payload["inputContext"]["targetPhase"], "closeout")
            self.assertEqual(payload["nodeStatuses"]["validate-readiness"], "succeeded")

    def test_workflow_run_reports_all_missing_vars_at_once(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            state_db = Path(tmpdir) / "workflow-state.db"
            result = run_node([
                "scripts/workflow-run.js",
                "--name",
                "team-release-readiness",
                "--state-db",
                str(state_db),
                "--run-id",
                "missing-vars-1",
                "--json",
            ])
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('Workflow "team-release-readiness" is missing required variables', result.stderr)
            self.assertIn("taskDir", result.stderr)
            self.assertIn("targetPhase", result.stderr)
            self.assertIn("Required vars for this workflow: targetPhase, taskDir", result.stderr)
            self.assertIn('npm run workflow:list', result.stderr)

    def test_workflow_run_reports_single_missing_var(self) -> None:
        task_dir = ROOT / "tests" / "fixtures" / "workflow-valid"
        with tempfile.TemporaryDirectory() as tmpdir:
            state_db = Path(tmpdir) / "workflow-state.db"
            result = run_node([
                "scripts/workflow-run.js",
                "--name",
                "team-release-readiness",
                "--state-db",
                str(state_db),
                "--run-id",
                "missing-vars-2",
                "--var",
                f"taskDir={task_dir}",
                "--json",
            ])
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('Workflow "team-release-readiness" is missing required variable', result.stderr)
            self.assertIn("targetPhase", result.stderr)
            self.assertIn("Provide it with --var key=value", result.stderr)

    def test_workflow_run_reports_missing_vars_from_all_nodes(self) -> None:
        workflow_path = FIXTURES / "valid" / "multi-var.yaml"
        with tempfile.TemporaryDirectory() as tmpdir:
            state_db = Path(tmpdir) / "workflow-state.db"
            result = run_node([
                "scripts/workflow-run.js",
                "--file",
                str(workflow_path),
                "--state-db",
                str(state_db),
                "--run-id",
                "missing-vars-3",
                "--json",
            ])
            self.assertNotEqual(result.returncode, 0)
            self.assertIn('Workflow "multi-var-test" is missing required variables', result.stderr)
            self.assertIn("var1", result.stderr)
            self.assertIn("var2", result.stderr)
            self.assertIn("var3", result.stderr)

    def test_workflow_run_script_rejects_changed_workflow_definition(self) -> None:
        source_workflow_path = FIXTURES / "valid" / "resume-smoke.yaml"
        fail_handlers = FIXTURES / "handlers" / "resume-fail.js"
        pass_handlers = FIXTURES / "handlers" / "resume-pass.js"
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir_path = Path(tmpdir)
            workflow_path = tmpdir_path / "resume-smoke.yaml"
            shutil.copyfile(source_workflow_path, workflow_path)
            state_db = tmpdir_path / "workflow-state.db"

            initial_run = run_node([
                "scripts/workflow-run.js",
                "--file",
                str(workflow_path),
                "--handlers",
                str(fail_handlers),
                "--state-db",
                str(state_db),
                "--run-id",
                "resume-fingerprint-1",
                "--json",
            ])
            self.assertNotEqual(initial_run.returncode, 0)

            original_content = workflow_path.read_text(encoding="utf-8")
            workflow_path.write_text(
                original_content.replace(
                    "bash: placeholder-backend",
                    "bash: placeholder-backend-v2",
                ),
                encoding="utf-8",
            )

            resumed_run = run_node([
                "scripts/workflow-run.js",
                "--resume-run-id",
                "resume-fingerprint-1",
                "--handlers",
                str(pass_handlers),
                "--state-db",
                str(state_db),
                "--run-id",
                "resume-fingerprint-2",
                "--json",
            ])
            self.assertNotEqual(resumed_run.returncode, 0)
            self.assertIn("workflow definition changed", resumed_run.stderr)

    def test_workflow_run_script_rejects_changed_input_context_on_resume(self) -> None:
        workflow_path = FIXTURES / "valid" / "resume-smoke.yaml"
        fail_handlers = FIXTURES / "handlers" / "resume-fail.js"
        pass_handlers = FIXTURES / "handlers" / "resume-pass.js"
        with tempfile.TemporaryDirectory() as tmpdir:
            state_db = Path(tmpdir) / "workflow-state.db"

            initial_run = run_node([
                "scripts/workflow-run.js",
                "--file",
                str(workflow_path),
                "--handlers",
                str(fail_handlers),
                "--state-db",
                str(state_db),
                "--run-id",
                "resume-vars-1",
                "--var",
                "taskDir=docs/artifacts/task-a",
                "--json",
            ])
            self.assertNotEqual(initial_run.returncode, 0)

            resumed_run = run_node([
                "scripts/workflow-run.js",
                "--resume-run-id",
                "resume-vars-1",
                "--handlers",
                str(pass_handlers),
                "--state-db",
                str(state_db),
                "--run-id",
                "resume-vars-2",
                "--var",
                "taskDir=docs/artifacts/task-b",
                "--json",
            ])
            self.assertNotEqual(resumed_run.returncode, 0)
            self.assertIn("input context changed", resumed_run.stderr)


if __name__ == "__main__":
    unittest.main()
