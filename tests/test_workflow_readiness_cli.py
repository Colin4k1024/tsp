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


class WorkflowReadinessCliTest(unittest.TestCase):
    def test_help(self) -> None:
        result = run_node(["scripts/workflow-readiness.js", "--help"])
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Usage: node scripts/workflow-readiness.js", result.stdout)
        self.assertIn("--phase <phase>", result.stdout)
        self.assertIn("--task-dir <path>", result.stdout)
        self.assertIn("Repeatable for batch checks", result.stdout)

    def test_preview_release_readiness(self) -> None:
        task_dir = ROOT / "tests" / "fixtures" / "workflow-valid"
        result = run_node([
            "scripts/workflow-readiness.js",
            "--phase",
            "release",
            "--task-dir",
            str(task_dir),
            "--preview",
            "--json",
        ])
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertEqual(payload["workflowName"], "team-release-readiness")
        self.assertEqual(payload["inputContext"]["targetPhase"], "release")
        self.assertEqual(payload["inputContext"]["taskDir"], str(task_dir))

    def test_execute_closeout_readiness(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            task_dir = create_phase_ready_task_dir(
                tmpdir,
                current_phase="release",
                target_phase="closeout",
                include_release_artifacts=True,
            )
            result = run_node([
                "scripts/workflow-readiness.js",
                "--phase",
                "closeout",
                "--task-dir",
                str(task_dir),
                "--json",
            ])
            self.assertEqual(result.returncode, 0, result.stderr)
            payload = json.loads(result.stdout)
            self.assertEqual(payload["workflowName"], "team-closeout-readiness")
            self.assertEqual(payload["status"], "succeeded")
            self.assertEqual(payload["inputContext"]["targetPhase"], "closeout")

    def test_rejects_invalid_phase(self) -> None:
        result = run_node([
            "scripts/workflow-readiness.js",
            "--phase",
            "deploy",
            "--task-dir",
            str(ROOT / "tests" / "fixtures" / "workflow-valid"),
        ])
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Unsupported phase: deploy", result.stderr)

    def test_accepts_phase_alias(self) -> None:
        task_dir = ROOT / "tests" / "fixtures" / "workflow-valid"
        result = run_node([
            "scripts/workflow-readiness.js",
            "--phase",
            "rel",
            "--task-dir",
            str(task_dir),
            "--preview",
            "--json",
        ])
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertEqual(payload["workflowName"], "team-release-readiness")
        self.assertEqual(payload["inputContext"]["targetPhase"], "release")

    def test_batch_mode_returns_multiple_results(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            release_task_dir = create_phase_ready_task_dir(
                tmpdir,
                current_phase="release",
                target_phase="closeout",
                include_release_artifacts=True,
            )
            second_task_dir = create_phase_ready_task_dir(
                tmpdir + "-second",
                current_phase="release",
                target_phase="closeout",
                include_release_artifacts=True,
            )
            result = run_node([
                "scripts/workflow-readiness.js",
                "--phase",
                "close",
                "--task-dir",
                str(release_task_dir),
                "--task-dir",
                str(second_task_dir),
                "--json",
            ])
            self.assertEqual(result.returncode, 0, result.stderr)
            payload = json.loads(result.stdout)
            self.assertEqual(len(payload), 2)
            self.assertEqual(payload[0]["payload"]["workflowName"], "team-closeout-readiness")
            self.assertEqual(payload[1]["payload"]["inputContext"]["targetPhase"], "closeout")


if __name__ == "__main__":
    unittest.main()
