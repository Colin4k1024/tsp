from __future__ import annotations

import json
import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "tests" / "fixtures" / "workflow-engine"


def run_node(args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["node", *args],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


class WorkflowListCliTest(unittest.TestCase):
    def test_workflow_list_shows_required_vars_in_json_output(self) -> None:
        result = run_node(["scripts/workflow-list.js", "--json"])
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        release_workflow = next(
            item for item in payload["workflows"] if item["name"] == "team-release-readiness"
        )
        self.assertEqual(release_workflow["requiredVars"], ["targetPhase", "taskDir"])

    def test_workflow_list_shows_required_vars_in_human_output(self) -> None:
        result = run_node(["scripts/workflow-list.js"])
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("team-release-readiness", result.stdout)
        self.assertIn("Required vars: targetPhase, taskDir", result.stdout)

    def test_workflow_list_shows_empty_required_vars_for_static_workflow(self) -> None:
        result = run_node([
            "scripts/workflow-list.js",
            "--cwd",
            str(ROOT),
            "--bundled-root",
            str(FIXTURES / "valid"),
            "--json",
        ])
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        workflow = next(item for item in payload["workflows"] if item["name"] == "basic-valid")
        self.assertEqual(workflow["requiredVars"], [])

    def test_workflow_list_can_filter_by_name(self) -> None:
        result = run_node([
            "scripts/workflow-list.js",
            "--name",
            "team-release-readiness",
            "--json",
        ])
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertEqual(len(payload["workflows"]), 1)
        self.assertEqual(payload["workflows"][0]["name"], "team-release-readiness")


if __name__ == "__main__":
    unittest.main()
