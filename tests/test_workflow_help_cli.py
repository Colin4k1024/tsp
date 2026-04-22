from __future__ import annotations

import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def run_node(args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["node", *args],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )


class WorkflowHelpCliTest(unittest.TestCase):
    def test_workflow_run_help(self) -> None:
        result = run_node(["scripts/workflow-run.js", "--help"])
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Usage: node scripts/workflow-run.js", result.stdout)
        self.assertIn("--resume-run-id <id>", result.stdout)
        self.assertIn("--var key=value", result.stdout)
        self.assertIn("--preview", result.stdout)
        self.assertIn("npm run workflow:list", result.stdout)

    def test_workflow_runs_help(self) -> None:
        result = run_node(["scripts/workflow-runs.js", "--help"])
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Usage: node scripts/workflow-runs.js", result.stdout)
        self.assertIn("--limit <number>", result.stdout)
        self.assertIn("inputContext", result.stdout)
        self.assertIn("--workflow-name <name>", result.stdout)
        self.assertIn("--status <status>", result.stdout)

    def test_workflow_list_help(self) -> None:
        result = run_node(["scripts/workflow-list.js", "--help"])
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Usage: node scripts/workflow-list.js", result.stdout)
        self.assertIn("--bundled-root <path>", result.stdout)
        self.assertIn("--name <workflow>", result.stdout)

    def test_validate_workflows_help(self) -> None:
        result = run_node(["scripts/validate-workflows.js", "--help"])
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Usage: node scripts/validate-workflows.js", result.stdout)
        self.assertIn("--json", result.stdout)

    def test_workflow_readiness_help(self) -> None:
        result = run_node(["scripts/workflow-readiness.js", "--help"])
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Usage: node scripts/workflow-readiness.js", result.stdout)
        self.assertIn("--phase <phase>", result.stdout)
        self.assertIn("--task-dir <path>", result.stdout)
        self.assertIn("Repeatable for batch checks", result.stdout)

    def test_workflow_help_router_help(self) -> None:
        result = run_node(["scripts/workflow-help.js", "--help"])
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Usage: node scripts/workflow-help.js", result.stdout)
        self.assertIn("--task-dir <path>", result.stdout)
        self.assertIn("--prefer-quick", result.stdout)
        self.assertIn("artifact", result.stdout)


if __name__ == "__main__":
    unittest.main()
